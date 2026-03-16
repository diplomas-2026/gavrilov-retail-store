package com.company.product.api.service;

import org.springframework.ai.chat.client.ChatClient;
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
}

