package com.company.product.api.dto.assistant;

import java.util.List;

public record ListAssistantMessagesResponse(
        List<AssistantMessageDto> messages
) {
}

