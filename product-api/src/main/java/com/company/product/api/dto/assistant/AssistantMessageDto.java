package com.company.product.api.dto.assistant;

import com.company.product.api.entity.AssistantMessageAuthor;

import java.time.OffsetDateTime;
import java.util.List;

public record AssistantMessageDto(
        Long id,
        AssistantMessageAuthor author,
        String message,
        List<Long> recommendedProductIds,
        boolean isError,
        Integer promptTokens,
        Integer completionTokens,
        Integer totalTokens,
        String model,
        OffsetDateTime createdAt
) {
}
