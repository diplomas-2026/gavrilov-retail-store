package com.company.product.api.dto.assistant;

public record SendAssistantMessageResponse(
        AssistantMessageDto userMessage,
        AssistantMessageDto assistantMessage
) {
}

