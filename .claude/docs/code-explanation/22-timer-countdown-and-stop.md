# カウントダウンロジック + 停止/完了フロー

## 概要

タイマー開始後、`setInterval` が毎秒 `remainingSeconds` をデクリメントする。0到達時に `stopTimer(true)` が自動呼出され、バックエンドにセッション終了を通知し、次のセッションタイプに自動遷移する。手動停止も可能（`stopTimer(false)`）。セッション遷移ロジックは WORK → BREAK → WORK → ... → LONG_BREAK のポモドーロサイクルに従う。

## シーケンス図（自動完了）

```
setInterval       useEffect         useTimer.stopTimer    timerApi        TimerController   TimerService     DB
 │                   │                  │                   │                │               │              │
 │ remainingSeconds=1│                  │                   │                │               │              │
 │──setState(0)─────▶│                  │                   │                │               │              │
 │                   │ (isRunning && remainingSeconds===0)  │                │               │              │
 │                   │──stopTimer(true)─▶│                  │                │               │              │
 │                   │                  │ clearInterval()   │                │               │              │
 │                   │                  │ duration計算       │                │               │              │
 │                   │                  │──endSession()────▶│                │               │              │
 │                   │                  │                   │──PUT /sessions/{id}──▶         │              │
 │                   │                  │                   │                │──endSession()─▶│             │
 │                   │                  │                   │                │               │──UPDATE──▶   │
 │                   │                  │                   │◀──200+Session──│◀──Session─────│◀─────────────│
 │                   │                  │◀──TimerSession────│               │                │              │
 │                   │                  │                   │                │               │              │
 │                   │                  │ セッション遷移ロジック                               │              │
 │                   │                  │ WORK完了→BREAK or LONG_BREAK                       │              │
 │                   │                  │ setTimerState(次セッション)                          │              │
```

## フロントエンド トレース

### 1. カウントダウンロジック（setInterval 内部）

**ファイル**: `frontend/src/hooks/useTimer.ts`

```typescript
// useTimer.ts:115-122 (startTimer 内で定義)
intervalRef.current = window.setInterval(() => {
  setTimerState((prev) => {
    if (prev.remainingSeconds <= 1) {
      return { ...prev, remainingSeconds: 0 };   // 0以下にしない
    }
    return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
  });
}, 1000);
```

- 毎秒実行
- `remainingSeconds <= 1` で 0 にフロア（負の値防止）

### 2. 0到達の検出: useEffect

```typescript
// useTimer.ts:175-179
useEffect(() => {
  if (timerState.isRunning && timerState.remainingSeconds === 0) {
    stopTimer(true);    // completed = true で自動停止
  }
}, [timerState.isRunning, timerState.remainingSeconds, stopTimer]);
```

- `remainingSeconds` が 0 になるたびに発火
- `isRunning` チェックで停止済みなら無視

### 3. stopTimer 関数

```typescript
// useTimer.ts:129-173
const stopTimer = useCallback(async (completed: boolean = false) => {
  if (!timerState.isRunning || !timerState.currentSessionId) return;

  // 1. interval 停止
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  try {
    setError(null);
    // 2. 経過時間を計算
    const duration = getDurationForSessionType(timerState.currentSessionType) * 60
                     - timerState.remainingSeconds;

    // 3. API呼出: セッション終了
    const session = await timerApi.endSession(timerState.currentSessionId, {
      duration,
      completed,
    });

    // 4. セッション履歴に追加
    setSessions((prev) => [session, ...prev]);

    // 5. セッション遷移ロジック
    let nextSessionType: SessionType = timerState.currentSessionType;
    let completedSessions = timerState.completedSessions;

    if (completed && timerState.currentSessionType === 'WORK') {
      completedSessions += 1;
      if (completedSessions >= settings.sessionsBeforeLongBreak) {
        nextSessionType = 'LONG_BREAK';
        completedSessions = 0;             // リセット
      } else {
        nextSessionType = 'BREAK';
      }
    } else if (completed && (timerState.currentSessionType === 'BREAK'
                          || timerState.currentSessionType === 'LONG_BREAK')) {
      nextSessionType = 'WORK';
    }

    // 6. state リセット
    setTimerState({
      isRunning: false,
      currentSessionType: nextSessionType,
      remainingSeconds: getDurationForSessionType(nextSessionType) * 60,
      completedSessions,
      currentSessionId: null,
    });
  } catch (err) {
    setError('タイマーの停止に失敗しました');
  }
}, [timerState, settings.sessionsBeforeLongBreak]);
```

### 4. セッション遷移ロジック詳細

**sessionsBeforeLongBreak = 4 の場合**:

```
セッション1: WORK → (完了) → completedSessions=1 → BREAK
           BREAK → (完了) → WORK

セッション2: WORK → (完了) → completedSessions=2 → BREAK
           BREAK → (完了) → WORK

セッション3: WORK → (完了) → completedSessions=3 → BREAK
           BREAK → (完了) → WORK

セッション4: WORK → (完了) → completedSessions=4 ≥ 4 → LONG_BREAK (completedSessions=0にリセット)
           LONG_BREAK → (完了) → WORK

セッション5: WORK → (完了) → completedSessions=1 → BREAK
           ...（繰り返し）
```

**遷移テーブル**:

