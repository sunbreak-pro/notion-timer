package com.sonicflow.repository;

import com.sonicflow.entity.TimerSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimerSettingsRepository extends JpaRepository<TimerSettings, Long> {
}
