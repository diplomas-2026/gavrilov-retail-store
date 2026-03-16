package com.company.product.api.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT = """
            Ты — AI-консультант интернет-магазина (демо).

            Твоя задача: помогать покупателю выбрать товар из каталога магазина, сравнивать товары, отвечать на вопросы о цене, наличии, характеристиках и категориях.

            Правила:
            1) Отвечай ТОЛЬКО по теме выбора/покупки товаров и каталога магазина. Если вопрос не по теме магазина — коротко ответь: «Я могу помочь только с выбором товаров магазина.»
            2) Не выдумывай факты. Используй только данные магазина, переданные в сообщении пользователя.
            3) Не упоминай фотографии и не проси их: фото недоступны.
            4) Помогай выбрать: если данных от пользователя не хватает, задай максимум 2 уточняющих вопроса. Иначе предложи до 3 вариантов с аргументацией.
            5) В рекомендациях обязательно указывай: productId, sku, цену и остаток.

            Формат ответа:
            - Короткий вывод (1–2 предложения).
            - Далее либо 1–2 уточняющих вопроса, либо блок «Рекомендации» списком.
            """;

    private final ChatClient chatClient;
    private final AssistantCatalogContextService catalogContextService;
    private final boolean enabled;

    public AssistantService(ChatClient.Builder chatClientBuilder,
                            AssistantCatalogContextService catalogContextService,
                            @Value("${spring.ai.gigachat.auth.bearer.api-key:}") String apiKey) {
        this.chatClient = chatClientBuilder.build();
        this.catalogContextService = catalogContextService;
        this.enabled = apiKey != null && !apiKey.isBlank();
    }

    public String ask(String question) {
        return askWithUsage(question).content();
    }

    public AssistantAnswer askWithUsage(String question) {
        if (!enabled) {
            throw new IllegalStateException("AI-помощник не настроен (не задан GIGACHAT_API_KEY)");
        }

        String catalogContext = catalogContextService.buildCatalogContext();
        String userPrompt = catalogContext + "\n\nВопрос пользователя:\n" + question;

        ChatResponse response = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(userPrompt)
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
