package com.sonicflow.controller;

import com.sonicflow.entity.SoundPreset;
import com.sonicflow.entity.SoundSettings;
import com.sonicflow.service.SoundService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SoundController {

    private final SoundService soundService;

    public SoundController(SoundService soundService) {
        this.soundService = soundService;
    }

    @GetMapping("/sound-settings")
    public List<SoundSettings> getAllSettings() {
        return soundService.getAllSettings();
    }

    @PutMapping("/sound-settings")
    public ResponseEntity<SoundSettings> updateSettings(@RequestBody Map<String, Object> request) {
        String soundType = (String) request.get("soundType");
        if (soundType == null || soundType.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Integer volume = request.get("volume") != null ? (Integer) request.get("volume") : null;
        Boolean enabled = request.get("enabled") != null ? (Boolean) request.get("enabled") : null;

        SoundSettings settings = soundService.updateSettings(soundType, volume, enabled);
        return ResponseEntity.ok(settings);
    }

    @GetMapping("/sound-presets")
    public List<SoundPreset> getAllPresets() {
        return soundService.getAllPresets();
    }

    @PostMapping("/sound-presets")
    public ResponseEntity<SoundPreset> createPreset(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String settingsJson = request.get("settingsJson");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        SoundPreset preset = soundService.createPreset(name, settingsJson);
        return ResponseEntity.status(HttpStatus.CREATED).body(preset);
    }

    @DeleteMapping("/sound-presets/{id}")
    public ResponseEntity<Void> deletePreset(@PathVariable Long id) {
        try {
            soundService.deletePreset(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
