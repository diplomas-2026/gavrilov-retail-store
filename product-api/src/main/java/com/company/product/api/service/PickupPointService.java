package com.company.product.api.service;

import com.company.product.api.dto.pickup.PickupPointRequest;
import com.company.product.api.dto.pickup.PickupPointResponse;
import com.company.product.api.entity.PickupPointEntity;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.PickupPointRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PickupPointService {

    private final PickupPointRepository pickupPointRepository;

    public PickupPointService(PickupPointRepository pickupPointRepository) {
        this.pickupPointRepository = pickupPointRepository;
    }

    public List<PickupPointResponse> getActive() {
        return pickupPointRepository.findByActiveTrueOrderByProviderAscNameAsc().stream().map(this::toResponse).toList();
    }

    public List<PickupPointResponse> getAll() {
        return pickupPointRepository.findAllByOrderByProviderAscNameAsc().stream().map(this::toResponse).toList();
    }

    public long countActive() {
        return pickupPointRepository.countByActiveTrue();
    }

    @Transactional
    public PickupPointResponse create(PickupPointRequest request) {
        PickupPointEntity point = new PickupPointEntity();
        apply(point, request);
        return toResponse(pickupPointRepository.save(point));
    }

    @Transactional
    public PickupPointResponse update(Long id, PickupPointRequest request) {
        PickupPointEntity point = pickupPointRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пункт выдачи не найден"));
        apply(point, request);
        return toResponse(pickupPointRepository.save(point));
    }

    @Transactional
    public void delete(Long id) {
        if (!pickupPointRepository.existsById(id)) {
            throw new NotFoundException("Пункт выдачи не найден");
        }
        pickupPointRepository.deleteById(id);
    }

    private void apply(PickupPointEntity point, PickupPointRequest request) {
        point.setProvider(request.provider());
        point.setName(request.name());
        point.setAddress(request.address());
        point.setPhone(request.phone());
        point.setWorkHours(request.workHours());
        point.setLatitude(request.latitude());
        point.setLongitude(request.longitude());
        point.setLogoUrl(request.logoUrl());
        point.setActive(request.active());
    }

    private PickupPointResponse toResponse(PickupPointEntity point) {
        return new PickupPointResponse(
                point.getId(),
                point.getProvider(),
                point.getName(),
                point.getAddress(),
                point.getPhone(),
                point.getWorkHours(),
                point.getLatitude(),
                point.getLongitude(),
                point.getLogoUrl(),
                point.isActive()
        );
    }
}
