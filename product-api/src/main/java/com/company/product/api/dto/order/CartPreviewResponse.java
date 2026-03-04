package com.company.product.api.dto.order;

import java.math.BigDecimal;
import java.util.List;

public record CartPreviewResponse(
        List<CartPreviewItemResponse> items,
        BigDecimal totalAmount
) {
}
