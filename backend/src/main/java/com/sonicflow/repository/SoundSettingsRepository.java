package com.sonicflow.repository;

import com.sonicflow.entity.SoundSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SoundSettingsRepository extends JpaRepository<SoundSettings, Long> {

    Optional<SoundSettings> findBySoundType(String soundType);
}
