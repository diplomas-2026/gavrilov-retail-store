package com.company.product.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Введите имя")
        @Size(max = 120, message = "Имя не должно превышать 120 символов")
        String fullName,
        @Email(message = "Введите корректный email")
        @NotBlank(message = "Email обязателен")
        String email,
        @NotBlank(message = "Пароль обязателен")
        @Size(min = 8, max = 72, message = "Пароль должен быть от 8 до 72 символов")
        String password
) {
}
