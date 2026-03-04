package com.company.product.api.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CartPreviewRequest(
        @NotEmpty(message = "Корзина не может быть пустой")
        List<@Valid OrderItemRequest> items
) {
}
