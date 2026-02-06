# セッション履歴表示フロー

## 概要

タイマーセッションの履歴は2つの方法で取得できる: (1) 全セッション一覧（`useTimer` マウント時に自動取得）、(2) 特定タスクに紐づくセッション一覧（`getSessionsByTask` で任意タイミング取得）。いずれもバックエンドから降順（新しい順）で返却される。

## シーケンス図（全セッション取得 — マウント時）

```
useTimer             timerApi           TimerController    TimerService     TimerSessionRepo     DB
 │                     │                   │                 │                │                  │
 │──fetchData()───────▶│                   │                 │                │                  │
 │  (Promise.all内)     │                   │                 │                │                  │
 │──getAllSessions()───▶│                   │                 │                │                  │
 │                     │──GET /timer-sessions──▶             │                │                  │
 │                     │                   │──getAllSessions()─▶              │                  │
 │                     │                   │                 │──findAllByOrderByStartedAtDesc()──▶
 │                     │                   │                 │                │──SELECT──▶       │
 │                     │                   │◀──[Session[]]───│◀──────────────│◀─────────────────│
 │                     │◀──[TimerSession[]]│                 │                │                  │
 │◀──TimerSession[]────│                   │                 │                │                  │
 │  setSessions(data)  │                   │                 │                │                  │
```

## シーケンス図（タスク別セッション取得）

```
(将来のUI)      useTimer             timerApi           TimerController    TimerService       DB
 │               │                     │                   │                 │                 │
 │──getSessionsByTask(taskId)──▶       │                   │                 │                 │
 │               │──getSessionsByTask()▶│                  │                 │                 │
 │               │                     │──GET /tasks/{id}/sessions──▶       │                 │
 │               │                     │                   │──getSessionsByTaskId()──▶        │
 │               │                     │                   │                 │──SELECT─▶      │
 │               │                     │◀──[Session[]]─────│◀──[Session[]]──│◀────────────────│
 │               │◀──TimerSession[]────│                   │                 │                 │
 │◀──TimerSession[]                    │                   │                 │                 │
```

## フロントエンド トレース

### 1. 全セッション取得（マウント時）

**ファイル**: `frontend/src/hooks/useTimer.ts`

`fetchData` 内で `timerApi.getAllSessions()` が呼ばれる（`timerApi.getSettings()` と並列）。

```typescript
// useTimer.ts:36-41 (fetchData内)
const [settingsData, sessionsData] = await Promise.all([
  timerApi.getSettings(),
  timerApi.getAllSessions(),       // ← 全セッション取得
]);
setSettings(settingsData);
setSessions(sessionsData);        // ← sessions state に格納
```

- `sessions` state (`useTimer.ts:17`): `TimerSession[]`
- マウント時1回のみ自動取得

### 2. セッション終了時の追加

`stopTimer` 内で、終了したセッションを先頭に追加。

```typescript
// useTimer.ts:145 (stopTimer内)
setSessions((prev) => [session, ...prev]);
```

- re-fetch せず、楽観的に先頭追加

### 3. タスク別セッション取得

```typescript
// useTimer.ts:200-207
const getSessionsByTask = useCallback(async (taskId: number) => {
  try {
    return await timerApi.getSessionsByTask(taskId);
  } catch (err) {
    console.error('Failed to fetch sessions by task:', err);
    return [];    // エラー時は空配列
  }
}, []);
```

- 戻り値を直接返す（state に格納しない）
- 呼び出し元が結果を受け取って使用する想定
- エラー時は `error` state にセットせず空配列を返す（非侵襲的）

### 4. APIクライアント

**ファイル**: `frontend/src/api/timerSettings.ts`

```typescript
// timerSettings.ts:78-81 (全セッション)
async getAllSessions(): Promise<TimerSession[]> {
  const response = await apiClient.get<TimerSessionResponse[]>('/api/timer-sessions');
  return response.data.map(mapTimerSessionResponse);
},

// timerSettings.ts:83-87 (タスク別)
async getSessionsByTask(taskId: number): Promise<TimerSession[]> {
  const response = await apiClient.get<TimerSessionResponse[]>(`/api/tasks/${taskId}/sessions`);
  return response.data.map(mapTimerSessionResponse);
},
```

