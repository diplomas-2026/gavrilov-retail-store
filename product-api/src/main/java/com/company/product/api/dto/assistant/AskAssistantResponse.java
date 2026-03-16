package com.company.product.api.dto.assistant;

import java.util.List;

public record AskAssistantResponse(
        String message,
        List<Long> recommendedProductIds
) {
}
