package com.sonicflow.controller;

import com.sonicflow.entity.Task;
import com.sonicflow.entity.TaskStatus;
import com.sonicflow.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getIncompleteTasks() {
        return taskService.getIncompleteTasks();
    }

    @GetMapping("/history")
    public List<Task> getCompletedTasks() {
        return taskService.getCompletedTasks();
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Task task = taskService.createTask(title);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            TaskStatus status = null;
            if (request.containsKey("status")) {
                status = TaskStatus.valueOf(request.get("status"));
            }
            Task task = taskService.updateTask(id, title, status);
            return ResponseEntity.ok(task);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
