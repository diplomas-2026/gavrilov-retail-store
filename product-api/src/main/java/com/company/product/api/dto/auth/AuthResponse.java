package com.company.product.api.dto.auth;

import com.company.product.api.dto.user.UserProfileResponse;

public record AuthResponse(
        String token,
        String tokenType,
        UserProfileResponse user
) {
}
