package com.company.product.api.controller;

import com.company.product.api.dto.pickup.PickupPointRequest;
import com.company.product.api.dto.pickup.PickupPointResponse;
import com.company.product.api.service.PickupPointService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pickup-points")
public class PickupPointController {

    private final PickupPointService pickupPointService;

    public PickupPointController(PickupPointService pickupPointService) {
        this.pickupPointService = pickupPointService;
    }

    @GetMapping
    public ResponseEntity<List<PickupPointResponse>> getActive() {
        return ResponseEntity.ok(pickupPointService.getActive());
    }

    @GetMapping("/admin")
    public ResponseEntity<List<PickupPointResponse>> getAll() {
        return ResponseEntity.ok(pickupPointService.getAll());
    }

    @PostMapping
    public ResponseEntity<PickupPointResponse> create(@Valid @RequestBody PickupPointRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pickupPointService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PickupPointResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody PickupPointRequest request) {
        return ResponseEntity.ok(pickupPointService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pickupPointService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
