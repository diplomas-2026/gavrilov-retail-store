package com.company.product.api.dto.user;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UserRoleUpdateRequest(
        @NotNull(message = "Роль обязательна")
        Role role
) {
}
