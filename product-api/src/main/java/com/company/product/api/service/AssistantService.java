package com.company.product.api.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

    private final ChatClient chatClient;
    private final boolean enabled;

    public AssistantService(ChatClient.Builder chatClientBuilder,
                            @Value("${spring.ai.gigachat.auth.bearer.api-key:}") String apiKey) {
        this.chatClient = chatClientBuilder.build();
        this.enabled = apiKey != null && !apiKey.isBlank();
    }

    public String ask(String question) {
        if (!enabled) {
            throw new IllegalStateException("AI-помощник не настроен (не задан GIGACHAT_API_KEY)");
        }

        // Максимально просто: вопрос -> ответ, без контекста и без дополнительного промпта.
        return chatClient.prompt()
                .user(question)
                .call()
                .content();
    }

    public AssistantAnswer askWithUsage(String question) {
        if (!enabled) {
            throw new IllegalStateException("AI-помощник не настроен (не задан GIGACHAT_API_KEY)");
        }

        ChatResponse response = chatClient.prompt()
                .user(question)
                .call()
                .chatResponse();

        String content = response.getResult() == null || response.getResult().getOutput() == null
                ? null
                : response.getResult().getOutput().getText();

        String model = response.getMetadata() == null ? null : response.getMetadata().getModel();
        Usage usage = response.getMetadata() == null ? null : response.getMetadata().getUsage();

        Integer promptTokens = usage == null ? null : usage.getPromptTokens();
        Integer completionTokens = usage == null ? null : usage.getCompletionTokens();
        Integer totalTokens = usage == null ? null : usage.getTotalTokens();

        return new AssistantAnswer(content, promptTokens, completionTokens, totalTokens, model);
    }

    public record AssistantAnswer(
            String content,
            Integer promptTokens,
            Integer completionTokens,
            Integer totalTokens,
            String model
    ) {
    }
}
