package com.sonicflow.controller;

import com.sonicflow.dto.AIAdviceRequest;
import com.sonicflow.dto.AIAdviceResponse;
import com.sonicflow.entity.AISettings;
import com.sonicflow.service.AIService;
import com.sonicflow.service.AIService.AIServiceException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        AISettings settings = aiService.getSettings();
        return ResponseEntity.ok(Map.of(
                "apiKey", maskApiKey(settings.getApiKey()),
                "model", settings.getModel(),
                "hasApiKey", settings.getApiKey() != null && !settings.getApiKey().isBlank()
        ));
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> body) {
        AISettings updated = new AISettings();
        if (body.containsKey("apiKey")) {
            updated.setApiKey(body.get("apiKey"));
        }
        if (body.containsKey("model")) {
            updated.setModel(body.get("model"));
        }
        AISettings saved = aiService.updateSettings(updated);
        return ResponseEntity.ok(Map.of(
                "apiKey", maskApiKey(saved.getApiKey()),
                "model", saved.getModel(),
                "hasApiKey", saved.getApiKey() != null && !saved.getApiKey().isBlank()
        ));
    }

    @PostMapping("/advice")
    public ResponseEntity<?> getAdvice(@RequestBody AIAdviceRequest request) {
        if (request.taskTitle() == null || request.taskTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "taskTitle is required", "errorCode", "VALIDATION"));
        }
        if (request.requestType() == null || request.requestType().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "requestType is required", "errorCode", "VALIDATION"));
        }

        try {
            AIAdviceResponse response = aiService.getAdvice(request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503)
                    .body(Map.of(
                            "error", "APIキーが設定されていません。Settingsで設定してください。",
                            "errorCode", "API_KEY_NOT_CONFIGURED"
                    ));
        } catch (AIServiceException e) {
            int status = switch (e.getErrorCode()) {
                case "RATE_LIMITED" -> 429;
                case "INVALID_API_KEY" -> 401;
                default -> 502;
            };
            return ResponseEntity.status(status)
                    .body(Map.of("error", e.getMessage(), "errorCode", e.getErrorCode()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage(), "errorCode", "VALIDATION"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error", "AIサービスでエラーが発生しました",
                            "errorCode", "UNKNOWN"
                    ));
        }
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 8) {
            return "";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}
