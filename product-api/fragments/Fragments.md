### Рисунок 2.12 – Фрагмент кодамодуля регистрации

### [Скрин кода](./img.png)

```java
public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmailIgnoreCase(request.email())) {
        throw new BadRequestException("Пользователь с таким email уже существует");
    }

    UserEntity user = new UserEntity();
    user.setEmail(request.email().trim().toLowerCase());
    user.setFullName(request.fullName().trim());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(Role.CUSTOMER);
    user.setActive(true);

    UserEntity saved = userRepository.save(user);
    UserPrincipal principal = new UserPrincipal(saved);
    String token = jwtService.generateToken(principal);
    return new AuthResponse(token, "Bearer", toProfile(saved));
}
```

### Рисунок 2.13 – Фрагмент кодамодуля каталога товаров

### [Скрин кода](./img_1.png)

```java
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
```

### Рисунок 2.15 – Фрагмент кодамодуля оформления заказов

### [Скрин кода](./img_2.png)

```java

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
```

### Рисунок 2.14 – Фрагмент кодамодуля каталога товаров

Повтроряется, рисунок 2.13 — тоже самое

### Рисунок 2.16 – Фрагмент кодамодуля обработки заказов

### [Скрин кода](./img_3.png)

```java

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

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


    @Transactional
    public void changeStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Заказ не найден"));
        order.setStatus(newStatus);
        orderRepository.save(order);
    }
}
```