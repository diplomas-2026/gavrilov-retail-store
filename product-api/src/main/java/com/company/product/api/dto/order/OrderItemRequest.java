package com.company.product.api.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull(message = "Товар обязателен")
        Long productId,
        @NotNull(message = "Количество обязательно")
        @Min(value = 1, message = "Количество должно быть больше 0")
        Integer qty
) {
}
