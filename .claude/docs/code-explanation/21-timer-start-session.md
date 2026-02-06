# タイマーセッション開始フロー

## 概要

`startTimer` を呼ぶと、バックエンドに新しいセッションレコードが作成され（`startedAt` 自動設定）、フロントエンドで `setInterval` によるカウントダウンが開始される。オプションでタスクIDを紐付けることができる。

## シーケンス図

```
(将来のUI)     useTimer              timerApi           TimerController    TimerService     TimerSessionRepo    DB
 │               │                     │                   │                 │                │                  │
 │──startTimer(taskId?)──▶            │                   │                 │                │                  │
 │               │ isRunning check     │                   │                 │                │                  │
 │               │──startSession()────▶│                   │                 │                │                  │
 │               │                     │──POST /timer-sessions──▶           │                │                  │
 │               │                     │                   │──startSession()▶│               │                  │
 │               │                     │                   │                 │──save(session)─▶──INSERT──▶       │
 │               │                     │                   │                 │                │  @PrePersist     │
 │               │                     │                   │                 │                │  startedAt=now() │
 │               │                     │◀──201+Session─────│◀──Session───────│◀───────────────│                  │
 │               │◀──TimerSession───────│                  │                 │                │                  │
 │               │                     │                   │                 │                │                  │
 │               │ setTimerState({isRunning:true, currentSessionId: session.id})              │                  │
 │               │ setInterval(1秒ごと) │                   │                 │                │                  │
 │               │    ├─ remainingSeconds - 1              │                 │                │                  │
 │               │    ├─ remainingSeconds - 1              │                 │                │                  │
 │               │    └─ ...           │                   │                 │                │                  │
```

## フロントエンド トレース

### 1. startTimer 関数

**ファイル**: `frontend/src/hooks/useTimer.ts`

```typescript
// useTimer.ts:101-127
const startTimer = useCallback(async (taskId?: number) => {
  if (timerState.isRunning) return;    // 二重起動防止

  try {
    setError(null);
    currentTaskIdRef.current = taskId ?? null;
    const session = await timerApi.startSession(timerState.currentSessionType, taskId);

    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      currentSessionId: session.id,
    }));

    intervalRef.current = window.setInterval(() => {
      setTimerState((prev) => {
        if (prev.remainingSeconds <= 1) {
          return { ...prev, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
  } catch (err) {
    setError('タイマーの開始に失敗しました');
  }
}, [timerState.isRunning, timerState.currentSessionType]);
```

**処理の流れ**:
1. `isRunning` チェック → true なら何もしない
2. `currentTaskIdRef` にタスクIDを保存
3. `timerApi.startSession` で POST → セッションID取得
4. `timerState` を更新: `isRunning: true`, `currentSessionId` 設定
5. `setInterval(1000ms)` で毎秒 `remainingSeconds` を -1

### 2. interval の参照管理

```typescript
// useTimer.ts:29-30
const intervalRef = useRef<number | null>(null);
const currentTaskIdRef = useRef<number | null>(null);
```

- `intervalRef`: `setInterval` の ID を保持（停止時に `clearInterval` で使用）
- `currentTaskIdRef`: 現在のセッションに紐付くタスクID

### 3. クリーンアップ

```typescript
// useTimer.ts:62-68
useEffect(() => {
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);
```

- コンポーネントアンマウント時に interval をクリア（メモリリーク防止）

### 4. APIクライアント: timerApi.startSession

**ファイル**: `frontend/src/api/timerSettings.ts`

```typescript
// timerSettings.ts:62-68
async startSession(sessionType: SessionType, taskId?: number): Promise<TimerSession> {
  const response = await apiClient.post<TimerSessionResponse>('/api/timer-sessions', {
    sessionType,
    taskId,
  });
  return mapTimerSessionResponse(response.data);
},
```

## HTTPリクエスト/レスポンス

### リクエスト

```
POST /api/timer-sessions
Content-Type: application/json

{
  "sessionType": "WORK",
  "taskId": 1              ← optional（null でも可）
}
```

### レスポンス

