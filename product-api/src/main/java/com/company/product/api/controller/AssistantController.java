package com.company.product.api.controller;

import com.company.product.api.dto.assistant.AskAssistantRequest;
import com.company.product.api.dto.assistant.AskAssistantResponse;
import com.company.product.api.dto.assistant.ListAssistantMessagesResponse;
import com.company.product.api.dto.assistant.SendAssistantMessageResponse;
import com.company.product.api.service.AssistantService;
import com.company.product.api.service.AssistantChatService;
import com.company.product.api.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final AssistantChatService assistantChatService;
    private final CurrentUserService currentUserService;

    public AssistantController(AssistantService assistantService,
                               AssistantChatService assistantChatService,
                               CurrentUserService currentUserService) {
        this.assistantService = assistantService;
        this.assistantChatService = assistantChatService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/ask")
    public ResponseEntity<AskAssistantResponse> ask(@Valid @RequestBody AskAssistantRequest request) {
        // Сохраняем сообщения в БД, но в LLM передаём только вопрос (без контекста).
        String answer = assistantChatService.sendMessage(currentUserService.getCurrentUser(), request.question()).assistantMessage().message();
        return ResponseEntity.ok(new AskAssistantResponse(answer));
    }

    @GetMapping("/messages")
    public ResponseEntity<ListAssistantMessagesResponse> listMessages(@RequestParam(required = false) Long sinceId,
                                                                      @RequestParam(required = false) Integer limit) {
        var user = currentUserService.getCurrentUser();
        var messages = assistantChatService.listMessages(user, sinceId, limit);
        return ResponseEntity.ok(new ListAssistantMessagesResponse(messages));
    }

    @PostMapping("/messages")
    public ResponseEntity<SendAssistantMessageResponse> sendMessage(@Valid @RequestBody AskAssistantRequest request) {
        var user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(assistantChatService.sendMessage(user, request.question()));
    }
}
