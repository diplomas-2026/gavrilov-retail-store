package com.company.product.api.service;

import com.company.product.api.entity.AssistantMessageAuthor;
import com.company.product.api.repository.AssistantMessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
public class AssistantQuotaService {

    private static final int DEFAULT_DAILY_TOKEN_LIMIT = 10_000;
    private static final ZoneId DEFAULT_QUOTA_ZONE_ID = ZoneId.of("Europe/Samara");

    private final AssistantMessageRepository assistantMessageRepository;
    private final String dailyTokenLimitRaw;
    private final String timeZoneRaw;

    public AssistantQuotaService(
            AssistantMessageRepository assistantMessageRepository,
            @Value("${ASSISTANT_DAILY_TOKEN_LIMIT:}") String dailyTokenLimitRaw,
            @Value("${ASSISTANT_QUOTA_TIME_ZONE:}") String timeZoneRaw
    ) {
        this.assistantMessageRepository = assistantMessageRepository;
        this.dailyTokenLimitRaw = dailyTokenLimitRaw;
        this.timeZoneRaw = timeZoneRaw;
    }

    public AssistantQuotaStatus getStatus() {
        ZoneId zoneId = resolveZoneId();

        LocalDate today = LocalDate.now(zoneId);
        ZonedDateTime startZdt = today.atStartOfDay(zoneId);
        ZonedDateTime endZdt = startZdt.plusDays(1);

        OffsetDateTime periodStart = startZdt.toOffsetDateTime();
        OffsetDateTime periodEnd = endZdt.toOffsetDateTime();

        long usedTokens = assistantMessageRepository.sumTokensByAuthorAndCreatedAtBetween(
                AssistantMessageAuthor.ASSISTANT,
                periodStart,
                periodEnd
        );

        Integer dailyLimit = resolveDailyTokenLimit();
        long remaining = dailyLimit == null ? -1 : Math.max(0, dailyLimit.longValue() - usedTokens);

        return new AssistantQuotaStatus(dailyLimit, usedTokens, remaining, periodStart, periodEnd, zoneId.getId());
    }

    public boolean isExceeded(AssistantQuotaStatus status) {
        return status.dailyTokenLimit() != null && status.remainingTokens() <= 0;
    }

    private Integer resolveDailyTokenLimit() {
        if (dailyTokenLimitRaw == null || dailyTokenLimitRaw.isBlank()) {
            return DEFAULT_DAILY_TOKEN_LIMIT;
        }
        try {
            int parsed = Integer.parseInt(dailyTokenLimitRaw.trim());
            if (parsed <= 0) {
                return null; // <=0 => без лимита
            }
            return parsed;
        } catch (NumberFormatException ignored) {
            return DEFAULT_DAILY_TOKEN_LIMIT;
        }
    }

    private ZoneId resolveZoneId() {
        if (timeZoneRaw == null || timeZoneRaw.isBlank()) {
            return DEFAULT_QUOTA_ZONE_ID;
        }
        try {
            return ZoneId.of(timeZoneRaw.trim());
        } catch (Exception ignored) {
            return DEFAULT_QUOTA_ZONE_ID;
        }
    }

    public record AssistantQuotaStatus(
            Integer dailyTokenLimit,
            long usedTokens,
            long remainingTokens,
            OffsetDateTime periodStart,
            OffsetDateTime periodEnd,
            String timeZone
    ) {
    }
}
