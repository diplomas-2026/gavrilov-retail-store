package com.company.product.api.service;

import com.company.product.api.dto.order.CartPreviewItemResponse;
import com.company.product.api.dto.order.CartPreviewRequest;
import com.company.product.api.dto.order.CartPreviewResponse;
import com.company.product.api.dto.order.OrderCreateRequest;
import com.company.product.api.dto.order.OrderItemRequest;
import com.company.product.api.dto.order.OrderItemResponse;
import com.company.product.api.dto.order.OrderResponse;
import com.company.product.api.entity.DeliveryType;
import com.company.product.api.entity.OrderEntity;
import com.company.product.api.entity.OrderItemEntity;
import com.company.product.api.entity.OrderStatus;
import com.company.product.api.entity.PickupPointEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.OrderItemRepository;
import com.company.product.api.repository.OrderRepository;
import com.company.product.api.repository.PickupPointRepository;
import com.company.product.api.repository.ProductRepository;
import com.company.product.api.repository.CartItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PickupPointRepository pickupPointRepository;
    private final CartItemRepository cartItemRepository;

    public OrderService(ProductRepository productRepository,
                        OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        PickupPointRepository pickupPointRepository,
                        CartItemRepository cartItemRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.pickupPointRepository = pickupPointRepository;
        this.cartItemRepository = cartItemRepository;
    }

    public CartPreviewResponse preview(CartPreviewRequest request) {
        return buildPreview(request.items());
    }

    @Transactional
    public OrderResponse createOrder(UserEntity customer, OrderCreateRequest request) {
        if (request.deliveryType() != DeliveryType.PICKUP) {
            throw new BadRequestException("Доступен только самовывоз");
        }
        if (request.pickupPointId() == null) {
            throw new BadRequestException("Для самовывоза выберите пункт выдачи");
        }

        CartPreviewResponse preview = buildPreview(request.items());
        PickupPointEntity pickupPoint = null;
        pickupPoint = pickupPointRepository.findById(request.pickupPointId())
                .orElseThrow(() -> new NotFoundException("Пункт выдачи не найден"));
        if (!pickupPoint.isActive()) {
            throw new BadRequestException("Выбранный пункт выдачи недоступен");
        }

        OrderEntity order = new OrderEntity();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.NEW);
        order.setDeliveryType(request.deliveryType());
        order.setPickupPoint(pickupPoint);
        order.setDeliveryAddress(pickupPoint.getAddress());
        order.setComment(request.comment());
        order.setTotalAmount(preview.totalAmount());

        OrderEntity savedOrder = orderRepository.save(order);

        for (CartPreviewItemResponse item : preview.items()) {
            ProductEntity product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new NotFoundException("Товар не найден"));
            product.setStockQty(product.getStockQty() - item.qty());
            productRepository.save(product);

            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQty(item.qty());
            orderItem.setUnitPrice(item.unitPrice());
            orderItem.setLineTotal(item.lineTotal());
            orderItemRepository.save(orderItem);
        }
        cartItemRepository.deleteByCustomer(customer);

        return toResponse(savedOrder);
    }

    public List<OrderResponse> getMyOrders(UserEntity customer) {
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer).stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderResponse getMyOrder(UserEntity customer, Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Заказ не найден"));
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new NotFoundException("Заказ не найден");
        }
        return toResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus status) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Заказ не найден"));
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    private CartPreviewResponse buildPreview(List<OrderItemRequest> items) {
        List<CartPreviewItemResponse> previewItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest item : items) {
            ProductEntity product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new NotFoundException("Товар не найден: " + item.productId()));
            if (!product.isActive()) {
                throw new BadRequestException("Товар недоступен: " + product.getName());
            }
            if (product.getStockQty() < item.qty()) {
                throw new BadRequestException("Недостаточный остаток для товара: " + product.getName());
            }

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.qty()));
            total = total.add(lineTotal);
            previewItems.add(new CartPreviewItemResponse(
                    product.getId(),
                    product.getName(),
                    item.qty(),
                    product.getPrice(),
                    lineTotal
            ));
        }

        return new CartPreviewResponse(previewItems, total);
    }

    private OrderResponse toResponse(OrderEntity order) {
        List<OrderItemResponse> items = orderItemRepository.findByOrderWithProduct(order).stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQty(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getCustomer().getEmail(),
                order.getCustomer().getFullName(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDeliveryType(),
                order.getPickupPoint() != null ? order.getPickupPoint().getId() : null,
                order.getPickupPoint() != null ? order.getPickupPoint().getName() : null,
                order.getPickupPoint() != null ? order.getPickupPoint().getProvider().name() : null,
                order.getDeliveryAddress(),
                order.getComment(),
                order.getCreatedAt(),
                items
        );
    }
}
