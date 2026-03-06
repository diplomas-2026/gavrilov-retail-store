package com.company.product.api.dto.cart;

import java.math.BigDecimal;

public record CartItemResponse(
        Long productId,
        String name,
        BigDecimal price,
        Integer qty
) {
}
