package com.company.product.api.controller;

import com.company.product.api.dto.cart.CartItemUpsertRequest;
import com.company.product.api.dto.cart.CartResponse;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.service.CartService;
import com.company.product.api.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final CurrentUserService currentUserService;

    public CartController(CartService cartService, CurrentUserService currentUserService) {
        this.cartService = cartService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart() {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.ok(cartService.getCart(customer));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> upsertItem(@PathVariable Long productId,
                                                   @Valid @RequestBody CartItemUpsertRequest request) {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.ok(cartService.upsertItem(customer, productId, request.qty()));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeItem(@PathVariable Long productId) {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.ok(cartService.removeItem(customer, productId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart() {
        UserEntity customer = currentUserService.getCurrentUser();
        cartService.clearCart(customer);
        return ResponseEntity.noContent().build();
    }
}
