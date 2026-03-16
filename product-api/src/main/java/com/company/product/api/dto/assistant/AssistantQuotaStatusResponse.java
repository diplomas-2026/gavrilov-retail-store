package com.company.product.api.dto.assistant;

import java.time.OffsetDateTime;

public record AssistantQuotaStatusResponse(
        Integer dailyTokenLimit,
        long usedTokens,
        long remainingTokens,
        OffsetDateTime periodStart,
        OffsetDateTime periodEnd,
        String timeZone
) {
}

