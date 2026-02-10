package com.sonicflow.service;

import com.sonicflow.config.AIConfig;
import com.sonicflow.dto.AIAdviceRequest;
import com.sonicflow.dto.AIAdviceResponse;
import com.sonicflow.entity.AISettings;
import com.sonicflow.repository.AISettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import jakarta.annotation.PostConstruct;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final int MAX_TASK_CONTENT_LENGTH = 500;

    private final RestClient geminiRestClient;
    private final AIConfig aiConfig;
    private final AISettingsRepository aiSettingsRepository;

    public AIService(RestClient geminiRestClient, AIConfig aiConfig,
                     AISettingsRepository aiSettingsRepository) {
        this.geminiRestClient = geminiRestClient;
        this.aiConfig = aiConfig;
        this.aiSettingsRepository = aiSettingsRepository;
    }

    @PostConstruct
    void migrateDeprecatedModel() {
        aiSettingsRepository.findAll().forEach(settings -> {
            if ("gemini-2.0-flash".equals(settings.getModel())) {
                log.info("Migrating AI model from gemini-2.0-flash to {}", aiConfig.getModel());
                settings.setModel(aiConfig.getModel());
                aiSettingsRepository.save(settings);
            }
        });
    }

    public AISettings getSettings() {
        return aiSettingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    AISettings settings = new AISettings();
                    return aiSettingsRepository.save(settings);
                });
    }

    public AISettings updateSettings(AISettings updated) {
        AISettings settings = getSettings();
        if (updated.getApiKey() != null) {
            settings.setApiKey(updated.getApiKey());
        }
        if (updated.getModel() != null && !updated.getModel().isBlank()) {
            settings.setModel(updated.getModel());
        }
        return aiSettingsRepository.save(settings);
    }

    public AIAdviceResponse getAdvice(AIAdviceRequest request) {
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("API_KEY_NOT_CONFIGURED");
        }

        String model = resolveModel();
        String prompt = buildPrompt(request);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of("maxOutputTokens", 1024)
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = geminiRestClient.post()
                    .uri("/models/{model}:generateContent?key={key}", model, apiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String advice = extractText(response);
            return new AIAdviceResponse(advice, request.requestType());
        } catch (RestClientResponseException e) {
            int status = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.error("Gemini API error: status={}, model={}, body={}", status, model, responseBody);

            if (status == 429) {
                throw new AIServiceException("RATE_LIMITED",
                        "APIのレート制限に達しました。しばらく待ってから再試行してください。"
                                + extractGeminiError(responseBody));
            } else if (status == 401 || status == 403) {
                throw new AIServiceException("INVALID_API_KEY",
                        "APIキーが無効です。Settingsで正しいキーを設定してください。"
                                + extractGeminiError(responseBody));
            } else {
                throw new AIServiceException("API_ERROR",
                        "AIサービスでエラーが発生しました（" + status + "）"
                                + extractGeminiError(responseBody));
            }
        }
    }

    private String resolveApiKey() {
        // Priority 1: DB (set via Settings UI)
        AISettings settings = getSettings();
        if (settings.getApiKey() != null && !settings.getApiKey().isBlank()) {
            return settings.getApiKey();
        }
        // Priority 2: Environment variable / application.properties
        return aiConfig.getApiKey();
    }

    private String resolveModel() {
        AISettings settings = getSettings();
        if (settings.getModel() != null && !settings.getModel().isBlank()) {
            return settings.getModel();
        }
        return aiConfig.getModel();
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        if (response == null) {
            throw new AIServiceException("EMPTY_RESPONSE", "AIサービスから空のレスポンスが返されました");
        }
        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new AIServiceException("NO_CANDIDATES", "AIサービスから有効な回答が得られませんでした");
        }
        Map<String, Object> content =
                (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts =
                (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private String extractGeminiError(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode message = root.path("error").path("message");
            if (message.isMissingNode() || message.isNull()) {
                return "";
            }
            return " [詳細: " + message.asText() + "]";
        } catch (Exception e) {
            return "";
        }
    }

    private String buildPrompt(AIAdviceRequest request) {
        String systemInstruction = switch (request.requestType()) {
            case "breakdown" -> BREAKDOWN_PROMPT;
            case "encouragement" -> ENCOURAGEMENT_PROMPT;
            case "review" -> REVIEW_PROMPT;
            default -> throw new IllegalArgumentException(
                    "Unknown request type: " + request.requestType());
        };

        StringBuilder sb = new StringBuilder(systemInstruction);
        sb.append("\n\nタスク名: ").append(request.taskTitle());
        if (request.taskContent() != null && !request.taskContent().isBlank()) {
            String content = request.taskContent();
            if (content.length() > MAX_TASK_CONTENT_LENGTH) {
                content = content.substring(0, MAX_TASK_CONTENT_LENGTH) + "...（省略）";
            }
            sb.append("\nタスクの詳細メモ:\n").append(content);
        }
        return sb.toString();
    }

    public static class AIServiceException extends RuntimeException {
        private final String errorCode;

        public AIServiceException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }

    private static final String BREAKDOWN_PROMPT = """
            あなたはタスク管理のコーチです。
            ユーザーが取り組もうとしているタスクを、具体的で実行しやすい小さなステップに分解してください。

            ルール:
            - 3〜7個のステップに分解する
            - 各ステップは15分以内で完了できる粒度にする
            - 番号付きリストで出力する
            - 最初のステップは特に簡単で着手しやすいものにする
            - 簡潔に、余計な前置きなしで回答する""";

    private static final String ENCOURAGEMENT_PROMPT = """
            あなたはポジティブで温かいタスク管理コーチです。
            ユーザーが今取り組んでいるタスクについて、励ましとモチベーションを高めるアドバイスをしてください。

            ルール:
            - 2〜3文で簡潔に励ます
            - 具体的なタスク内容に触れて共感を示す
            - 「できる」という前向きなメッセージを含める
            - 余計な前置きなしで回答する""";

    private static final String REVIEW_PROMPT = """
            あなたはタスク管理のコーチです。
            ユーザーがタスクを完了したことに対して、短いフィードバックと次のアクションの提案をしてください。

            ルール:
            - まず完了を称える（1文）
            - 次にやると良さそうなことを1つ提案する
            - 簡潔に、余計な前置きなしで回答する""";
}
