package com.sonicflow.service;

import com.sonicflow.dto.TaskNodeDTO;
import com.sonicflow.entity.Task;
import com.sonicflow.entity.TaskStatus;
import com.sonicflow.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskNodeDTO> getTaskTree() {
        return taskRepository.findByIsDeletedFalseOrderBySortOrderAsc()
                .stream().map(this::toDTO).toList();
    }

    public List<TaskNodeDTO> getDeletedTasks() {
        return taskRepository.findByIsDeletedTrue()
                .stream().map(this::toDTO).toList();
    }

    public TaskNodeDTO createTask(TaskNodeDTO dto) {
        Task task = toEntity(dto);
        return toDTO(taskRepository.save(task));
    }

    public TaskNodeDTO updateTask(String id, TaskNodeDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));

        if (dto.title() != null) task.setTitle(dto.title());
        if (dto.type() != null) task.setType(dto.type());
        if (dto.parentId() != null) task.setParentId(dto.parentId().isEmpty() ? null : dto.parentId());
        if (dto.order() != null) task.setSortOrder(dto.order());
        if (dto.isExpanded() != null) task.setIsExpanded(dto.isExpanded());
        if (dto.content() != null) task.setContent(dto.content());
        if (dto.workDurationMinutes() != null) task.setWorkDurationMinutes(dto.workDurationMinutes());
        if (dto.scheduledAt() != null) task.setScheduledAt(parseDateTime(dto.scheduledAt()));

        if (dto.status() != null) {
            TaskStatus newStatus = TaskStatus.valueOf(dto.status());
            TaskStatus oldStatus = task.getStatus();
            task.setStatus(newStatus);
            if (newStatus == TaskStatus.DONE && oldStatus != TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (newStatus == TaskStatus.TODO) {
                task.setCompletedAt(null);
            }
        }

        return toDTO(taskRepository.save(task));
    }

    public void syncTree(List<TaskNodeDTO> dtos) {
        List<Task> tasks = dtos.stream().map(this::toEntity).toList();
        taskRepository.saveAll(tasks);
    }

    public void softDelete(String id) {
        List<Task> all = taskRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        List<String> affected = collectDescendantIds(id, all);
        for (Task t : all) {
            if (affected.contains(t.getId())) {
                t.setIsDeleted(true);
                t.setDeletedAt(now);
            }
        }
        taskRepository.saveAll(all.stream().filter(t -> affected.contains(t.getId())).toList());
    }

    public void restore(String id) {
        List<Task> all = taskRepository.findAll();
        List<String> descendantIds = collectDescendantIds(id, all);

        // Also restore ancestors
        Task target = all.stream().filter(t -> t.getId().equals(id)).findFirst().orElse(null);
        List<String> ancestorIds = new ArrayList<>();
        if (target != null) {
            String parentId = target.getParentId();
            while (parentId != null) {
                String pid = parentId;
                Task parent = all.stream().filter(t -> t.getId().equals(pid)).findFirst().orElse(null);
                if (parent != null && Boolean.TRUE.equals(parent.getIsDeleted())) {
                    ancestorIds.add(parent.getId());
                }
                parentId = parent != null ? parent.getParentId() : null;
            }
        }

        for (Task t : all) {
            if (descendantIds.contains(t.getId()) || ancestorIds.contains(t.getId())) {
                t.setIsDeleted(false);
                t.setDeletedAt(null);
            }
        }
        taskRepository.saveAll(all.stream()
                .filter(t -> descendantIds.contains(t.getId()) || ancestorIds.contains(t.getId()))
                .toList());
    }

    public void permanentDelete(String id) {
        List<Task> all = taskRepository.findAll();
        List<String> idsToDelete = collectDescendantIds(id, all);
        taskRepository.deleteAllById(idsToDelete);
    }

    private List<String> collectDescendantIds(String id, List<Task> all) {
        ArrayList<String> result = new ArrayList<>();
        result.add(id);
        for (Task t : all) {
            if (id.equals(t.getParentId())) {
                result.addAll(collectDescendantIds(t.getId(), all));
            }
        }
        return result;
    }

    private TaskNodeDTO toDTO(Task t) {
        return new TaskNodeDTO(
                t.getId(),
                t.getType(),
                t.getTitle(),
                t.getParentId(),
                t.getSortOrder(),
                t.getStatus() != null ? t.getStatus().name() : null,
                t.getIsExpanded(),
                t.getIsDeleted(),
                formatDateTime(t.getDeletedAt()),
                formatDateTime(t.getCreatedAt()),
                formatDateTime(t.getCompletedAt()),
                formatDateTime(t.getScheduledAt()),
                t.getContent(),
                t.getWorkDurationMinutes()
        );
    }

    private Task toEntity(TaskNodeDTO dto) {
        Task t = new Task();
        t.setId(dto.id());
        t.setTitle(dto.title());
        t.setType(dto.type() != null ? dto.type() : "task");
        t.setParentId(dto.parentId());
        t.setSortOrder(dto.order());
        t.setStatus(dto.status() != null ? TaskStatus.valueOf(dto.status()) : null);
        t.setIsExpanded(dto.isExpanded());
        t.setIsDeleted(dto.isDeleted() != null ? dto.isDeleted() : false);
        t.setDeletedAt(parseDateTime(dto.deletedAt()));
        t.setCreatedAt(parseDateTime(dto.createdAt()));
        t.setCompletedAt(parseDateTime(dto.completedAt()));
        t.setScheduledAt(parseDateTime(dto.scheduledAt()));
        t.setContent(dto.content());
        t.setWorkDurationMinutes(dto.workDurationMinutes());
        return t;
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
    }

    private LocalDateTime parseDateTime(String s) {
        if (s == null || s.isEmpty()) return null;
        String cleaned = s.replace("Z", "");
        if (cleaned.contains("+")) {
            cleaned = cleaned.substring(0, cleaned.indexOf('+'));
        }
        return LocalDateTime.parse(cleaned, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
