package com.company.product.api.repository;

import com.company.product.api.entity.AssistantMessageEntity;
import com.company.product.api.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssistantMessageRepository extends JpaRepository<AssistantMessageEntity, Long> {

    List<AssistantMessageEntity> findByUserOrderByIdDesc(UserEntity user, Pageable pageable);

    List<AssistantMessageEntity> findByUserAndIdGreaterThanOrderByIdAsc(UserEntity user, Long id, Pageable pageable);
}

