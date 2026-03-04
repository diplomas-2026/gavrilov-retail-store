package com.company.product.api.dto.order;

import com.company.product.api.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
        @NotNull(message = "Статус обязателен")
        OrderStatus status
) {
}
