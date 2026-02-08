package com.sonicflow.controller;

import com.sonicflow.entity.SessionType;
import com.sonicflow.entity.TimerSession;
import com.sonicflow.entity.TimerSettings;
import com.sonicflow.service.TimerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TimerController {

    private final TimerService timerService;

    public TimerController(TimerService timerService) {
        this.timerService = timerService;
    }

    @GetMapping("/timer-settings")
    public TimerSettings getSettings() {
        return timerService.getSettings();
    }

    @PutMapping("/timer-settings")
    public ResponseEntity<TimerSettings> updateSettings(@RequestBody Map<String, Integer> request) {
        Integer workDuration = request.get("workDuration");
        Integer breakDuration = request.get("breakDuration");
        Integer longBreakDuration = request.get("longBreakDuration");
        Integer sessionsBeforeLongBreak = request.get("sessionsBeforeLongBreak");

        TimerSettings settings = timerService.updateSettings(
                workDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak);
        return ResponseEntity.ok(settings);
    }

    @PostMapping("/timer-sessions")
    public ResponseEntity<TimerSession> startSession(@RequestBody Map<String, Object> request) {
        String sessionTypeStr = (String) request.get("sessionType");
        if (sessionTypeStr == null) {
            return ResponseEntity.badRequest().build();
        }

        SessionType sessionType;
        try {
            sessionType = SessionType.valueOf(sessionTypeStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        String taskId = request.get("taskId") != null
                ? request.get("taskId").toString()
                : null;

        TimerSession session = timerService.startSession(sessionType, taskId);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PutMapping("/timer-sessions/{id}")
    public ResponseEntity<TimerSession> endSession(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Integer duration = request.get("duration") != null
                    ? ((Number) request.get("duration")).intValue()
                    : null;
            Boolean completed = (Boolean) request.get("completed");

            TimerSession session = timerService.endSession(id, duration, completed);
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/timer-sessions")
    public List<TimerSession> getAllSessions() {
        return timerService.getAllSessions();
    }

    @GetMapping("/tasks/{taskId}/sessions")
    public List<TimerSession> getSessionsByTask(@PathVariable String taskId) {
        return timerService.getSessionsByTaskId(taskId);
    }
}
