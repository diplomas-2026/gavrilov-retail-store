package com.company.product.api.service;

import com.company.product.api.dto.cart.CartItemResponse;
import com.company.product.api.dto.cart.CartResponse;
import com.company.product.api.entity.CartItemEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.CartItemRepository;
import com.company.product.api.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public CartResponse getCart(UserEntity customer) {
        return toResponse(cartItemRepository.findByCustomer(customer));
    }

    @Transactional
    public CartResponse upsertItem(UserEntity customer, Long productId, Integer qty) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Товар не найден"));
        if (!product.isActive()) {
            throw new BadRequestException("Товар недоступен");
        }
        if (product.getStockQty() < qty) {
            throw new BadRequestException("Недостаточный остаток товара");
        }

        CartItemEntity item = cartItemRepository.findByCustomerAndProduct(customer, product).orElseGet(CartItemEntity::new);
        item.setCustomer(customer);
        item.setProduct(product);
        item.setQty(qty);
        cartItemRepository.save(item);

        return getCart(customer);
    }

    @Transactional
    public CartResponse removeItem(UserEntity customer, Long productId) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Товар не найден"));
        cartItemRepository.deleteByCustomerAndProduct(customer, product);
        return getCart(customer);
    }

    @Transactional
    public void clearCart(UserEntity customer) {
        cartItemRepository.deleteByCustomer(customer);
    }

    public List<CartItemEntity> getCartEntities(UserEntity customer) {
        return cartItemRepository.findByCustomer(customer);
    }

    private CartResponse toResponse(List<CartItemEntity> entities) {
        List<CartItemResponse> items = entities.stream()
                .map(item -> new CartItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getPrice(),
                        item.getQty()
                ))
                .toList();

        BigDecimal totalAmount = entities.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQty())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(items, totalAmount);
    }
}
