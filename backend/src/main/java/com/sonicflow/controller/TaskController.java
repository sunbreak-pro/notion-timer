package com.sonicflow.controller;

import com.sonicflow.dto.TaskNodeDTO;
import com.sonicflow.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tree")
    public List<TaskNodeDTO> getTaskTree() {
        return taskService.getTaskTree();
    }

    @GetMapping("/deleted")
    public List<TaskNodeDTO> getDeletedTasks() {
        return taskService.getDeletedTasks();
    }

    @PostMapping
    public ResponseEntity<TaskNodeDTO> createTask(@RequestBody TaskNodeDTO dto) {
        if (dto.title() == null || dto.title().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        TaskNodeDTO created = taskService.createTask(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskNodeDTO> updateTask(
            @PathVariable String id,
            @RequestBody TaskNodeDTO dto) {
        try {
            TaskNodeDTO updated = taskService.updateTask(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/tree")
    public ResponseEntity<Void> syncTree(@RequestBody List<TaskNodeDTO> dtos) {
        taskService.syncTree(dtos);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/soft")
    public ResponseEntity<Void> softDelete(@PathVariable String id) {
        try {
            taskService.softDelete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> permanentDelete(@PathVariable String id) {
        try {
            taskService.permanentDelete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable String id) {
        try {
            taskService.restore(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
