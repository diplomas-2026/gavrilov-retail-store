package com.company.product.api.service;

import com.company.product.api.dto.product.ProductRequest;
import com.company.product.api.dto.product.ProductResponse;
import com.company.product.api.entity.CategoryEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.ProductImageEntity;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.CategoryRepository;
import com.company.product.api.repository.ProductImageRepository;
import com.company.product.api.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          ProductImageRepository productImageRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
    }

    public List<ProductResponse> search(
            String query,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            boolean activeOnly
    ) {
        Specification<ProductEntity> spec = Specification.where(null);

        if (query != null && !query.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.like(cb.lower(root.get("name")), "%" + query.toLowerCase() + "%"));
        }
        if (categoryId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (minPrice != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        if (activeOnly) {
            spec = spec.and((root, cq, cb) -> cb.isTrue(root.get("active")));
        }

        return productRepository.findAll(spec).stream().map(this::toResponse).toList();
    }

    public ProductResponse getById(Long id) {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Товар не найден"));
        return toResponse(product);
    }

    public long count(boolean activeOnly) {
        if (activeOnly) {
            return productRepository.countByActiveTrue();
        }
        return productRepository.count();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        ProductEntity product = new ProductEntity();
        apply(product, request);
        ProductEntity saved = productRepository.save(product);
        syncImages(saved, request.images());
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Товар не найден"));
        apply(product, request);
        ProductEntity saved = productRepository.save(product);
        syncImages(saved, request.images());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Товар не найден"));
        productImageRepository.deleteByProduct(product);
        productRepository.delete(product);
    }

    private void apply(ProductEntity product, ProductRequest request) {
        CategoryEntity category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Категория не найдена"));

        product.setSku(request.sku());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setOldPrice(request.oldPrice());
        product.setStockQty(request.stockQty());
        product.setActive(request.active());
        product.setCategory(category);
    }

    private void syncImages(ProductEntity product, List<String> imageUrls) {
        productImageRepository.deleteByProduct(product);
        List<String> urls = imageUrls == null ? Collections.emptyList() : imageUrls;
        for (int i = 0; i < urls.size(); i++) {
            ProductImageEntity image = new ProductImageEntity();
            image.setProduct(product);
            image.setImageUrl(urls.get(i));
            image.setSortOrder(i);
            productImageRepository.save(image);
        }
    }

    private ProductResponse toResponse(ProductEntity product) {
        List<String> images = productImageRepository.findByProductOrderBySortOrderAsc(product).stream()
                .map(ProductImageEntity::getImageUrl)
                .toList();

        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOldPrice(),
                product.getStockQty(),
                product.isActive(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                images
        );
    }
}
