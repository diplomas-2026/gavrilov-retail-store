package com.company.product.api.dto.pickup;

import com.company.product.api.entity.PickupProvider;

public record PickupPointResponse(
        Long id,
        PickupProvider provider,
        String name,
        String address,
        String phone,
        String workHours,
        Double latitude,
        Double longitude,
        String logoUrl,
        boolean active
) {
}
