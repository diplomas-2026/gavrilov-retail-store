package com.company.product.api.dto.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemUpsertRequest(
        @NotNull(message = "Количество обязательно")
        @Min(value = 1, message = "Количество должно быть не меньше 1")
        @Max(value = 999, message = "Количество не должно превышать 999")
        Integer qty
) {
}
