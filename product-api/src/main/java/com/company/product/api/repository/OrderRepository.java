package com.company.product.api.repository;

import com.company.product.api.entity.OrderEntity;
import com.company.product.api.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    List<OrderEntity> findByCustomerOrderByCreatedAtDesc(UserEntity customer);

    Optional<OrderEntity> findByPickupCode(String pickupCode);

    boolean existsByPickupCode(String pickupCode);
}
