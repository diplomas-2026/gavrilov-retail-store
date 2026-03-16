package com.company.product.api.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/images/products")
public class ProductImagesRedirectController {

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Void> redirect(@PathVariable("filename") String filename) {
        // On some deployments, /images/** is routed to API. Static assets live in web under /product-images/**.
        URI target = URI.create("/product-images/products/" + filename);
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, target.toString()).build();
    }
}

