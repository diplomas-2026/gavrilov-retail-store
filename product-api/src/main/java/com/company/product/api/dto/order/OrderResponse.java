package com.company.product.api.dto.order;

import com.company.product.api.entity.DeliveryType;
import com.company.product.api.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String customerEmail,
        String customerName,
        OrderStatus status,
        BigDecimal totalAmount,
        DeliveryType deliveryType,
        Long pickupPointId,
        String pickupPointName,
        String pickupPointProvider,
        String deliveryAddress,
        String comment,
        String pickupCode,
        OffsetDateTime createdAt,
        List<OrderItemResponse> items
) {
}
