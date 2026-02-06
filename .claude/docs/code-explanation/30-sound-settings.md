# サウンド設定 取得/更新フロー

## 概要

`useSoundSettings` フックのマウント時に全サウンド設定を取得し、特定のサウンドタイプの音量・有効/無効を更新できる。バックエンドは Upsert パターンを採用: 指定された `soundType` のレコードが存在すれば更新し、存在しなければ新規作成する。音量は 0-100 の範囲にクランプされる。

## シーケンス図（取得）

```
useTimer(未接続)   useSoundSettings     soundApi          SoundController    SoundService     SoundSettingsRepo    DB
 │                  │                    │                  │                  │                │                   │
 │                  │──useEffect()──────▶│                  │                  │                │                   │
 │                  │  setLoading(true)   │                  │                  │                │                   │
 │                  │──Promise.all()────▶│                  │                  │                │                   │
 │                  │                    │──GET /sound-settings──▶             │                │                   │
 │                  │                    │                  │──getAllSettings()─▶               │                   │
 │                  │                    │                  │                  │──findAll()────▶│                   │
 │                  │                    │                  │                  │               │──SELECT──▶        │
 │                  │                    │◀──200+[Settings]─│◀──[Settings]─────│◀──────────────│                   │
 │                  │◀──SoundSettings[]──│                  │                  │                │                   │
 │                  │  setSettings(data)  │                  │                  │                │                   │
 │                  │  setLoading(false)  │                  │                  │                │                   │
```

## シーケンス図（更新 — Upsert）

```
(将来のUI)   useSoundSettings        soundApi          SoundController    SoundService          SoundSettingsRepo    DB
 │               │                    │                  │                  │                      │                   │
 │──updateSoundSettings("rain",{volume:80})──▶          │                  │                      │                   │
 │               │──updateSettings()──▶                  │                  │                      │                   │
 │               │                    │──PUT /sound-settings──▶            │                      │                   │
 │               │                    │                  │──updateSettings()──▶                    │                   │
 │               │                    │                  │                  │──findBySoundType()──▶│                   │
 │               │                    │                  │                  │                      │──SELECT──▶        │
 │               │                    │                  │                  │ (存在→更新 or 新規作成)│                   │
 │               │                    │                  │                  │──save()──────────────▶──INSERT/UPDATE──▶ │
 │               │                    │◀──200+Settings───│◀──Settings───────│◀─────────────────────│                   │
 │               │◀──SoundSettings────│                  │                  │                      │                   │
 │               │  setSettings(upsert)│                  │                  │                     │                   │
 │◀──設定反映────│                    │                  │                  │                      │                   │
```

## フロントエンド トレース

### 1. 初期化: useSoundSettings.fetchSettings

**ファイル**: `frontend/src/hooks/useSoundSettings.ts`

```typescript
// useSoundSettings.ts:12-32
const fetchSettings = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [settingsData, presetsData] = await Promise.all([
      soundApi.getAllSettings(),      // GET /api/sound-settings
      soundApi.getAllPresets(),        // GET /api/sound-presets
    ]);
    setSettings(settingsData);
    setPresets(presetsData);
  } catch (err) { ... }
}, []);
```

- 設定とプリセットを並列取得
- `settings`: `SoundSettings[]`（サウンドタイプごとの設定）
- `presets`: `SoundPreset[]`（プリセット一覧）

### 2. 設定更新: useSoundSettings.updateSoundSettings

```typescript
// useSoundSettings.ts:38-58
const updateSoundSettings = useCallback(
  async (soundType: string, updates: { volume?: number; enabled?: boolean }) => {
    try {
      setError(null);
      const updatedSettings = await soundApi.updateSettings(soundType, updates);
      setSettings((prev) => {
        const existing = prev.find((s) => s.soundType === soundType);
        if (existing) {
          return prev.map((s) => (s.soundType === soundType ? updatedSettings : s));
        }
        return [...prev, updatedSettings];    // 新規 → 配列に追加
      });
      return updatedSettings;
    } catch (err) { ... }
  },
  []
);
```

**ローカル state の Upsert ロジック**:
- 既存の soundType が見つかった → `map` で置換
- 見つからなかった（新規作成） → 配列の末尾に追加

### 3. getSettingsMap ヘルパー

```typescript
// useSoundSettings.ts:108-114
const getSettingsMap = useCallback((): SoundSettingsMap => {
  const map: SoundSettingsMap = {};
  settings.forEach((s) => {
    map[s.soundType] = { volume: s.volume, enabled: s.enabled };
  });
  return map;
}, [settings]);
```

- `SoundSettings[]` → `{ [soundType]: { volume, enabled } }` のマップ変換
- プリセット作成時に使用

### 4. APIクライアント: soundApi

**ファイル**: `frontend/src/api/soundSettings.ts`

```typescript
// soundSettings.ts:38-42 (全設定取得)
async getAllSettings(): Promise<SoundSettings[]> {
  const response = await apiClient.get<SoundSettingsResponse[]>('/api/sound-settings');
  return response.data.map(mapSoundSettingsResponse);
},

// soundSettings.ts:44-53 (設定更新)
async updateSettings(soundType: string, updates: { volume?: number; enabled?: boolean }): Promise<SoundSettings> {
  const response = await apiClient.put<SoundSettingsResponse>('/api/sound-settings', {
    soundType,
    ...updates,
  });
  return mapSoundSettingsResponse(response.data);
},
```

