package com.sonicflow.service;

import com.sonicflow.entity.SoundPreset;
import com.sonicflow.entity.SoundSettings;
import com.sonicflow.repository.SoundPresetRepository;
import com.sonicflow.repository.SoundSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SoundService {

    private final SoundSettingsRepository soundSettingsRepository;
    private final SoundPresetRepository soundPresetRepository;

    public SoundService(SoundSettingsRepository soundSettingsRepository,
                       SoundPresetRepository soundPresetRepository) {
        this.soundSettingsRepository = soundSettingsRepository;
        this.soundPresetRepository = soundPresetRepository;
    }

    public List<SoundSettings> getAllSettings() {
        return soundSettingsRepository.findAll();
    }

    public SoundSettings updateSettings(String soundType, Integer volume, Boolean enabled) {
        SoundSettings settings = soundSettingsRepository.findBySoundType(soundType)
                .orElseGet(() -> {
                    SoundSettings newSettings = new SoundSettings();
                    newSettings.setSoundType(soundType);
                    return newSettings;
                });

        if (volume != null) {
            settings.setVolume(Math.max(0, Math.min(100, volume)));
        }
        if (enabled != null) {
            settings.setEnabled(enabled);
        }

        return soundSettingsRepository.save(settings);
    }

    public List<SoundPreset> getAllPresets() {
        return soundPresetRepository.findAllByOrderByCreatedAtDesc();
    }

    public SoundPreset createPreset(String name, String settingsJson) {
        SoundPreset preset = new SoundPreset();
        preset.setName(name);
        preset.setSettingsJson(settingsJson);
        return soundPresetRepository.save(preset);
    }

    public void deletePreset(Long id) {
        if (!soundPresetRepository.existsById(id)) {
            throw new IllegalArgumentException("Preset not found: " + id);
        }
        soundPresetRepository.deleteById(id);
    }
}
