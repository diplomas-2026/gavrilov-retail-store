package com.company.product.api.dto.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AskAssistantRequest(
        @NotBlank(message = "Вопрос обязателен")
        @Size(max = 500, message = "Вопрос слишком длинный (максимум 500 символов)")
        String question
) {
}

