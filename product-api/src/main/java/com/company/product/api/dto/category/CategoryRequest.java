package com.company.product.api.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Название обязательно")
        @Size(max = 80, message = "Название не должно превышать 80 символов")
        String name,
        @NotBlank(message = "Slug обязателен")
        @Size(max = 80, message = "Slug не должен превышать 80 символов")
        String slug,
        @Size(max = 400, message = "Описание не должно превышать 400 символов")
        String description,
        boolean active
) {
}
