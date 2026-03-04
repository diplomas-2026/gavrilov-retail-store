package com.company.product.api.dto.user;

import com.company.product.api.entity.Role;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        Role role,
        boolean active
) {
}
