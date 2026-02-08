package com.sonicflow.service;

import com.sonicflow.entity.SessionType;
import com.sonicflow.entity.TimerSession;
import com.sonicflow.entity.TimerSettings;
import com.sonicflow.repository.TimerSessionRepository;
import com.sonicflow.repository.TimerSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TimerService {

    private final TimerSettingsRepository timerSettingsRepository;
    private final TimerSessionRepository timerSessionRepository;

    public TimerService(TimerSettingsRepository timerSettingsRepository,
                       TimerSessionRepository timerSessionRepository) {
        this.timerSettingsRepository = timerSettingsRepository;
        this.timerSessionRepository = timerSessionRepository;
    }

    public TimerSettings getSettings() {
        return timerSettingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    TimerSettings defaultSettings = new TimerSettings();
                    return timerSettingsRepository.save(defaultSettings);
                });
    }

    public TimerSettings updateSettings(Integer workDuration, Integer breakDuration,
                                        Integer longBreakDuration, Integer sessionsBeforeLongBreak) {
        TimerSettings settings = getSettings();

        if (workDuration != null && workDuration > 0) {
            settings.setWorkDuration(workDuration);
        }
        if (breakDuration != null && breakDuration > 0) {
            settings.setBreakDuration(breakDuration);
        }
        if (longBreakDuration != null && longBreakDuration > 0) {
            settings.setLongBreakDuration(longBreakDuration);
        }
        if (sessionsBeforeLongBreak != null && sessionsBeforeLongBreak > 0) {
            settings.setSessionsBeforeLongBreak(sessionsBeforeLongBreak);
        }

        return timerSettingsRepository.save(settings);
    }

    public TimerSession startSession(SessionType sessionType, String taskId) {
        TimerSession session = new TimerSession();
        session.setSessionType(sessionType);
        session.setTaskId(taskId);
        return timerSessionRepository.save(session);
    }

    public TimerSession endSession(Long id, Integer duration, Boolean completed) {
        TimerSession session = timerSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));

        session.setCompletedAt(LocalDateTime.now());
        session.setDuration(duration);
        session.setCompleted(completed != null ? completed : false);

        return timerSessionRepository.save(session);
    }

    public List<TimerSession> getAllSessions() {
        return timerSessionRepository.findAllByOrderByStartedAtDesc();
    }

    public List<TimerSession> getSessionsByTaskId(String taskId) {
        return timerSessionRepository.findByTaskIdOrderByStartedAtDesc(taskId);
    }
}
