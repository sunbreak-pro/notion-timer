# タイマー設定 取得/更新フロー

## 概要

`useTimer` フックのマウント時に、タイマー設定（作業時間、休憩時間など）をバックエンドから取得する。バックエンドは「シングルトンパターン」を採用し、DB に設定レコードが存在しなければデフォルト値で自動生成する。設定更新時は、タイマーが動作中でなければ remainingSeconds も連動して再計算される。

## シーケンス図（取得）

```
Browser        App(未接続)    useTimer            timerApi          TimerController   TimerService    TimerSettingsRepo   DB
 │               │              │                   │                  │                │               │                 │
 │               │              │──useEffect()──────▶                  │                │               │                 │
 │               │              │  setLoading(true)  │                 │                │               │                 │
 │               │              │──Promise.all()────▶│                 │                │               │                 │
 │               │              │                   │──GET /timer-settings──▶           │               │                 │
 │               │              │                   │                  │──getSettings()─▶│              │                 │
 │               │              │                   │                  │                │──findAll()────▶│                │
 │               │              │                   │                  │                │               │──SELECT──▶      │
 │               │              │                   │                  │                │               │                 │
 │               │              │                   │                  │                │ (0件の場合)     │                 │
 │               │              │                   │                  │                │──save(default)─▶──INSERT──▶     │
 │               │              │                   │                  │                │               │                 │
 │               │              │                   │◀──200+Settings───│◀──Settings─────│◀──────────────│                 │
 │               │              │◀──TimerSettings────│                 │                │               │                 │
 │               │              │  setSettings(data) │                 │                │               │                 │
 │               │              │  setTimerState({remainingSeconds: workDuration*60})   │               │                 │
 │               │              │  setLoading(false) │                 │                │               │                 │
```

## シーケンス図（更新）

```
(将来のUI)     useTimer            timerApi          TimerController   TimerService    DB
 │               │                   │                  │                │              │
 │──updateSettings({workDuration:30})──▶                │                │              │
 │               │──PUT /timer-settings──▶              │                │              │
 │               │                   │──────────────────▶──updateSettings()──▶          │
 │               │                   │                  │                │──UPDATE──▶   │
 │               │                   │◀──200+Settings───│◀──Settings─────│◀─────────────│
 │               │◀──TimerSettings────│                 │                │              │
 │               │  setSettings(data) │                 │                │              │
 │               │  (停止中なら) setTimerState({remainingSeconds: newDuration*60})       │
 │◀──設定反映────│                    │                 │                │              │
```

## フロントエンド トレース

### 1. 初期化: useTimer.fetchData

**ファイル**: `frontend/src/hooks/useTimer.ts`

```typescript
// useTimer.ts:6-13 (デフォルト設定)
const DEFAULT_SETTINGS: TimerSettings = {
  id: 0,
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  updatedAt: new Date(),
};
```

```typescript
// useTimer.ts:32-56 (データ取得)
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [settingsData, sessionsData] = await Promise.all([
      timerApi.getSettings(),         // GET /api/timer-settings
      timerApi.getAllSessions(),       // GET /api/timer-sessions
    ]);
    setSettings(settingsData);
    setSessions(sessionsData);
    setTimerState((prev) => ({
      ...prev,
      remainingSeconds: settingsData.workDuration * 60,  // 設定値で初期化
    }));
  } catch (err) { ... }
}, []);
```

- 設定とセッション履歴を並列取得
- `remainingSeconds` を `workDuration * 60` 秒に初期化

### 2. 設定更新: useTimer.updateSettings

```typescript
// useTimer.ts:70-88
const updateSettings = useCallback(async (updates: Partial<Omit<TimerSettings, 'id' | 'updatedAt'>>) => {
  try {
    setError(null);
    const updatedSettings = await timerApi.updateSettings(updates);
    setSettings(updatedSettings);
    if (!timerState.isRunning) {
      const duration = getDurationForSessionType(timerState.currentSessionType, updatedSettings);
      setTimerState((prev) => ({
        ...prev,
        remainingSeconds: duration * 60,
      }));
    }
    return updatedSettings;
  } catch (err) { ... }
}, [timerState.isRunning, timerState.currentSessionType]);
```

- タイマー停止中のみ `remainingSeconds` を再計算
- 動作中は設定を保存するが、現在のカウントダウンには影響しない

### 3. getDurationForSessionType ヘルパー

```typescript
// useTimer.ts:90-99
const getDurationForSessionType = (type: SessionType, currentSettings: TimerSettings = settings): number => {
  switch (type) {
    case 'WORK':      return currentSettings.workDuration;
    case 'BREAK':     return currentSettings.breakDuration;
    case 'LONG_BREAK': return currentSettings.longBreakDuration;
  }
};
```

### 4. APIクライアント: timerApi

**ファイル**: `frontend/src/api/timerSettings.ts`

```typescript
// timerSettings.ts:47-50 (取得)
async getSettings(): Promise<TimerSettings> {
  const response = await apiClient.get<TimerSettingsResponse>('/api/timer-settings');
  return mapTimerSettingsResponse(response.data);
},

// timerSettings.ts:52-60 (更新)
async updateSettings(updates: { ... }): Promise<TimerSettings> {
  const response = await apiClient.put<TimerSettingsResponse>('/api/timer-settings', updates);
  return mapTimerSettingsResponse(response.data);
},
```

## HTTPリクエスト/レスポンス

### 取得