```
HTTP/1.1 201 Created

{
  "id": 1,
  "taskId": 1,
  "sessionType": "WORK",
  "startedAt": "2025-01-15T10:00:00",
  "completedAt": null,
  "duration": null,
  "completed": false
}
```

## バックエンド トレース

### 1. Controller: TimerController.startSession

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TimerController.java`

```java
// TimerController.java:41-61
@PostMapping("/timer-sessions")
public ResponseEntity<TimerSession> startSession(@RequestBody Map<String, Object> request) {
    String sessionTypeStr = (String) request.get("sessionType");
    if (sessionTypeStr == null) {
        return ResponseEntity.badRequest().build();
    }

    SessionType sessionType;
    try {
        sessionType = SessionType.valueOf(sessionTypeStr);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().build();
    }

    Long taskId = request.get("taskId") != null
            ? ((Number) request.get("taskId")).longValue()
            : null;

    TimerSession session = timerService.startSession(sessionType, taskId);
    return ResponseEntity.status(HttpStatus.CREATED).body(session);
}
```

- `Map<String, Object>` で受取（sessionType は String、taskId は Number）
- sessionType の null チェック + enum 変換の例外処理
- taskId は `Number.longValue()` で安全に変換

### 2. Service: TimerService.startSession

**ファイル**: `backend/src/main/java/com/sonicflow/service/TimerService.java`

```java
// TimerService.java:56-61
public TimerSession startSession(SessionType sessionType, Long taskId) {
    TimerSession session = new TimerSession();
    session.setSessionType(sessionType);
    session.setTaskId(taskId);
    return timerSessionRepository.save(session);
}
```

- 新しい `TimerSession` を生成
- `startedAt` は `@PrePersist` で自動設定

### 3. Entity: TimerSession.@PrePersist

**ファイル**: `backend/src/main/java/com/sonicflow/entity/TimerSession.java`

```java
// TimerSession.java:27-28
@Column(nullable = false)
private Boolean completed = false;

// TimerSession.java:30-33
@PrePersist
protected void onCreate() {
    startedAt = LocalDateTime.now();
}
```

初期状態:
| フィールド | 値 |
|----------|---|
| `id` | 自動採番 |
| `taskId` | 引数の値 or null |
| `sessionType` | WORK / BREAK / LONG_BREAK |
| `startedAt` | `LocalDateTime.now()` |
| `completedAt` | null |
| `duration` | null |
| `completed` | false |

## データ変換テーブル

| レイヤー | sessionType | taskId | startedAt |
|---------|------------|--------|-----------|
| startTimer 引数 | `timerState.currentSessionType` | `taskId?` (optional) | — |
| API リクエスト | `"WORK"` | `1` or `undefined` | — |
| Controller | `SessionType.WORK` | `Long(1)` or `null` | — |
| Entity (save後) | `WORK` | `1L` or `null` | `LocalDateTime.now()` |
| DB INSERT | `'WORK'` | `1` or `NULL` | timestamp |
| API レスポンス | `"WORK"` | `1` or `null` | `"2025-01-15T10:00:00"` |
| mapTimerSessionResponse | `"WORK"` | `1` or `null` | `Date` |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| startTimer | `isRunning === true` | 即座に `return`（API呼出なし） |
| Controller | `sessionType` が null | 400 Bad Request |
| Controller | 不正な sessionType 文字列 | 400 Bad Request |
| useTimer | API例外 | `error` に `'タイマーの開始に失敗しました'` をセット |

## 設計メモ

- **二重起動防止**: `if (timerState.isRunning) return` で既にタイマー動作中なら何もしない。
- **API先行**: `setInterval` 開始前に POST API を呼ぶ。API失敗時にはインターバルが開始されない（不整合防止）。
- **useRef で interval 管理**: `useState` ではなく `useRef` を使うことで、interval ID の変更が再描画をトリガーしない。
- **1秒精度**: `setInterval(1000)` はブラウザの制約により正確に1秒とは限らない。長時間使用するとズレが蓄積する可能性がある。
- **Phase 2 UI未実装**: この関数は `useTimer` の返却値に含まれるが、App.tsx からは呼び出されていない。
