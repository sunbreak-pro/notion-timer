package com.sonicflow.controller;

import com.sonicflow.dto.TaskNodeDTO;
import com.sonicflow.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/migrate")
public class MigrationController {

    private final TaskService taskService;

    public MigrationController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/tasks")
    public ResponseEntity<Void> migrateTasks(@RequestBody List<TaskNodeDTO> tasks) {
        taskService.syncTree(tasks);
        return ResponseEntity.ok().build();
    }
}
