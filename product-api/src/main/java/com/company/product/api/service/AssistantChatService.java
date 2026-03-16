package com.company.product.api.service;

import com.company.product.api.dto.assistant.AssistantMessageDto;
import com.company.product.api.dto.assistant.SendAssistantMessageResponse;
import com.company.product.api.entity.AssistantMessageAuthor;
import com.company.product.api.entity.AssistantMessageEntity;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.repository.AssistantMessageRepository;
import org.springframework.util.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssistantChatService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;
    private static final int ANSWER_TIMEOUT_SECONDS = 15;

    private final AssistantService assistantService;
    private final AssistantMessageRepository messageRepository;
    private final AssistantQuotaService assistantQuotaService;

    public AssistantChatService(AssistantService assistantService,
                                AssistantMessageRepository messageRepository,
                                AssistantQuotaService assistantQuotaService) {
        this.assistantService = assistantService;
        this.messageRepository = messageRepository;
        this.assistantQuotaService = assistantQuotaService;
    }

    public List<AssistantMessageDto> listMessages(UserEntity user, Long sinceId, Integer limit) {
        int safeLimit = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(1, limit), MAX_LIMIT);

        if (sinceId != null) {
            return messageRepository.findByUserAndIdGreaterThanOrderByIdAsc(
                            user,
                            sinceId,
                            PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.ASC, "id"))
                    ).stream()
                    .map(AssistantChatService::toDto)
                    .toList();
        }

        List<AssistantMessageEntity> latestDesc = messageRepository.findByUserOrderByIdDesc(
                user,
                PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "id"))
        );
        Collections.reverse(latestDesc);

        return latestDesc.stream().map(AssistantChatService::toDto).toList();
    }

    public SendAssistantMessageResponse sendMessage(UserEntity user, String question) {
        AssistantQuotaService.AssistantQuotaStatus quota = assistantQuotaService.getStatus();

        AssistantMessageEntity userMessage = new AssistantMessageEntity();
        userMessage.setUser(user);
        userMessage.setAuthor(AssistantMessageAuthor.USER);
        userMessage.setMessage(question);
        userMessage.setError(false);
        userMessage = messageRepository.save(userMessage);

        boolean error = false;
        String answer;
        List<Long> recommendedProductIds = List.of();
        Integer promptTokens = null;
        Integer completionTokens = null;
        Integer totalTokens = null;
        String model = null;
        try {
            if (assistantQuotaService.isExceeded(quota)) {
                error = true;
                answer = buildQuotaExceededMessage(quota);
            } else {
                AssistantService.AssistantAnswer result = askWithTimeout(question);
                answer = result.message();
                recommendedProductIds = result.productIds() == null ? List.of() : result.productIds();
                promptTokens = result.promptTokens();
                completionTokens = result.completionTokens();
                totalTokens = result.totalTokens();
                model = result.model();
            }
        } catch (Exception e) {
            error = true;
            answer = formatError(e);
        }

        AssistantMessageEntity assistantMessage = new AssistantMessageEntity();
        assistantMessage.setUser(user);
        assistantMessage.setAuthor(AssistantMessageAuthor.ASSISTANT);
        assistantMessage.setMessage(answer);
        assistantMessage.setRecommendedProductIds(serializeRecommendedProductIds(recommendedProductIds));
        assistantMessage.setError(error);
        assistantMessage.setPromptTokens(promptTokens);
        assistantMessage.setCompletionTokens(completionTokens);
        assistantMessage.setTotalTokens(totalTokens);
        assistantMessage.setModel(model);
        assistantMessage = messageRepository.save(assistantMessage);

        return new SendAssistantMessageResponse(toDto(userMessage), toDto(assistantMessage));
    }

    private static String buildQuotaExceededMessage(AssistantQuotaService.AssistantQuotaStatus quota) {
        String limit = quota.dailyTokenLimit() == null ? "без лимита" : String.valueOf(quota.dailyTokenLimit());
        return "Лимит токенов AI‑помощника на сутки исчерпан. "
                + "Лимит: " + limit + ", использовано: " + quota.usedTokens()
                + ". Сброс лимита: " + quota.periodEnd() + " (" + quota.timeZone() + ").";
    }

    private static AssistantMessageDto toDto(AssistantMessageEntity entity) {
        return new AssistantMessageDto(
                entity.getId(),
                entity.getAuthor(),
                entity.getMessage(),
                parseRecommendedProductIds(entity.getRecommendedProductIds()),
                entity.isError(),
                entity.getPromptTokens(),
                entity.getCompletionTokens(),
                entity.getTotalTokens(),
                entity.getModel(),
                entity.getCreatedAt()
        );
}

    private static String serializeRecommendedProductIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        String joined = ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .limit(12)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        return joined.isBlank() ? null : joined;
    }

    private static List<Long> parseRecommendedProductIds(String raw) {
        if (!StringUtils.hasText(raw)) return List.of();
        String[] parts = raw.split(",");
        List<Long> ids = new ArrayList<>();
        for (String p : parts) {
            String s = p == null ? "" : p.trim();
            if (s.isEmpty()) continue;
            if (!s.matches("\\d+")) continue;
            try {
                long id = Long.parseLong(s);
                if (id > 0) ids.add(id);
            } catch (Exception ignored) {
                // ignore bad tokens
            }
        }
        return ids.stream().distinct().limit(12).toList();
    }

    private AssistantService.AssistantAnswer askWithTimeout(String question) {
        try {
            return CompletableFuture
                    .supplyAsync(() -> assistantService.askWithUsage(question))
                    .orTimeout(ANSWER_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .join();
        } catch (CompletionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw e;
        }
    }

    private static String formatError(Exception e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }

        String msg = e.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = e.toString();
        }

        String rootMsg = root.getMessage();
        if (rootMsg != null && !rootMsg.isBlank() && !rootMsg.equals(msg)) {
            msg = msg + " | Причина: " + root.getClass().getSimpleName() + ": " + rootMsg;
        }
        return e.getClass().getSimpleName() + ": " + msg;
    }
}
