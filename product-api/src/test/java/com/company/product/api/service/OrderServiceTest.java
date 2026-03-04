package com.company.product.api.service;

import com.company.product.api.dto.order.CartPreviewRequest;
import com.company.product.api.dto.order.OrderItemRequest;
import com.company.product.api.entity.CategoryEntity;
import com.company.product.api.entity.ProductEntity;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.repository.OrderItemRepository;
import com.company.product.api.repository.OrderRepository;
import com.company.product.api.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private OrderService orderService;

    private ProductEntity product;

    @BeforeEach
    void setUp() {
        CategoryEntity category = new CategoryEntity();
        category.setName("Тестовая категория");

        product = new ProductEntity();
        product.setSku("TEST-1");
        product.setName("Тестовый товар");
        product.setPrice(BigDecimal.valueOf(100));
        product.setStockQty(10);
        product.setCategory(category);
        product.setActive(true);
    }

    @Test
    void previewShouldReturnCalculatedTotal() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        var response = orderService.preview(new CartPreviewRequest(List.of(new OrderItemRequest(1L, 2))));

        assertThat(response.totalAmount()).isEqualByComparingTo("200");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).lineTotal()).isEqualByComparingTo("200");
    }

    @Test
    void previewShouldFailWhenStockInsufficient() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.preview(new CartPreviewRequest(List.of(new OrderItemRequest(1L, 20)))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Недостаточный остаток");
    }
}
