package com.sonicflow.repository;

import com.sonicflow.entity.AISettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AISettingsRepository extends JpaRepository<AISettings, Long> {
}
