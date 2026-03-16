package com.company.product.api.controller;

import com.company.product.api.dto.order.CartPreviewRequest;
import com.company.product.api.dto.order.CartPreviewResponse;
import com.company.product.api.dto.order.OrderCreateRequest;
import com.company.product.api.dto.order.OrderResponse;
import com.company.product.api.dto.order.OrderStatusUpdateRequest;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.OrderService;
import com.company.product.api.service.PickupCodeBarcodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;
    private final CurrentUserService currentUserService;
    private final PickupCodeBarcodeService pickupCodeBarcodeService;

    public OrderController(OrderService orderService,
                           CurrentUserService currentUserService,
                           PickupCodeBarcodeService pickupCodeBarcodeService) {
        this.orderService = orderService;
        this.currentUserService = currentUserService;
        this.pickupCodeBarcodeService = pickupCodeBarcodeService;
    }

    @PostMapping("/cart/preview")
    public ResponseEntity<CartPreviewResponse> preview(@Valid @RequestBody CartPreviewRequest request) {
        return ResponseEntity.ok(orderService.preview(request));
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderCreateRequest request) {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(customer, request));
    }

    @GetMapping("/orders/my")
    public ResponseEntity<List<OrderResponse>> myOrders() {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.ok(orderService.getMyOrders(customer));
    }

    @GetMapping("/orders/my/{id}")
    public ResponseEntity<OrderResponse> myOrderById(@PathVariable Long id) {
        UserEntity customer = currentUserService.getCurrentUser();
        return ResponseEntity.ok(orderService.getMyOrder(customer, id));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> allOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/orders/pickup/{code}")
    public ResponseEntity<OrderResponse> orderByPickupCode(@PathVariable String code) {
        return ResponseEntity.ok(orderService.getByPickupCode(code));
    }

    @GetMapping(value = "/orders/my/{id}/pickup-code/barcode", produces = "image/svg+xml")
    public ResponseEntity<String> myOrderPickupBarcode(@PathVariable Long id) {
        UserEntity customer = currentUserService.getCurrentUser();
        String code = orderService.getMyPickupCode(customer, id);
        String svg = pickupCodeBarcodeService.buildQrSvg(code, 180);
        return ResponseEntity.ok(svg);
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id,
                                                      @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.status()));
    }
}
