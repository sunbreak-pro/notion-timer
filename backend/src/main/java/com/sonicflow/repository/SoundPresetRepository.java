package com.sonicflow.repository;

import com.sonicflow.entity.SoundPreset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SoundPresetRepository extends JpaRepository<SoundPreset, Long> {

    List<SoundPreset> findAllByOrderByCreatedAtDesc();
}
