package com.company.product.api.repository;

import com.company.product.api.entity.AssistantMessageEntity;
import com.company.product.api.entity.AssistantMessageAuthor;
import com.company.product.api.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface AssistantMessageRepository extends JpaRepository<AssistantMessageEntity, Long> {

    List<AssistantMessageEntity> findByUserOrderByIdDesc(UserEntity user, Pageable pageable);

    List<AssistantMessageEntity> findByUserAndIdGreaterThanOrderByIdAsc(UserEntity user, Long id, Pageable pageable);

    @Query("""
            select coalesce(sum(m.totalTokens), 0)
            from AssistantMessageEntity m
            where m.author = :author
              and m.totalTokens is not null
              and m.createdAt >= :startInclusive
              and m.createdAt < :endExclusive
            """)
    long sumTokensByAuthorAndCreatedAtBetween(@Param("author") AssistantMessageAuthor author,
                                             @Param("startInclusive") OffsetDateTime startInclusive,
                                             @Param("endExclusive") OffsetDateTime endExclusive);
}
