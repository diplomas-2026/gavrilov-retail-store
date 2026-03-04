package com.company.product.api.dto.user;

import com.company.product.api.entity.Role;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        Role role
) {
}
