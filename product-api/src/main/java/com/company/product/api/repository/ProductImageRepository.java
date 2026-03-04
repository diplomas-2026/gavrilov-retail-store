package com.company.product.api.repository;

import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.ProductImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImageEntity, Long> {

    List<ProductImageEntity> findByProductOrderBySortOrderAsc(ProductEntity product);

    void deleteByProduct(ProductEntity product);
}
