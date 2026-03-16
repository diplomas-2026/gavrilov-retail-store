package com.company.product.api.dto.assistant;

import com.company.product.api.entity.AssistantMessageAuthor;

import java.time.OffsetDateTime;

public record AssistantMessageDto(
        Long id,
        AssistantMessageAuthor author,
        String message,
        boolean isError,
        OffsetDateTime createdAt
) {
}

