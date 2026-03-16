package com.company.product.api.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;

@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT = """
            Ты — AI-консультант интернет-магазина (демо).

            Твоя задача: помогать покупателю выбрать товар из каталога магазина, сравнивать товары, отвечать на вопросы о цене, наличии, характеристиках и категориях.

            Правила:
            1) Отвечай ТОЛЬКО по теме выбора/покупки товаров и каталога магазина. Если вопрос не по теме магазина — коротко ответь: «Я могу помочь только с выбором товаров магазина.»
            2) Не выдумывай факты. Используй только данные магазина, переданные в сообщении пользователя.
            3) Не упоминай фотографии и не проси их: фото недоступны.
            4) Строго следуй ограничениям пользователя (бюджет, тип товара, категория, размеры и т.п.). Запрещено рекомендовать товары дороже указанного бюджета.
               Если подходящих товаров нет — так и скажи и попроси расширить условия.
            5) Если пользователь явно просит конкретный тип товара (например, «диван»), НЕ предлагай другие типы (например, шкафы/люстры), даже если они есть в каталоге.
            6) Помогай выбрать: если данных от пользователя не хватает, задай максимум 2 уточняющих вопроса. Иначе предложи до 3 вариантов с аргументацией.
            7) В рекомендациях обязательно указывай ID товара и SKU, цену и остаток. Пиши это человеко-понятно, без формата «productId=...; sku=...;».
            8) Пиши живо и дружелюбно. Допускаются эмоджи (1–3 на ответ), но не злоупотребляй.

            Формат ответа:
            - Короткий вывод (1–2 предложения, дружелюбный тон).
            - Далее либо 1–2 уточняющих вопроса, либо блок «Рекомендации» списком (каждый пункт — отдельный товар).
            - Для каждого товара:
              • Название (жирным или с эмоджи)
              • Цена и остаток в одной строке
              • На отдельной строке: «SKU: ... • ID: ...»
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

        AssistantCatalogContextService.CatalogAnalysis analysis = catalogContextService.analyze(question);
        String strictLocalAnswer = buildStrictLocalAnswerIfNeeded(analysis);
        if (strictLocalAnswer != null) {
            return new AssistantAnswer(strictLocalAnswer, 0, 0, 0, "local");
        }

        String catalogContext = analysis.context();
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

    private static String buildStrictLocalAnswerIfNeeded(AssistantCatalogContextService.CatalogAnalysis analysis) {
        String type = analysis.type();
        BigDecimal budget = analysis.budget();

        if ((type == null && budget == null) || !analysis.matches().isEmpty()) {
            return null;
        }

        // Если пользователь задал ограничения, но по ним нет совпадений — отвечаем строго и без LLM,
        // чтобы не "рекомендовать" не подходящие товары.
        if (type != null && budget != null) {
            var cheapestType = analysis.typeMatches().stream()
                    .min(Comparator.comparing(p -> p.getPrice() == null ? BigDecimal.ZERO : p.getPrice()))
                    .orElse(null);
            if (cheapestType == null) {
                return "В каталоге нет товаров типа «" + type + "». Могу помочь выбрать другой товар из доступного ассортимента — что именно нужно?";
            }
            return "В каталоге нет товаров типа «" + type + "» с бюджетом до " + budget + ". "
                    + "Самый доступный вариант этого типа: " + cheapestType.getName()
                    + " (productId=" + cheapestType.getId()
                    + "; sku=" + cheapestType.getSku()
                    + "; цена " + cheapestType.getPrice()
                    + "; остаток " + cheapestType.getStockQty() + ").\n\n"
                    + "Хотите увеличить бюджет или рассмотреть другой тип товара?";
        }

        if (type != null) {
            return "По запросу типа «" + type + "» в каталоге нет подходящих товаров. Хотите рассмотреть другой тип товара?";
        }

        // budget only
        return "В каталоге нет товаров с бюджетом до " + budget + ". Хотите увеличить бюджет или уточнить категорию/тип товара?";
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
