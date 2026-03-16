package com.company.product.api.service;

import com.company.product.api.entity.CategoryEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.repository.CategoryRepository;
import com.company.product.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AssistantCatalogContextService {

    private static final Pattern BUDGET_PATTERN = Pattern.compile("(?iu)\\bдо\\s*([0-9][0-9\\s]{1,15})");
    private static final List<String> TYPE_KEYWORDS = List.of(
            "диван",
            "кресло",
            "стул",
            "стол",
            "шкаф",
            "комод",
            "кровать",
            "люстра",
            "лампа",
            "светильник",
            "зеркало",
            "корзина"
    );

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final int maxChars;
    private final String trimmedNote = "\n...\n(Список был обрезан из-за лимита контекста.)\n";

    public AssistantCatalogContextService(CategoryRepository categoryRepository,
                                         ProductRepository productRepository,
                                         @Value("${app.assistant.catalog.max-chars:60000}") int maxChars) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.maxChars = Math.max(5_000, maxChars);
    }

    public CatalogAnalysis analyze(String question) {
        List<CategoryEntity> categories = categoryRepository.findByActiveTrueOrderByIdAsc();
        List<ProductEntity> products = productRepository.findByActiveTrueOrderByIdAsc();

        String type = question == null ? null : detectType(question);
        BigDecimal budget = question == null ? null : parseBudget(question);

        List<ProductEntity> matches = question == null ? List.of() : findMatches(products, type, budget);
        List<ProductEntity> typeMatches = type == null ? List.of() : findMatches(products, type, null);

        String context = buildCatalogContextInternal(question, categories, products, type, budget, matches);
        return new CatalogAnalysis(context, type, budget, matches, typeMatches);
    }

    public String buildCatalogContext(String question) {
        return analyze(question).context();
    }

    private String buildCatalogContextInternal(String question,
                                              List<CategoryEntity> categories,
                                              List<ProductEntity> products,
                                              String type,
                                              BigDecimal budget,
                                              List<ProductEntity> matches) {
        StringBuilder sb = new StringBuilder(32_768);
        boolean trimmed = false;
        sb.append("ДАННЫЕ МАГАЗИНА (для ответа пользователю)\n");
        sb.append("Важно: фото отсутствуют и не должны упоминаться.\n\n");

        if (question != null && !question.isBlank()) {
            sb.append("Запрос пользователя (для ориентира):\n");
            if (type != null) {
                sb.append("- тип: ").append(type).append("\n");
            }
            if (budget != null) {
                sb.append("- бюджет: до ").append(budget).append("\n");
            }
            if (type == null && budget == null) {
                sb.append("- (не удалось выделить ограничения)\n");
            }

            sb.append("\nПодходящие товары (эвристика, для ускорения выбора):\n");
            if (matches.isEmpty()) {
                sb.append("- (не найдено точных совпадений по условиям)\n");
            } else {
                for (ProductEntity p : matches) {
                    sb.append("- productId=").append(p.getId())
                            .append("; sku=").append(safe(p.getSku()))
                            .append("; name=").append(safe(p.getName()))
                            .append("; category=").append(p.getCategory() == null ? "—" : safe(p.getCategory().getName()))
                            .append("; price=").append(p.getPrice())
                            .append("; stockQty=").append(p.getStockQty());
                    sb.append("\n");
                    trimmed = trimIfNeeded(sb);
                    if (trimmed) return sb.toString();
                }
            }
            sb.append("\n");
        }

        sb.append("Категории:\n");
        for (CategoryEntity c : categories) {
            sb.append("- categoryId=").append(c.getId())
                    .append("; name=").append(safe(c.getName()))
                    .append("; slug=").append(safe(c.getSlug()));
            if (c.getDescription() != null && !c.getDescription().isBlank()) {
                sb.append("; description=").append(safe(c.getDescription()));
            }
            sb.append("\n");
            trimmed = trimIfNeeded(sb);
            if (trimmed) return sb.toString();
        }

        sb.append("\nТовары:\n");
        for (ProductEntity p : products) {
            sb.append("- productId=").append(p.getId())
                    .append("; sku=").append(safe(p.getSku()))
                    .append("; name=").append(safe(p.getName()))
                    .append("; category=").append(p.getCategory() == null ? "—" : safe(p.getCategory().getName()))
                    .append("; price=").append(p.getPrice())
                    .append("; oldPrice=").append(p.getOldPrice() == null ? "—" : p.getOldPrice())
                    .append("; stockQty=").append(p.getStockQty())
                    .append("; active=").append(p.isActive());
            if (p.getDescription() != null && !p.getDescription().isBlank()) {
                sb.append("; description=").append(safe(p.getDescription()));
            }
            sb.append("\n");
            trimmed = trimIfNeeded(sb);
            if (trimmed) return sb.toString();
        }

        return sb.toString();
    }

    public String buildCatalogContext() {
        return buildCatalogContext(null);
    }

    private boolean trimIfNeeded(StringBuilder sb) {
        if (sb.length() <= maxChars) {
            return false;
        }
        int cut = Math.max(0, maxChars - 200);
        if (cut < sb.length()) {
            sb.setLength(cut);
        }
        sb.append(trimmedNote);
        return true;
    }

    private static String safe(String s) {
        if (s == null) return "";
        return s.replace("\r", " ").replace("\n", " ").trim();
    }

    private static BigDecimal parseBudget(String question) {
        Matcher m = BUDGET_PATTERN.matcher(question);
        if (!m.find()) {
            return null;
        }
        String raw = m.group(1).replace(" ", "");
        try {
            return new BigDecimal(raw);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String detectType(String question) {
        String q = question.toLowerCase(Locale.ROOT);
        for (String t : TYPE_KEYWORDS) {
            if (q.contains(t)) {
                return t;
            }
        }
        return null;
    }

    private static List<ProductEntity> findMatches(List<ProductEntity> products, String type, BigDecimal budget) {
        List<ScoredProduct> scored = new ArrayList<>();
        for (ProductEntity p : products) {
            if (!p.isActive()) continue;
            if (p.getStockQty() != null && p.getStockQty() <= 0) continue;

            String name = safe(p.getName()).toLowerCase(Locale.ROOT);
            String desc = safe(p.getDescription()).toLowerCase(Locale.ROOT);
            String cat = p.getCategory() == null ? "" : safe(p.getCategory().getName()).toLowerCase(Locale.ROOT);

            if (budget != null && p.getPrice() != null && p.getPrice().compareTo(budget) > 0) {
                continue;
            }

            int score = 0;
            if (type != null) {
                boolean typeHit = name.contains(type) || desc.contains(type) || cat.contains(type);
                if (!typeHit) {
                    continue;
                }
                if (name.contains(type)) score += 5;
                if (desc.contains(type)) score += 3;
                if (cat.contains(type)) score += 2;
            } else {
                score += 1;
            }

            scored.add(new ScoredProduct(p, score));
        }

        scored.sort((a, b) -> {
            int byScore = Integer.compare(b.score, a.score);
            if (byScore != 0) return byScore;
            BigDecimal ap = a.product.getPrice() == null ? BigDecimal.ZERO : a.product.getPrice();
            BigDecimal bp = b.product.getPrice() == null ? BigDecimal.ZERO : b.product.getPrice();
            return ap.compareTo(bp);
        });

        return scored.stream().limit(10).map(sp -> sp.product).toList();
    }

    private record ScoredProduct(ProductEntity product, int score) {
    }

    public record CatalogAnalysis(
            String context,
            String type,
            BigDecimal budget,
            List<ProductEntity> matches,
            List<ProductEntity> typeMatches
    ) {
    }
}