- 更新リクエストで `soundType` を body に含める（URLパラメータではない）
- `{ soundType, ...updates }` → `{ soundType: "rain", volume: 80 }` のように展開

## HTTPリクエスト/レスポンス

### 全設定取得

```
GET /api/sound-settings

→ 200 OK
[
  { "id": 1, "soundType": "rain", "volume": 50, "enabled": false, "updatedAt": "2025-01-15T10:00:00" },
  { "id": 2, "soundType": "forest", "volume": 30, "enabled": true, "updatedAt": "2025-01-15T10:00:00" }
]
```

### 設定更新（既存）

```
PUT /api/sound-settings
Content-Type: application/json

{ "soundType": "rain", "volume": 80 }

→ 200 OK
{ "id": 1, "soundType": "rain", "volume": 80, "enabled": false, "updatedAt": "2025-01-15T14:00:00" }
```

### 設定更新（新規 — Upsert）

```
PUT /api/sound-settings
Content-Type: application/json

{ "soundType": "waves", "volume": 60, "enabled": true }

→ 200 OK
{ "id": 3, "soundType": "waves", "volume": 60, "enabled": true, "updatedAt": "2025-01-15T14:00:00" }
```

## バックエンド トレース

### 1. Controller: SoundController

**ファイル**: `backend/src/main/java/com/sonicflow/controller/SoundController.java`

```java
// SoundController.java:23-26 (取得)
@GetMapping("/sound-settings")
public List<SoundSettings> getAllSettings() {
    return soundService.getAllSettings();
}

// SoundController.java:28-40 (更新)
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
```

### 2. Service: SoundService — Upsert パターン

**ファイル**: `backend/src/main/java/com/sonicflow/service/SoundService.java`

```java
// SoundService.java:29-45
public SoundSettings updateSettings(String soundType, Integer volume, Boolean enabled) {
    SoundSettings settings = soundSettingsRepository.findBySoundType(soundType)
            .orElseGet(() -> {                              // 存在しなければ新規作成
                SoundSettings newSettings = new SoundSettings();
                newSettings.setSoundType(soundType);
                return newSettings;
            });

    if (volume != null) {
        settings.setVolume(Math.max(0, Math.min(100, volume)));   // 0-100 クランプ
    }
    if (enabled != null) {
        settings.setEnabled(enabled);
    }

    return soundSettingsRepository.save(settings);
}
```

**Upsert の仕組み**:
1. `findBySoundType(soundType)` で検索
2. 見つかった → 既存レコードを更新
3. 見つからなかった → `orElseGet` で新しい Entity を生成（デフォルト: volume=50, enabled=false）
4. `save()` で INSERT or UPDATE

**volume クランプ**: `Math.max(0, Math.min(100, volume))` で 0-100 の範囲に制限。

### 3. Entity: SoundSettings

**ファイル**: `backend/src/main/java/com/sonicflow/entity/SoundSettings.java`

```java
// SoundSettings.java:17-21 (デフォルト値)
private String soundType;
private Integer volume = 50;
private Boolean enabled = false;

// SoundSettings.java:26-34 (@PrePersist + @PreUpdate)
@PrePersist
protected void onCreate() { updatedAt = LocalDateTime.now(); }
@PreUpdate
protected void onUpdate() { updatedAt = LocalDateTime.now(); }
```

### 4. Repository

**ファイル**: `backend/src/main/java/com/sonicflow/repository/SoundSettingsRepository.java`

```java
// SoundSettingsRepository.java:12
Optional<SoundSettings> findBySoundType(String soundType);
```

- `soundType` でのユニーク検索（ただし DB レベルのユニーク制約は Entity に定義されていない）

## データ変換テーブル

| レイヤー | soundType | volume | enabled | updatedAt |
|---------|-----------|--------|---------|-----------|
| フロントエンド引数 | `string` | `number?` | `boolean?` | — |
| API リクエスト body | `string` | `number` or 省略 | `boolean` or 省略 | — |
| Controller 受取 | `String` | `Integer` or `null` | `Boolean` or `null` | — |
| Service 処理後 | `String` | クランプ済み `Integer` | `Boolean` | — |
| Entity (save後) | `String` | `Integer` | `Boolean` | `LocalDateTime.now()` |
| API レスポンス | `string` | `number` | `boolean` | ISO文字列 |
| mapSoundSettingsResponse | `string` | `number` | `boolean` | `Date` |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| Controller | soundType が null/空白 | 400 Bad Request |
| useSoundSettings | ネットワーク切断 | `'サーバーに接続できません...'` |
| useSoundSettings | API失敗（取得） | `'サウンド設定の取得に失敗しました'` |
| useSoundSettings | API失敗（更新） | `'サウンド設定の更新に失敗しました'` + `throw err` |

## 設計メモ

- **Upsert パターン**: PUT で新規作成も行う。標準的な REST 設計では POST が新規作成担当だが、ここでは soundType をキーとした Upsert として PUT を使用。
- **soundType に制約なし**: 任意の文字列を soundType として送信可能。フロントエンドが定義するサウンドタイプ一覧に依存。
- **ユニーク制約の欠如**: `soundType` に DB レベルのユニーク制約がないため、同じ soundType のレコードが複数作成される可能性がある。`findBySoundType` は `Optional` を返すため、最初に見つかった1件のみ使用。
- **volume クランプ**: 負の値や100超の値を送信しても安全。バックエンドが 0-100 に制限。
- **Phase 2 UI未実装**: `useSoundSettings` は App.tsx で呼び出されていない。Sound セクションはプレースホルダーテキスト表示。
