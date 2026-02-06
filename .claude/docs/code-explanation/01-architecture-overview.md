# アーキテクチャ全体図

## 概要

Sonic Flow は React フロントエンド + Spring Boot バックエンドのフルスタックアプリケーション。ブラウザ上の React アプリが Axios 経由で REST API を呼び出し、Spring Boot が H2 Database にデータを永続化する。

## フルスタック構成図

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (localhost:5173)                                    │
│                                                             │
│  main.tsx                                                   │
│    └─ App.tsx (中央オーケストレーター)                         │
│        ├─ State: activeSection, focusMode, focusedTaskId    │
│        ├─ useTasks() → tasksApi → apiClient                │
│        ├─ useTimer() → timerApi → apiClient   (未接続)      │
│        ├─ useSoundSettings() → soundApi → apiClient (未接続)│
│        └─ Layout                                            │
│            ├─ Sidebar (ナビゲーション)                       │
│            └─ MainContent                                   │
│                └─ TaskList / プレースホルダー                 │
│                                                             │
│  apiClient (Axios)                                          │
│    baseURL: http://localhost:8080                            │
│    Content-Type: application/json                           │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP (JSON)
                  │ CORS: localhost:5173 → localhost:8080
┌─────────────────▼───────────────────────────────────────────┐
│ Spring Boot (localhost:8080)                                │
│                                                             │
│  WebConfig (CORS設定)                                       │
│    └─ /api/** を localhost:5173 に許可                       │
│                                                             │
│  Controllers (REST受口)                                     │
│    ├─ TaskController    /api/tasks/**                       │
│    ├─ TimerController   /api/timer-settings, timer-sessions │
│    └─ SoundController   /api/sound-settings, sound-presets  │
│         │                                                   │
│  Services (ビジネスロジック)                                  │
│    ├─ TaskService   (@Transactional)                        │
│    ├─ TimerService  (@Transactional)                        │
│    └─ SoundService  (@Transactional)                        │
│         │                                                   │
│  Repositories (JPA)                                         │
│    ├─ TaskRepository                                        │
│    ├─ TimerSettingsRepository                               │
│    ├─ TimerSessionRepository                                │
│    ├─ SoundSettingsRepository                               │
│    └─ SoundPresetRepository                                 │
│         │                                                   │
│  Entities                                                   │
│    ├─ Task (tasks)                                          │
│    ├─ TimerSettings (timer_settings)                        │
│    ├─ TimerSession (timer_sessions)                         │
│    ├─ SoundSettings (sound_settings)                        │
│    └─ SoundPreset (sound_presets)                           │
│                                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │ JDBC
┌─────────────────▼───────────────────────────────────────────┐
│ H2 Database (file: ./data/sonicflow)                        │
│  ddl-auto: update (スキーマ自動生成)                          │
│  テーブル: tasks, timer_settings, timer_sessions,            │
│           sound_settings, sound_presets                      │
└─────────────────────────────────────────────────────────────┘
```

## フロントエンド層の構造

### エントリポイントチェーン

```
main.tsx:6  createRoot(#root).render(<StrictMode><App/></StrictMode>)
  └─ App.tsx:7  function App()
       ├─ State 管理 (App.tsx:8-10)
       │   ├─ activeSection: "tasks" | "sounds" | "timer" | "settings"
       │   ├─ focusMode: boolean
       │   └─ focusedTaskId: number | null
       ├─ Hook 接続 (App.tsx:12-22)
       │   └─ useTasks() → { incompleteTasks, completedTasks, loading, error, addTask, ... }
       ├─ セクション切替 (App.tsx:35-101)
       │   └─ switch(activeSection) → TaskList | プレースホルダー
       └─ レイアウト (App.tsx:103-107)
           └─ <Layout> → <Sidebar> + <MainContent>
```

### コンポーネント階層

```
App
├─ Layout (Layout.tsx)
│   ├─ Sidebar (Sidebar.tsx)
│   │   └─ menuItems: tasks, sounds, timer, settings
│   └─ MainContent (MainContent.tsx)
│       └─ {children} → renderContent() の結果
│
└─ renderContent()
    ├─ "tasks" → TaskList (TaskList.tsx)
    │               ├─ TaskItem × N (TaskItem.tsx)
    │               └─ TaskInput (TaskInput.tsx)
    ├─ "sounds" → プレースホルダー
    ├─ "timer" → プレースホルダー
    └─ "settings" → プレースホルダー
```

## 状態管理パターン

### App.tsx のローカル State

| State | 型 | 用途 | 永続化 |
|-------|---|------|--------|
| `activeSection` | `string` | サイドバーの選択セクション | なし |
| `focusMode` | `boolean` | フォーカスモードのON/OFF | なし |
| `focusedTaskId` | `number \| null` | フォーカス中のタスクID | なし |

### カスタムフック

| Hook | ファイル | 管理するデータ | API接続 |
|------|---------|---------------|---------|
| `useTasks` | `hooks/useTasks.ts` | tasks[], loading, error | `tasksApi` |
| `useTimer` | `hooks/useTimer.ts` | settings, sessions[], timerState | `timerApi` |
| `useSoundSettings` | `hooks/useSoundSettings.ts` | settings[], presets[] | `soundApi` |

各フックは同一のパターンに従う:
1. `useState` でローカルステート管理
2. `useEffect` でマウント時にデータfetch
3. `useCallback` でCRUD操作を定義
4. API成功後にローカルstateを直接更新（re-fetchしない = 楽観的更新）

## APIクライアント層

```
api/client.ts       共有Axiosインスタンス (baseURL: http://localhost:8080)
  ├─ api/tasks.ts         tasksApi.{getIncompleteTasks, getCompletedTasks, createTask, updateTask, deleteTask}
  ├─ api/timerSettings.ts timerApi.{getSettings, updateSettings, startSession, endSession, getAllSessions, getSessionsByTask}
  └─ api/soundSettings.ts soundApi.{getAllSettings, updateSettings, getAllPresets, createPreset, deletePreset}
```

共通パターン: 各APIモジュールは `XxxResponse` インターフェース + `mapXxxResponse()` 関数で、JSONの日付文字列を `Date` オブジェクトに変換する。

## バックエンド層

### レイヤー構成

```
Controller (REST受口、Map<String,Object>で受取)
    │  バリデーション、HTTPステータス制御
    ▼
Service (@Transactional、ビジネスロジック)
    │  completedAt自動管理、Upsert、シングルトン管理
    ▼
Repository (JpaRepository拡張、カスタムクエリメソッド)
    │  Spring Data JPAが実装を自動生成
    ▼
Entity (@Entity、@PrePersist/@PreUpdateでタイムスタンプ管理)
    │
    ▼
H2 Database (file: ./data/sonicflow)
```

### 注目すべきパターン

1. **DTOなし**: Controller は `Map<String, Object>` / `Map<String, String>` で受け取り、型付きDTOクラスを使わない
2. **@PrePersist**: Entity の `createdAt` / `startedAt` は初回保存時に自動設定
3. **@PreUpdate**: `updatedAt` は更新時に自動設定（TimerSettings, SoundSettings）
4. **コンストラクタインジェクション**: 全Service/ControllerでDI

## エラーハンドリングパターン

### フロントエンド

```
try {
  const result = await api.someMethod();
  setLocalState(result);      // 楽観的更新
} catch (err) {
  if (axios.isAxiosError(err) && !err.response) {
    setError('サーバーに接続できません...');  // ネットワークエラー
  } else {
    setError('操作に失敗しました');            // その他エラー
  }
}
```

### バックエンド

```java
// Controller層
try {
    Task task = taskService.updateTask(id, title, status);
    return ResponseEntity.ok(task);
} catch (IllegalArgumentException e) {
    return ResponseEntity.notFound().build();   // 404
}

// Service層
Task task = taskRepository.findById(id)
    .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));
```
