package com.sonicflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "timer_settings")
public class TimerSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer workDuration = 25;

    @Column(nullable = false)
    private Integer breakDuration = 5;

    @Column(nullable = false)
    private Integer longBreakDuration = 15;

    @Column(nullable = false)
    private Integer sessionsBeforeLongBreak = 4;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getWorkDuration() {
        return workDuration;
    }

    public void setWorkDuration(Integer workDuration) {
        this.workDuration = workDuration;
    }

    public Integer getBreakDuration() {
        return breakDuration;
    }

    public void setBreakDuration(Integer breakDuration) {
        this.breakDuration = breakDuration;
    }

    public Integer getLongBreakDuration() {
        return longBreakDuration;
    }

    public void setLongBreakDuration(Integer longBreakDuration) {
        this.longBreakDuration = longBreakDuration;
    }

    public Integer getSessionsBeforeLongBreak() {
        return sessionsBeforeLongBreak;
    }

    public void setSessionsBeforeLongBreak(Integer sessionsBeforeLongBreak) {
        this.sessionsBeforeLongBreak = sessionsBeforeLongBreak;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
