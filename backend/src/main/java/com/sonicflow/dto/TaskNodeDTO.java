package com.sonicflow.dto;

public record TaskNodeDTO(
    String id,
    String type,
    String title,
    String parentId,
    Integer order,
    String status,
    Boolean isExpanded,
    Boolean isDeleted,
    String deletedAt,
    String createdAt,
    String completedAt,
    String scheduledAt,
    String content,
    Integer workDurationMinutes
) {}
