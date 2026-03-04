package com.company.product.api.dto.product;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String sku,
        String name,
        String description,
        BigDecimal price,
        BigDecimal oldPrice,
        Integer stockQty,
        boolean active,
        Long categoryId,
        String categoryName,
        List<String> images
) {
}
