package com.sonicflow.dto;

public record AIAdviceRequest(
        String taskTitle,
        String taskContent,
        String requestType
) {
}
