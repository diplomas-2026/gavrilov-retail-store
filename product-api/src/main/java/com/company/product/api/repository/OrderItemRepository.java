package com.company.product.api.repository;

import com.company.product.api.entity.OrderEntity;
import com.company.product.api.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    List<OrderItemEntity> findByOrder(OrderEntity order);

    @Query("select oi from OrderItemEntity oi join fetch oi.product where oi.order = :order order by oi.id")
    List<OrderItemEntity> findByOrderWithProduct(@Param("order") OrderEntity order);
}