## HTTPリクエスト/レスポンス

### 全セッション取得

```
GET /api/timer-sessions

→ 200 OK
[
  {
    "id": 3,
    "taskId": 1,
    "sessionType": "BREAK",
    "startedAt": "2025-01-15T10:25:00",
    "completedAt": "2025-01-15T10:30:00",
    "duration": 300,
    "completed": true
  },
  {
    "id": 2,
    "taskId": 1,
    "sessionType": "WORK",
    "startedAt": "2025-01-15T10:00:00",
    "completedAt": "2025-01-15T10:25:00",
    "duration": 1500,
    "completed": true
  }
]
```

### タスク別セッション取得

```
GET /api/tasks/1/sessions

→ 200 OK
[
  ... (同形式、taskId=1 のセッションのみ)
]
```

## バックエンド トレース

### 1. Controller

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TimerController.java`

```java
// TimerController.java:80-83
@GetMapping("/timer-sessions")
public List<TimerSession> getAllSessions() {
    return timerService.getAllSessions();
}

// TimerController.java:85-88
@GetMapping("/tasks/{taskId}/sessions")
public List<TimerSession> getSessionsByTask(@PathVariable Long taskId) {
    return timerService.getSessionsByTaskId(taskId);
}
```

- 注: タスク別セッションは `/api/tasks/{taskId}/sessions` であり、`/api/timer-sessions` 配下ではない（RESTful なリソースネスト）

### 2. Service

**ファイル**: `backend/src/main/java/com/sonicflow/service/TimerService.java`

```java
// TimerService.java:74-80
public List<TimerSession> getAllSessions() {
    return timerSessionRepository.findAllByOrderByStartedAtDesc();
}

public List<TimerSession> getSessionsByTaskId(Long taskId) {
    return timerSessionRepository.findByTaskIdOrderByStartedAtDesc(taskId);
}
```

### 3. Repository

**ファイル**: `backend/src/main/java/com/sonicflow/repository/TimerSessionRepository.java`

```java
// TimerSessionRepository.java:12-14
List<TimerSession> findAllByOrderByStartedAtDesc();
List<TimerSession> findByTaskIdOrderByStartedAtDesc(Long taskId);
```

- Spring Data JPA メソッド名クエリ
- `OrderByStartedAtDesc`: 新しい順（最新セッションが先頭）

## データ変換テーブル

| レイヤー | startedAt | completedAt | duration |
|---------|-----------|-------------|----------|
| DB | `TIMESTAMP` | `TIMESTAMP` or `NULL` | `INT` or `NULL` |
| Entity | `LocalDateTime` | `LocalDateTime` or `null` | `Integer` or `null` |
| JSON | `"2025-01-15T10:00:00"` | `"..."` or `null` | `1500` or `null` |
| mapTimerSessionResponse | `Date` | `Date` or `null` | `number` or `null` |
| useTimer sessions | `Date` | `Date \| null` | `number \| null` |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| fetchData | API失敗 | `error` state にメッセージセット |
| getSessionsByTask | API失敗 | `console.error` + 空配列返却（error state 非設定） |

## 設計メモ

- **2つの取得パターン**: 全セッション = state 管理 + 自動fetch、タスク別 = オンデマンド取得 + 戻り値返却。異なる設計判断。
- **URL設計**: タスク別セッションが `/api/tasks/{id}/sessions` にマッピングされている点が特徴的。Timer と Task の2つのドメインが交差するポイント。
- **ページング未対応**: セッション数が増えても全件取得。大量のセッション履歴がある場合のパフォーマンス課題。
- **ソート保証**: バックエンドで `OrderByStartedAtDesc` を保証。フロントエンドでの再ソートは不要。
