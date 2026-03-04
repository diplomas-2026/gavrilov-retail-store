package com.company.product.api.seed;

import com.company.product.api.entity.CategoryEntity;
import com.company.product.api.entity.DeliveryType;
import com.company.product.api.entity.OrderEntity;
import com.company.product.api.entity.OrderItemEntity;
import com.company.product.api.entity.OrderStatus;
import com.company.product.api.entity.PickupPointEntity;
import com.company.product.api.entity.PickupProvider;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.entity.ProductImageEntity;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.repository.CategoryRepository;
import com.company.product.api.repository.OrderItemRepository;
import com.company.product.api.repository.OrderRepository;
import com.company.product.api.repository.PickupPointRepository;
import com.company.product.api.repository.ProductImageRepository;
import com.company.product.api.repository.ProductRepository;
import com.company.product.api.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
@Profile("!prod")
public class DevDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataInitializer.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PickupPointRepository pickupPointRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${app.seed-dir:seed-data}")
    private String seedDir;

    @Value("${app.users-file:users.txt}")
    private String usersFile;

    public DevDataInitializer(UserRepository userRepository,
                              CategoryRepository categoryRepository,
                              ProductRepository productRepository,
                              ProductImageRepository productImageRepository,
                              OrderRepository orderRepository,
                              OrderItemRepository orderItemRepository,
                              PickupPointRepository pickupPointRepository,
                              PasswordEncoder passwordEncoder,
                              ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.pickupPointRepository = pickupPointRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<TestUser> testUsers = initTestUsers();
        writeUsersFile(testUsers);
        List<SeedCategory> categories = readSeed("categories.json", new TypeReference<>() {
        });
        List<SeedProduct> products = readSeed("products.json", new TypeReference<>() {
        });
        List<SeedPickupPoint> pickupPoints = readSeed("pickup-points.json", new TypeReference<>() {
        });
        upsertCategories(categories);
        upsertProducts(products);
        upsertPickupPoints(pickupPoints);
        createDemoOrderIfMissing();
        log.info("Test users and seed data initialized");
    }

    private List<TestUser> initTestUsers() {
        List<TestUser> testUsers = List.of(
                new TestUser("admin@gavrilov.local", "Admin123!", "Администратор", Role.ADMIN),
                new TestUser("manager@gavrilov.local", "Manager123!", "Менеджер магазина", Role.MANAGER),
                new TestUser("customer@gavrilov.local", "Customer123!", "Покупатель тестовый", Role.CUSTOMER)
        );

        for (TestUser testUser : testUsers) {
            UserEntity user = userRepository.findByEmailIgnoreCase(testUser.email()).orElseGet(UserEntity::new);
            user.setEmail(testUser.email());
            user.setFullName(testUser.fullName());
            user.setRole(testUser.role());
            user.setActive(true);
            if (user.getPasswordHash() == null || !passwordEncoder.matches(testUser.password(), user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(testUser.password()));
            }
            userRepository.save(user);
        }

        return testUsers;
    }

    private void writeUsersFile(List<TestUser> users) throws IOException {
        Path filePath = Path.of(usersFile);
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }
        List<String> lines = users.stream()
                .map(user -> "email=" + user.email() + "; password=" + user.password() + "; role=" + user.role().name())
                .toList();
        Files.write(filePath, lines, StandardCharsets.UTF_8);
    }

    private void upsertCategories(List<SeedCategory> categories) {
        for (SeedCategory seedCategory : categories) {
            CategoryEntity category = categoryRepository.findBySlug(seedCategory.slug()).orElseGet(CategoryEntity::new);
            category.setSlug(seedCategory.slug());
            category.setName(seedCategory.name());
            category.setDescription(seedCategory.description());
            category.setActive(seedCategory.active());
            categoryRepository.save(category);
        }
    }

    private void upsertProducts(List<SeedProduct> products) {
        for (SeedProduct seedProduct : products) {
            CategoryEntity category = categoryRepository.findBySlug(seedProduct.categorySlug())
                    .orElseThrow(() -> new IllegalStateException("Категория не найдена для slug=" + seedProduct.categorySlug()));
            ProductEntity product = productRepository.findBySku(seedProduct.sku()).orElseGet(ProductEntity::new);
            product.setSku(seedProduct.sku());
            product.setName(seedProduct.name());
            product.setDescription(seedProduct.description());
            product.setPrice(seedProduct.price());
            product.setOldPrice(seedProduct.oldPrice());
            product.setStockQty(seedProduct.stockQty());
            product.setActive(seedProduct.active());
            product.setCategory(category);
            ProductEntity saved = productRepository.save(product);

            productImageRepository.deleteByProduct(saved);
            List<String> images = Optional.ofNullable(seedProduct.images()).orElse(List.of());
            for (int i = 0; i < images.size(); i++) {
                ProductImageEntity imageEntity = new ProductImageEntity();
                imageEntity.setProduct(saved);
                imageEntity.setImageUrl(images.get(i));
                imageEntity.setSortOrder(i);
                productImageRepository.save(imageEntity);
            }
        }
    }

    private void createDemoOrderIfMissing() {
        UserEntity customer = userRepository.findByEmailIgnoreCase("customer@gavrilov.local")
                .orElseThrow(() -> new IllegalStateException("Тестовый customer не найден"));
        if (!orderRepository.findByCustomerOrderByCreatedAtDesc(customer).isEmpty()) {
            return;
        }

        List<ProductEntity> activeProducts = productRepository.findAll().stream()
                .filter(ProductEntity::isActive)
                .filter(p -> p.getStockQty() > 0)
                .sorted(Comparator.comparing(ProductEntity::getId))
                .limit(2)
                .toList();

        if (activeProducts.isEmpty()) {
            return;
        }

        OrderEntity order = new OrderEntity();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.NEW);
        order.setDeliveryType(DeliveryType.COURIER);
        order.setDeliveryAddress("г. Самара, ул. Молодогвардейская, 120");
        order.setComment("Демо-заказ для проверки интерфейса");
        order.setCreatedAt(OffsetDateTime.now().minusDays(1));

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItemEntity> items = new ArrayList<>();
        for (ProductEntity product : activeProducts) {
            int qty = 1;
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            total = total.add(lineTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setOrder(order);
            item.setProduct(product);
            item.setQty(qty);
            item.setUnitPrice(product.getPrice());
            item.setLineTotal(lineTotal);
            items.add(item);
        }

        order.setTotalAmount(total);
        OrderEntity savedOrder = orderRepository.save(order);
        for (OrderItemEntity item : items) {
            item.setOrder(savedOrder);
            orderItemRepository.save(item);
        }
    }

    private void upsertPickupPoints(List<SeedPickupPoint> pickupPoints) {
        for (SeedPickupPoint seedPoint : pickupPoints) {
            PickupPointEntity point = pickupPointRepository
                    .findByProviderAndNameIgnoreCase(seedPoint.provider(), seedPoint.name())
                    .orElseGet(PickupPointEntity::new);
            point.setProvider(seedPoint.provider());
            point.setName(seedPoint.name());
            point.setAddress(seedPoint.address());
            point.setPhone(seedPoint.phone());
            point.setWorkHours(seedPoint.workHours());
            point.setLatitude(seedPoint.latitude());
            point.setLongitude(seedPoint.longitude());
            point.setLogoUrl(seedPoint.logoUrl());
            point.setActive(seedPoint.active());
            pickupPointRepository.save(point);
        }
    }

    private <T> List<T> readSeed(String filename, TypeReference<List<T>> typeReference) throws IOException {
        Path path = Path.of(seedDir, filename);
        if (!Files.exists(path)) {
            throw new IllegalStateException("Не найден seed файл: " + path.toAbsolutePath());
        }
        return objectMapper.readValue(path.toFile(), typeReference);
    }

    private record TestUser(String email, String password, String fullName, Role role) {
    }

    private record SeedCategory(String name, String slug, String description, boolean active) {
    }

    private record SeedProduct(String sku,
                               String name,
                               String description,
                               BigDecimal price,
                               BigDecimal oldPrice,
                               Integer stockQty,
                               boolean active,
                               String categorySlug,
                               List<String> images) {
    }

    private record SeedPickupPoint(PickupProvider provider,
                                   String name,
                                   String address,
                                   String phone,
                                   String workHours,
                                   Double latitude,
                                   Double longitude,
                                   String logoUrl,
                                   boolean active) {
    }
}
