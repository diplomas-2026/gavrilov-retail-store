package com.company.product.api.service;

import com.company.product.api.dto.assistant.AssistantMessageDto;
import com.company.product.api.dto.assistant.SendAssistantMessageResponse;
import com.company.product.api.entity.AssistantMessageAuthor;
import com.company.product.api.entity.AssistantMessageEntity;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.repository.AssistantMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class AssistantChatService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;

    private final AssistantService assistantService;
    private final AssistantMessageRepository messageRepository;

    public AssistantChatService(AssistantService assistantService,
                                AssistantMessageRepository messageRepository) {
        this.assistantService = assistantService;
        this.messageRepository = messageRepository;
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
        AssistantMessageEntity userMessage = new AssistantMessageEntity();
        userMessage.setUser(user);
        userMessage.setAuthor(AssistantMessageAuthor.USER);
        userMessage.setMessage(question);
        userMessage.setError(false);
        userMessage = messageRepository.save(userMessage);

        boolean error = false;
        String answer;
        try {
            answer = assistantService.ask(question);
        } catch (Exception e) {
            error = true;
            answer = formatError(e);
        }

        AssistantMessageEntity assistantMessage = new AssistantMessageEntity();
        assistantMessage.setUser(user);
        assistantMessage.setAuthor(AssistantMessageAuthor.ASSISTANT);
        assistantMessage.setMessage(answer);
        assistantMessage.setError(error);
        assistantMessage = messageRepository.save(assistantMessage);

        return new SendAssistantMessageResponse(toDto(userMessage), toDto(assistantMessage));
    }

    private static AssistantMessageDto toDto(AssistantMessageEntity entity) {
        return new AssistantMessageDto(
                entity.getId(),
                entity.getAuthor(),
                entity.getMessage(),
                entity.isError(),
                entity.getCreatedAt()
        );
    }

    private static String formatError(Exception e) {
        String msg = e.getMessage();
        if (msg == null || msg.isBlank()) {
            return e.toString();
        }
        return e.getClass().getSimpleName() + ": " + msg;
    }
}

