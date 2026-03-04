package com.company.product.api.dto.pickup;

import com.company.product.api.entity.PickupProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PickupPointRequest(
        @NotNull(message = "Укажите провайдера")
        PickupProvider provider,
        @NotBlank(message = "Укажите название пункта")
        @Size(max = 120, message = "Название пункта не должно превышать 120 символов")
        String name,
        @NotBlank(message = "Укажите адрес пункта")
        @Size(max = 255, message = "Адрес не должен превышать 255 символов")
        String address,
        @Size(max = 40, message = "Телефон не должен превышать 40 символов")
        String phone,
        @Size(max = 120, message = "График не должен превышать 120 символов")
        String workHours,
        @NotNull(message = "Укажите широту")
        Double latitude,
        @NotNull(message = "Укажите долготу")
        Double longitude,
        @Size(max = 600, message = "URL логотипа не должен превышать 600 символов")
        String logoUrl,
        boolean active
) {
}
