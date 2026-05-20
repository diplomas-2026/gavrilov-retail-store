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

### Рисунок 2.14 – Результат выполнения автотестов Playwright

### [Скрин кода](./img_4.png)

```
Running 5 tests using 1 worker

  ✓  1 [chromium] › tests/customer-flow.spec.ts:3:1 › customer: каталог -> корзина -> заказ (288ms)
  ✓  2 [chromium] › tests/login.spec.ts:3:1 › страница логина и вход customer (62ms)
  ✓  3 [chromium] › tests/manager-admin.spec.ts:3:1 › manager: доступ к админке без управления пользователями (60ms)
  ✓  4 [chromium] › tests/manager-admin.spec.ts:8:1 › admin: управление пользователями доступно (64ms)
  ✓  5 [chromium] › tests/manager-admin.spec.ts:13:1 › customer: запрет на админ-страницы (72ms)

  5 passed (3.2s)
```


### Листинг кода программного продукта страниц на 3-4.
```java

@Service
public class OrderService {

    private static final int PICKUP_CODE_LENGTH = 6;
    private static final int PICKUP_CODE_GENERATION_ATTEMPTS = 20;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PickupPointRepository pickupPointRepository;
    private final CartItemRepository cartItemRepository;
    private final SecureRandom secureRandom = new SecureRandom();

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
        PickupPointEntity pickupPoint = pickupPointRepository.findById(request.pickupPointId())
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

        if (status == OrderStatus.READY_FOR_PICKUP) {
            if (order.getDeliveryType() != DeliveryType.PICKUP) {
                throw new BadRequestException("Статус «Готов к получению» доступен только для самовывоза");
            }
            if (order.getPickupCode() == null || order.getPickupCode().isBlank()) {
                order.setPickupCode(generateUniquePickupCode());
            }
        }

        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    public OrderResponse getByPickupCode(String pickupCode) {
        if (pickupCode == null || pickupCode.isBlank()) {
            throw new BadRequestException("Код получения обязателен");
        }
        String normalized = pickupCode.trim();
        OrderEntity order = orderRepository.findByPickupCode(normalized)
                .orElseThrow(() -> new NotFoundException("Заказ не найден"));
        return toResponse(order);
    }

    public String getMyPickupCode(UserEntity customer, Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Заказ не найден"));
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new NotFoundException("Заказ не найден");
        }
        if (order.getStatus() != OrderStatus.READY_FOR_PICKUP || order.getPickupCode() == null || order.getPickupCode().isBlank()) {
            throw new BadRequestException("Код получения недоступен для этого заказа");
        }
        return order.getPickupCode();
    }

    private String generateUniquePickupCode() {
        for (int attempt = 0; attempt < PICKUP_CODE_GENERATION_ATTEMPTS; attempt++) {
            String code = randomDigits(PICKUP_CODE_LENGTH);
            if (!orderRepository.existsByPickupCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Не удалось сгенерировать код получения заказа");
    }

    private String randomDigits(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
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
                order.getPickupCode(),
                order.getCreatedAt(),
                items
        );
    }
}

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String token = jwtService.generateToken(principal);
            return new AuthResponse(token, "Bearer", toProfile(principal.getUser()));
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Неверный email или пароль");
        }
    }

    public UserProfileResponse me(UserEntity user) {
        return toProfile(user);
    }

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

    private UserProfileResponse toProfile(UserEntity user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}

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
```
