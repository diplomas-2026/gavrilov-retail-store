package com.company.product.api.repository;

import com.company.product.api.entity.PickupPointEntity;
import com.company.product.api.entity.PickupProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PickupPointRepository extends JpaRepository<PickupPointEntity, Long> {

    List<PickupPointEntity> findByActiveTrueOrderByProviderAscNameAsc();

    List<PickupPointEntity> findAllByOrderByProviderAscNameAsc();

    Optional<PickupPointEntity> findByProviderAndNameIgnoreCase(PickupProvider provider, String name);

    long countByActiveTrue();
}
