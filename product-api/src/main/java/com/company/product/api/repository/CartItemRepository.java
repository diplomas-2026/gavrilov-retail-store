package com.company.product.api.repository;

import com.company.product.api.entity.CartItemEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {

    List<CartItemEntity> findByCustomer(UserEntity customer);

    Optional<CartItemEntity> findByCustomerAndProduct(UserEntity customer, ProductEntity product);

    void deleteByCustomer(UserEntity customer);

    void deleteByCustomerAndProduct(UserEntity customer, ProductEntity product);
}
