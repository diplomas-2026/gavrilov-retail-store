package com.company.product.api.service;

import com.company.product.api.entity.CategoryEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.repository.CategoryRepository;
import com.company.product.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssistantCatalogContextService {

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

    public String buildCatalogContext() {
        List<CategoryEntity> categories = categoryRepository.findByActiveTrueOrderByIdAsc();
        List<ProductEntity> products = productRepository.findByActiveTrueOrderByIdAsc();

        StringBuilder sb = new StringBuilder(32_768);
        boolean trimmed = false;
        sb.append("ДАННЫЕ МАГАЗИНА (для ответа пользователю)\n");
        sb.append("Важно: фото отсутствуют и не должны упоминаться.\n\n");

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
}
