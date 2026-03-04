package com.company.product.api.dto.order;

import com.company.product.api.entity.DeliveryType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OrderCreateRequest(
        @NotEmpty(message = "Добавьте товары в заказ")
        List<@Valid OrderItemRequest> items,
        @NotNull(message = "Выберите тип доставки")
        DeliveryType deliveryType,
        Long pickupPointId,
        @Size(max = 255, message = "Адрес не должен превышать 255 символов")
        String deliveryAddress,
        @Size(max = 600, message = "Комментарий не должен превышать 600 символов")
        String comment
) {
}
