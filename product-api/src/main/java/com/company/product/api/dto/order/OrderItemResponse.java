package com.company.product.api.dto.order;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        Integer qty,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
