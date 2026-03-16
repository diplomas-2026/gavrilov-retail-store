package com.company.product.api.controller;

import com.company.product.api.dto.assistant.AskAssistantRequest;
import com.company.product.api.dto.assistant.AskAssistantResponse;
import com.company.product.api.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/ask")
    public ResponseEntity<AskAssistantResponse> ask(@Valid @RequestBody AskAssistantRequest request) {
        String answer = assistantService.ask(request.question());
        return ResponseEntity.ok(new AskAssistantResponse(answer));
    }
}

