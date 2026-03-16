package com.company.product.api.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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
            7) Пиши живо и дружелюбно. Допускаются эмоджи (1–3 на ответ), но не злоупотребляй.
            8) Важно: вместе с твоим сообщением интерфейс покажет карточки товаров по ID, которые ты укажешь отдельным списком. Поэтому в тексте (message) не нужно писать «ID: ...», «SKU: ...» и технические поля — лучше объясняй человеческими словами, почему эти варианты подходят.

            Формат ответа: строго JSON (без Markdown, без комментариев, без тройных кавычек, без ```).
            Ты должен вернуть объект с полями:
            - "message": строка, которую увидит пользователь (можно с переносами строк \\n).
            - "productIds": массив ID товаров (числа). Если ты ничего не рекомендуешь — верни [].

            Правила для productIds:
            - Включай только те ID, которые реально есть в переданном каталоге.
            - Если рекомендуешь товары — добавляй их ID в productIds (обычно 1–3 штуки).
            - Не придумывай ID.

            Пример:
            {"message":"Привет! Вот 2 отличных варианта диванов под твой запрос 🙂\\n\\nХочешь ткань или экокожу?","productIds":[1,5]}
            """;

    private final ChatClient chatClient;
    private final AssistantCatalogContextService catalogContextService;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public AssistantService(ChatClient.Builder chatClientBuilder,
                            AssistantCatalogContextService catalogContextService,
                            ObjectMapper objectMapper,
                            @Value("${spring.ai.gigachat.auth.bearer.api-key:}") String apiKey) {
        this.chatClient = chatClientBuilder.build();
        this.catalogContextService = catalogContextService;
        this.objectMapper = objectMapper;
        this.enabled = apiKey != null && !apiKey.isBlank();
    }

    public String ask(String question) {
        return askWithUsage(question).message();
    }

    public AssistantAnswer askWithUsage(String question) {
        if (!enabled) {
            throw new IllegalStateException("AI-помощник не настроен (не задан GIGACHAT_API_KEY)");
        }

        AssistantCatalogContextService.CatalogAnalysis analysis = catalogContextService.analyze(question);
        LocalAnswer strictLocalAnswer = buildStrictLocalAnswerIfNeeded(analysis);
        if (strictLocalAnswer != null) {
            return new AssistantAnswer(strictLocalAnswer.message(), strictLocalAnswer.productIds(), 0, 0, 0, "local");
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

        ParsedAssistantPayload parsed = parsePayload(content);

        String model = response.getMetadata() == null ? null : response.getMetadata().getModel();
        Usage usage = response.getMetadata() == null ? null : response.getMetadata().getUsage();

        Integer promptTokens = usage == null ? null : usage.getPromptTokens();
        Integer completionTokens = usage == null ? null : usage.getCompletionTokens();
        Integer totalTokens = usage == null ? null : usage.getTotalTokens();

        return new AssistantAnswer(parsed.message(), parsed.productIds(), promptTokens, completionTokens, totalTokens, model);
    }

    private static LocalAnswer buildStrictLocalAnswerIfNeeded(AssistantCatalogContextService.CatalogAnalysis analysis) {
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
                return new LocalAnswer(
                        "В каталоге нет товаров типа «" + type + "». Могу помочь выбрать другой товар из доступного ассортимента — что именно нужно?",
                        List.of()
                );
            }
            return new LocalAnswer(
                    "Похоже, под ваш бюджет до " + budget + " подходящих «" + type + "» сейчас нет 🙁\n\n"
                            + "Самый доступный вариант этого типа — «" + cheapestType.getName() + "».\n"
                            + "Если хотите, я покажу варианты при увеличении бюджета или подберу по стилю/размеру 🙂",
                    cheapestType.getId() == null ? List.of() : List.of(cheapestType.getId())
            );
        }

        if (type != null) {
            return new LocalAnswer(
                    "По запросу типа «" + type + "» в каталоге нет подходящих товаров. Хотите рассмотреть другой тип товара?",
                    List.of()
            );
        }

        // budget only
        return new LocalAnswer(
                "В каталоге нет товаров с бюджетом до " + budget + ". Хотите увеличить бюджет или уточнить категорию/тип товара?",
                List.of()
        );
    }

    private ParsedAssistantPayload parsePayload(String raw) {
        if (raw == null) {
            return new ParsedAssistantPayload("", List.of());
        }

        String trimmed = raw.trim();

        String candidate = trimmed;
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            candidate = trimmed.substring(firstBrace, lastBrace + 1);
        }

        try {
            JsonNode root = objectMapper.readTree(candidate);
            if (root == null || !root.isObject()) {
                return new ParsedAssistantPayload(trimmed, List.of());
            }

            String message = root.path("message").isTextual() ? root.path("message").asText() : null;

            List<Long> productIds = new ArrayList<>();
            JsonNode idsNode = root.path("productIds");
            if (idsNode.isArray()) {
                Set<Long> uniq = new LinkedHashSet<>();
                for (JsonNode n : idsNode) {
                    if (n == null) continue;
                    if (n.isIntegralNumber()) {
                        long id = n.asLong();
                        if (id > 0) uniq.add(id);
                    } else if (n.isTextual()) {
                        String s = n.asText().trim();
                        if (s.matches("\\d+")) {
                            long id = Long.parseLong(s);
                            if (id > 0) uniq.add(id);
                        }
                    }
                }
                productIds.addAll(uniq.stream().limit(6).toList());
            }

            if (message == null || message.isBlank()) {
                message = trimmed;
            }

            return new ParsedAssistantPayload(message, productIds);
        } catch (Exception ignored) {
            return new ParsedAssistantPayload(trimmed, List.of());
        }
    }

    public record AssistantAnswer(
            String message,
            List<Long> productIds,
            Integer promptTokens,
            Integer completionTokens,
            Integer totalTokens,
            String model
    ) {
    }

    private record ParsedAssistantPayload(
            String message,
            List<Long> productIds
    ) {
    }

    private record LocalAnswer(
            String message,
            List<Long> productIds
    ) {
    }
}
