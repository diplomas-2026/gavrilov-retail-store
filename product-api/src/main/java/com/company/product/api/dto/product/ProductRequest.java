package com.company.product.api.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank(message = "SKU обязателен")
        @Size(max = 60, message = "SKU не должен превышать 60 символов")
        String sku,
        @NotBlank(message = "Название обязательно")
        @Size(max = 160, message = "Название не должно превышать 160 символов")
        String name,
        @Size(max = 2000, message = "Описание не должно превышать 2000 символов")
        String description,
        @NotNull(message = "Цена обязательна")
        @DecimalMin(value = "0.01", message = "Цена должна быть больше 0")
        BigDecimal price,
        @DecimalMin(value = "0.00", message = "Старая цена не может быть отрицательной")
        BigDecimal oldPrice,
        @NotNull(message = "Остаток обязателен")
        @Min(value = 0, message = "Остаток не может быть отрицательным")
        Integer stockQty,
        @NotNull(message = "Категория обязательна")
        Long categoryId,
        boolean active,
        List<@NotBlank(message = "URL изображения не может быть пустым") String> images
) {
}