| 現在のセッション | completed | completedSessions | 次のセッション | completedSessions更新 |
|---------------|-----------|-------------------|-------------|---------------------|
| WORK | true | < sessionsBeforeLongBreak | BREAK | +1 |
| WORK | true | >= sessionsBeforeLongBreak | LONG_BREAK | 0にリセット |
| WORK | false | — | WORK（変更なし） | 変更なし |
| BREAK | true | — | WORK | 変更なし |
| BREAK | false | — | BREAK（変更なし） | 変更なし |
| LONG_BREAK | true | — | WORK | 変更なし |
| LONG_BREAK | false | — | LONG_BREAK（変更なし） | 変更なし |

### 5. 手動リセット: resetTimer

```typescript
// useTimer.ts:181-189
const resetTimer = useCallback(() => {
  if (timerState.isRunning) {
    stopTimer(false);       // completed = false で停止
  }
  setTimerState((prev) => ({
    ...prev,
    remainingSeconds: getDurationForSessionType(prev.currentSessionType) * 60,
  }));
}, [timerState.isRunning, stopTimer]);
```

- 動作中なら `stopTimer(false)` で中断
- `remainingSeconds` を現在のセッションタイプの duration にリセット

### 6. セッションタイプ手動切替: switchSessionType

```typescript
// useTimer.ts:191-198
const switchSessionType = useCallback((type: SessionType) => {
  if (timerState.isRunning) return;    // 動作中は切替不可
  setTimerState((prev) => ({
    ...prev,
    currentSessionType: type,
    remainingSeconds: getDurationForSessionType(type) * 60,
  }));
}, [timerState.isRunning]);
```

### 7. APIクライアント: timerApi.endSession

**ファイル**: `frontend/src/api/timerSettings.ts`

```typescript
// timerSettings.ts:70-76
async endSession(id: number, data: { duration: number; completed: boolean }): Promise<TimerSession> {
  const response = await apiClient.put<TimerSessionResponse>(`/api/timer-sessions/${id}`, data);
  return mapTimerSessionResponse(response.data);
},
```

## HTTPリクエスト/レスポンス

### リクエスト（セッション終了）

```
PUT /api/timer-sessions/1
Content-Type: application/json

{
  "duration": 1500,     ← 経過秒数
  "completed": true     ← 完了 or 中断
}
```

### レスポンス

```
HTTP/1.1 200 OK

{
  "id": 1,
  "taskId": 1,
  "sessionType": "WORK",
  "startedAt": "2025-01-15T10:00:00",
  "completedAt": "2025-01-15T10:25:00",    ← 自動設定
  "duration": 1500,
  "completed": true
}
```

## バックエンド トレース

### 1. Controller: TimerController.endSession

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TimerController.java`

```java
// TimerController.java:63-78
@PutMapping("/timer-sessions/{id}")
public ResponseEntity<TimerSession> endSession(@PathVariable Long id, @RequestBody Map<String, Object> request) {
    try {
        Integer duration = request.get("duration") != null
                ? ((Number) request.get("duration")).intValue() : null;
        Boolean completed = (Boolean) request.get("completed");
        TimerSession session = timerService.endSession(id, duration, completed);
        return ResponseEntity.ok(session);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.notFound().build();
    }
}
```

### 2. Service: TimerService.endSession

**ファイル**: `backend/src/main/java/com/sonicflow/service/TimerService.java`

```java
// TimerService.java:63-72
public TimerSession endSession(Long id, Integer duration, Boolean completed) {
    TimerSession session = timerSessionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));

    session.setCompletedAt(LocalDateTime.now());        // 完了時刻を自動設定
    session.setDuration(duration);
    session.setCompleted(completed != null ? completed : false);

    return timerSessionRepository.save(session);
}
```

- `completedAt` はバックエンドで `LocalDateTime.now()` を設定（フロントエンド依存しない）
- `completed` が null の場合は `false` にフォールバック

## duration の計算

```
duration = (セッションの設定時間 × 60) - remainingSeconds

例: workDuration=25分、残り0秒の場合
  duration = 25 * 60 - 0 = 1500秒

例: workDuration=25分、手動停止で残り600秒の場合
  duration = 25 * 60 - 600 = 900秒（15分で中断）
```

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| stopTimer | `!isRunning \|\| !currentSessionId` | 即座に return |
| Controller | session ID 不存在 | 404 Not Found |
| Service | session 未発見 | `IllegalArgumentException` |
| useTimer | API例外 | `error` に `'タイマーの停止に失敗しました'` をセット |

## 設計メモ

- **clearInterval は API 前**: interval 停止を API 呼出より先に行う。API 失敗しても余計なカウントダウンが走らない。
- **duration はフロントエンド計算**: バックエンドの `startedAt` と `completedAt` の差分ではなく、フロントエンドの `remainingSeconds` から算出。setInterval の精度誤差が含まれる可能性。
- **セッション遷移はフロントエンド責務**: バックエンドは「セッション開始」「セッション終了」のみ管理。WORK → BREAK の遷移ロジックはフロントエンドの `stopTimer` 内で完結。
- **completedSessions は非永続**: `timerState.completedSessions` はリロードで0にリセットされる。長期的なポモドーロ回数追跡は DB の sessions テーブルから再計算が必要。
- **formatTime ヘルパー**: `useTimer.ts:209-213` で `seconds → "MM:SS"` 変換関数を提供。UI表示用。