```
GET /api/timer-settings

→ 200 OK
{
  "id": 1,
  "workDuration": 25,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "sessionsBeforeLongBreak": 4,
  "updatedAt": "2025-01-15T10:00:00"
}
```

### 更新

```
PUT /api/timer-settings
Content-Type: application/json

{ "workDuration": 30 }

→ 200 OK
{
  "id": 1,
  "workDuration": 30,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "sessionsBeforeLongBreak": 4,
  "updatedAt": "2025-01-15T14:30:00"
}
```

## バックエンド トレース

### 1. Controller: TimerController

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TimerController.java`

```java
// TimerController.java:24-27 (取得)
@GetMapping("/timer-settings")
public TimerSettings getSettings() {
    return timerService.getSettings();
}

// TimerController.java:29-39 (更新)
@PutMapping("/timer-settings")
public ResponseEntity<TimerSettings> updateSettings(@RequestBody Map<String, Integer> request) {
    Integer workDuration = request.get("workDuration");
    Integer breakDuration = request.get("breakDuration");
    Integer longBreakDuration = request.get("longBreakDuration");
    Integer sessionsBeforeLongBreak = request.get("sessionsBeforeLongBreak");
    TimerSettings settings = timerService.updateSettings(
            workDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak);
    return ResponseEntity.ok(settings);
}
```

- 取得: `List<Task>` ではなく単一の `TimerSettings` を返却
- 更新: `Map<String, Integer>` で受取（全フィールドが Integer）

### 2. Service: TimerService — シングルトンパターン

**ファイル**: `backend/src/main/java/com/sonicflow/service/TimerService.java`

```java
// TimerService.java:27-34
public TimerSettings getSettings() {
    return timerSettingsRepository.findAll().stream()
            .findFirst()
            .orElseGet(() -> {
                TimerSettings defaultSettings = new TimerSettings();
                return timerSettingsRepository.save(defaultSettings);
            });
}
```

**シングルトンパターンの仕組み**:
1. `findAll()` で全レコード取得
2. `findFirst()` で最初の1件を取得
3. 0件の場合 → `orElseGet` でデフォルト設定を新規作成して保存
4. 以降は常にこの1レコードを返却

```java
// TimerService.java:36-54
public TimerSettings updateSettings(Integer workDuration, Integer breakDuration,
                                    Integer longBreakDuration, Integer sessionsBeforeLongBreak) {
    TimerSettings settings = getSettings();     // シングルトン取得

    if (workDuration != null && workDuration > 0)
        settings.setWorkDuration(workDuration);
    if (breakDuration != null && breakDuration > 0)
        settings.setBreakDuration(breakDuration);
    // ... 同様に他フィールド

    return timerSettingsRepository.save(settings);
}
```

- 各フィールドは null でなく正の値の場合のみ更新（部分更新対応）

### 3. Entity: TimerSettings

**ファイル**: `backend/src/main/java/com/sonicflow/entity/TimerSettings.java`

```java
// TimerSettings.java:14-24 (デフォルト値)
private Integer workDuration = 25;
private Integer breakDuration = 5;
private Integer longBreakDuration = 15;
private Integer sessionsBeforeLongBreak = 4;

// TimerSettings.java:29-37 (@PrePersist + @PreUpdate)
@PrePersist
protected void onCreate() { updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate() { updatedAt = LocalDateTime.now(); }
```

- フィールドデフォルト値がEntity定義に直接記載
- `@PrePersist` と `@PreUpdate` で `updatedAt` を自動管理

### 4. Repository

```java
// TimerSettingsRepository.java:8
public interface TimerSettingsRepository extends JpaRepository<TimerSettings, Long> { }
```

- カスタムクエリメソッドなし。`findAll()` と `save()` は JpaRepository 組込み。

## データ変換テーブル

| レイヤー | workDuration | updatedAt |
|---------|-------------|-----------|
| Entity デフォルト | `25` (Integer) | null → @PrePersist |
| DB | `25` (INT) | timestamp |
| Controller JSON | `25` (number) | `"2025-01-15T10:00:00"` (string) |
| timerApi | `25` (number) | `"..."` → `Date` |
| useTimer state | `25` (number) | `Date` |
| remainingSeconds | `25 * 60 = 1500` | — |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| useTimer | ネットワーク切断 | `'サーバーに接続できません...'` |
| useTimer | API失敗（取得） | `'タイマー設定の取得に失敗しました'` |
| useTimer | API失敗（更新） | `'タイマー設定の更新に失敗しました'` + `throw err` |
| Service | 全フィールド null | 何も更新せず既存値を返す |
| Service | 負の値 | `> 0` チェックで無視 |

## 設計メモ

- **シングルトンパターン**: DBに常に1行のみ。複数ユーザー未対応（個人ツール前提）。`findAll().stream().findFirst()` は理論上全件取得するため、レコードが大量にあるとパフォーマンス問題になるが、シングルトンなので問題ない。
- **デフォルト自動生成**: 初回アクセス時にデフォルト値を DB に保存。マイグレーションスクリプト不要。
- **部分更新**: `null` チェックにより、送信されたフィールドのみ更新。フロントエンドは変更したいフィールドだけ送ればよい。
- **タイマー停止中のみ再計算**: 動作中に設定変更しても現在のカウントダウンは影響されない。次のセッションから新設定が適用される。
- **Phase 2 UI未実装**: `useTimer` は App.tsx で呼び出されていない。Timer セクションはプレースホルダーテキスト表示（`App.tsx:82-88`）。
