# プリセット 作成/削除/適用フロー

## 概要

サウンドプリセットは、現在のミキサー設定（全サウンドタイプの volume + enabled）をJSON文字列としてスナップショット保存する機能。保存したプリセットを適用すると、全サウンドタイプの設定が一括更新される。

## シーケンス図（プリセット作成）

```
(将来のUI)  useSoundSettings        soundApi           SoundController    SoundService     SoundPresetRepo    DB
 │               │                    │                   │                 │                │                 │
 │──createPreset("カフェ")──▶         │                   │                 │                │                 │
 │               │ settings→settingsMap                   │                 │                │                 │
 │               │ JSON.stringify(map)  │                   │                 │                │                 │
 │               │──createPreset()────▶│                   │                 │                │                 │
 │               │                    │──POST /sound-presets──▶             │                │                 │
 │               │                    │                   │──createPreset()─▶               │                 │
 │               │                    │                   │                 │──save()────────▶──INSERT──▶      │
 │               │                    │◀──201+Preset──────│◀──Preset────────│◀───────────────│                 │
 │               │◀──SoundPreset──────│                   │                 │                │                 │
 │               │  setPresets([new, ...prev])             │                 │                │                 │
 │◀──プリセット追加│                   │                   │                 │                │                 │
```

## シーケンス図（プリセット適用）

```
(将来のUI)  useSoundSettings        soundApi           SoundController    SoundService     DB
 │               │                    │                   │                 │               │
 │──applyPreset(preset)──▶            │                   │                 │               │
 │               │ JSON.parse(settingsJson)                │                 │               │
 │               │ Object.entries→ Promise.all             │                 │               │
 │               │──updateSettings("rain",{...})──▶       │                 │               │
 │               │──updateSettings("forest",{...})──▶     │                 │               │
 │               │──updateSettings("waves",{...})──▶      │                 │               │   並列実行
 │               │                    │──PUT ×N──────────▶│──updateSettings()×N──▶         │
 │               │                    │                   │                 │──UPDATE×N──▶  │
 │               │                    │◀──[Settings×N]────│◀──[Settings]────│◀──────────────│
 │               │◀──SoundSettings[]──│                   │                 │               │
 │               │  setSettings(updatedSettings)           │                 │               │
 │◀──全設定反映──│                    │                   │                 │               │
```

## フロントエンド トレース

### 1. プリセット作成: createPreset

**ファイル**: `frontend/src/hooks/useSoundSettings.ts`

```typescript
// useSoundSettings.ts:60-75
const createPreset = useCallback(async (name: string) => {
  try {
    setError(null);
    const settingsMap: SoundSettingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.soundType] = { volume: s.volume, enabled: s.enabled };
    });
    const newPreset = await soundApi.createPreset(name, JSON.stringify(settingsMap));
    setPresets((prev) => [newPreset, ...prev]);
    return newPreset;
  } catch (err) { ... }
}, [settings]);
```

**処理の流れ**:
1. 現在の `settings[]` を `SoundSettingsMap` に変換
2. `JSON.stringify()` で文字列化
3. API に name + settingsJson を送信
4. 成功後、プリセット配列の先頭に追加

**settingsJson の例**:
```json
{
  "rain": { "volume": 80, "enabled": true },
  "forest": { "volume": 30, "enabled": true },
  "waves": { "volume": 0, "enabled": false }
}
```

### 2. プリセット削除: deletePreset

```typescript
// useSoundSettings.ts:77-87
const deletePreset = useCallback(async (id: number) => {
  try {
    setError(null);
    await soundApi.deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  } catch (err) { ... }
}, []);
```

- API呼出 → 成功後、ローカル配列から `filter` で除去

### 3. プリセット適用: applyPreset

```typescript
// useSoundSettings.ts:89-106
const applyPreset = useCallback(
  async (preset: SoundPreset) => {
    try {
      setError(null);
      const settingsMap: SoundSettingsMap = JSON.parse(preset.settingsJson);
      const updatePromises = Object.entries(settingsMap).map(
        ([soundType, { volume, enabled }]) =>
          soundApi.updateSettings(soundType, { volume, enabled })
      );
      const updatedSettings = await Promise.all(updatePromises);
      setSettings(updatedSettings);
    } catch (err) { ... }
  },
  []
);
```

**処理の流れ**:
1. `preset.settingsJson` を `JSON.parse()` でマップに復元
2. 各 soundType について `soundApi.updateSettings` を呼ぶ Promise を生成
3. `Promise.all` で全サウンドタイプを並列更新
4. 全結果を `setSettings` で一括設定（既存配列を完全置換）

### 4. APIクライアント

**ファイル**: `frontend/src/api/soundSettings.ts`

```typescript
// soundSettings.ts:55-66 (プリセット取得)
async getAllPresets(): Promise<SoundPreset[]> {
  const response = await apiClient.get<SoundPresetResponse[]>('/api/sound-presets');
  return response.data.map(mapSoundPresetResponse);
},

// soundSettings.ts:60-66 (プリセット作成)
async createPreset(name: string, settingsJson: string): Promise<SoundPreset> {
  const response = await apiClient.post<SoundPresetResponse>('/api/sound-presets', {
    name,
    settingsJson,
  });
  return mapSoundPresetResponse(response.data);
},

// soundSettings.ts:68-70 (プリセット削除)
async deletePreset(id: number): Promise<void> {
  await apiClient.delete(`/api/sound-presets/${id}`);
},
```

## HTTPリクエスト/レスポンス

### プリセット一覧取得

```
GET /api/sound-presets

→ 200 OK
[
  { "id": 1, "name": "カフェ", "settingsJson": "{\"rain\":{\"volume\":80,...}}", "createdAt": "2025-01-15T10:00:00" }
]
```

### プリセット作成

```
POST /api/sound-presets
Content-Type: application/json

{
  "name": "カフェ",
  "settingsJson": "{\"rain\":{\"volume\":80,\"enabled\":true},\"forest\":{\"volume\":30,\"enabled\":true}}"
}

→ 201 Created
{ "id": 1, "name": "カフェ", "settingsJson": "...", "createdAt": "2025-01-15T10:00:00" }
```

### プリセット削除

```
DELETE /api/sound-presets/1

→ 204 No Content
```

### プリセット適用（複数の PUT が並列発行される）

```
PUT /api/sound-settings  { "soundType": "rain", "volume": 80, "enabled": true }
PUT /api/sound-settings  { "soundType": "forest", "volume": 30, "enabled": true }
PUT /api/sound-settings  { "soundType": "waves", "volume": 0, "enabled": false }

→ 各 200 OK + SoundSettings
```

## バックエンド トレース

### 1. Controller: SoundController — プリセット

**ファイル**: `backend/src/main/java/com/sonicflow/controller/SoundController.java`

```java
// SoundController.java:42-45 (一覧)
@GetMapping("/sound-presets")
public List<SoundPreset> getAllPresets() {
    return soundService.getAllPresets();
}

// SoundController.java:47-58 (作成)
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

// SoundController.java:60-68 (削除)
@DeleteMapping("/sound-presets/{id}")
public ResponseEntity<Void> deletePreset(@PathVariable Long id) {
    try {
        soundService.deletePreset(id);
        return ResponseEntity.noContent().build();
    } catch (IllegalArgumentException e) {
        return ResponseEntity.notFound().build();
    }
}
```

### 2. Service: SoundService — プリセット

**ファイル**: `backend/src/main/java/com/sonicflow/service/SoundService.java`

```java
// SoundService.java:47-55 (一覧)
public List<SoundPreset> getAllPresets() {
    return soundPresetRepository.findAllByOrderByCreatedAtDesc();
}

// SoundService.java:51-56 (作成)
public SoundPreset createPreset(String name, String settingsJson) {
    SoundPreset preset = new SoundPreset();
    preset.setName(name);
    preset.setSettingsJson(settingsJson);
    return soundPresetRepository.save(preset);
}

// SoundService.java:58-63 (削除)
public void deletePreset(Long id) {
    if (!soundPresetRepository.existsById(id)) {
        throw new IllegalArgumentException("Preset not found: " + id);
    }
    soundPresetRepository.deleteById(id);
}
```

### 3. Entity: SoundPreset

**ファイル**: `backend/src/main/java/com/sonicflow/entity/SoundPreset.java`

```java
// SoundPreset.java:14-15
@Column(nullable = false)
private String name;

// SoundPreset.java:17-18
@Column(columnDefinition = "TEXT")
private String settingsJson;          // JSON文字列をそのまま保存

// SoundPreset.java:23-26
@PrePersist
protected void onCreate() {
    createdAt = LocalDateTime.now();
}
```

- `settingsJson` は `TEXT` 型で保存（長いJSON対応）
- バックエンドは JSON を解析せず、文字列としてそのまま保存/返却

### 4. Repository

**ファイル**: `backend/src/main/java/com/sonicflow/repository/SoundPresetRepository.java`

```java
// SoundPresetRepository.java:12
List<SoundPreset> findAllByOrderByCreatedAtDesc();
```

## データフロー（プリセット作成 → 適用）

```
作成時:
  settings[] → SoundSettingsMap → JSON.stringify() → settingsJson (string)
                                                        │
                                                        ▼ POST /sound-presets
                                                   DB に TEXT として保存

適用時:
  DB の settingsJson (TEXT) → API レスポンス → JSON.parse() → SoundSettingsMap
                                                                  │
                                              Object.entries → PUT /sound-settings × N (並列)
                                                                  │
                                              Promise.all → SoundSettings[] → setSettings()
```

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| Controller | name が null/空白 | 400 Bad Request |
| Controller | preset ID 不存在 | 404 Not Found |
| useSoundSettings | 作成失敗 | `'プリセットの作成に失敗しました'` + `throw err` |
| useSoundSettings | 削除失敗 | `'プリセットの削除に失敗しました'` + `throw err` |
| useSoundSettings | 適用失敗 | `'プリセットの適用に失敗しました'` + `throw err` |
| applyPreset | JSON.parse 失敗 | catch ブロックでエラー処理 |
| applyPreset | 1つの PUT 失敗 | Promise.all が全体失敗 → 部分適用が残る可能性 |

## 設計メモ

- **settingsJson の透過保存**: バックエンドは JSON を解析しない。フロントエンドがシリアライズ/デシリアライズの全責任を負う。バックエンドは単純な文字列保存。
- **適用の非原子性**: `Promise.all` で並列に PUT を送るが、一部が成功し一部が失敗する可能性がある。トランザクション的な「全部成功 or 全部ロールバック」ではない。
- **setSettings の完全置換**: `applyPreset` の `setSettings(updatedSettings)` は配列を完全置換する。プリセットに含まれない soundType の設定は消失する（ローカル state から）。ただし DB には残る。
- **プリセット適用のAPI呼出数**: サウンドタイプの数だけ PUT が発行される。3タイプなら3リクエスト。バッチ更新APIは未実装。
- **settingsJson のバリデーション未実装**: バックエンドが `settingsJson` の形式を検証しないため、不正なJSON文字列も保存可能。適用時に `JSON.parse` が失敗する可能性。
- **Phase 2 UI未実装**: これらの機能は Hook/API レベルでは完成しているが、UI コンポーネントは未実装。
