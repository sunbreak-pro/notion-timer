# タスク一覧表示（初回読込）フロー

## 概要

App コンポーネントがマウントされると、`useTasks` フックが未完了タスクと完了済みタスクを並列に fetch する。取得したデータは合算して `tasks` state に格納され、フロントエンドで `incompleteTasks` / `completedTasks` にフィルタリングして表示する。読込中はスピナー、エラー時はエラーメッセージ＋再試行ボタンを表示する。

## シーケンス図

```
Browser        App.tsx       useTasks           tasksApi           TaskController   TaskService     DB
 │               │              │                 │                   │               │              │
 │──マウント─────▶│              │                 │                   │               │              │
 │               │──useTasks()──▶                 │                   │               │              │
 │               │              │──useEffect()───▶│                   │               │              │
 │               │              │  setLoading(true)                   │               │              │
 │               │              │──Promise.all()──▶                   │               │              │
 │               │              │                 │──GET /api/tasks──▶│               │              │
 │               │              │                 │──GET /api/tasks/history──▶        │              │
 │               │              │                 │                   │──getIncompleteTasks()──▶     │
 │               │              │                 │                   │──getCompletedTasks()──▶      │
 │               │              │                 │                   │               │──SELECT×2──▶ │
 │               │              │                 │◀──[Task[],Task[]]─│◀──────────────│◀─────────────│
 │               │              │◀──[incomplete, completed]           │               │              │
 │               │              │  setTasks([...incomplete, ...completed])             │              │
 │               │              │  setLoading(false)                  │               │              │
 │               │◀─再描画──────│                 │                   │               │              │
 │◀──TaskList表示│              │                 │                   │               │              │
```

## フロントエンド トレース

### 1. マウント時の fetch: useTasks.fetchTasks

**ファイル**: `frontend/src/hooks/useTasks.ts`

```typescript
// useTasks.ts:11-30
const fetchTasks = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [incomplete, completed] = await Promise.all([
      tasksApi.getIncompleteTasks(),    // GET /api/tasks
      tasksApi.getCompletedTasks(),      // GET /api/tasks/history
    ]);
    setTasks([...incomplete, ...completed]);
  } catch (err) {
    if (axios.isAxiosError(err) && !err.response) {
      setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
    } else {
      setError('タスクの取得に失敗しました');
    }
  } finally {
    setLoading(false);
  }
}, []);
```

```typescript
// useTasks.ts:32-34
useEffect(() => {
  fetchTasks();
}, [fetchTasks]);
```

- `Promise.all` で2つのAPIを並列実行（パフォーマンス最適化）
- 両方成功後、結合して `tasks` state に格納
- `useCallback` + 空依存配列 `[]` → マウント時に1回だけ実行

### 2. フィルタリング

```typescript
// useTasks.ts:79-80
const incompleteTasks = tasks.filter((t) => t.status === 'TODO');
const completedTasks = tasks.filter((t) => t.status === 'DONE');
```

- `tasks` state が更新されるたびに再計算（derived state）
- `useMemo` は使用していない（タスク数が少ない想定）

### 3. ローディング/エラー表示: App.tsx

**ファイル**: `frontend/src/App.tsx`

```typescript
// App.tsx:38-44 (ローディング)
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-notion-text-secondary" />
    </div>
  );
}

// App.tsx:45-60 (エラー)
if (error) {
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-red-50 ...">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
      <button onClick={refetch}>再試行</button>
    </div>
  );
}
```

- `loading === true` → Loader2 スピナー（lucide-react）
- `error !== null` → 赤背景のエラーメッセージ + 「再試行」ボタン（`refetch = fetchTasks`）

### 4. TaskList への props 渡し

```typescript
// App.tsx:62-74
<TaskList
  incompleteTasks={incompleteTasks}
  completedTasks={completedTasks}
  onAdd={addTask}
  onToggle={toggleTaskStatus}
  onUpdate={(id, title) => updateTask(id, { title })}
  onDelete={deleteTask}
  focusMode={focusMode}
  focusedTaskId={focusedTaskId}
  onFocusTask={handleFocusTask}
  onToggleFocusMode={handleToggleFocusMode}
/>
```

### 5. TaskList の表示構造

**ファイル**: `frontend/src/components/TaskList/TaskList.tsx`

```
TaskList (TaskList.tsx:34-96)
├─ ヘッダー: "Tasks" + Focus Modeボタン (TaskList.tsx:36-49)
├─ 未完了タスクリスト (TaskList.tsx:51-68)
│   ├─ TaskItem × incompleteTasks.length
│   └─ TaskInput (新規追加入力)
└─ 完了済みセクション (TaskList.tsx:70-94) ※completedTasks.length > 0 の場合のみ
    ├─ 折りたたみボタン: "Completed (N)" (TaskList.tsx:72-78)
    └─ TaskItem × completedTasks.length (showCompleted === true の場合)
```

- `showCompleted` (`TaskList.tsx:32`): 完了済みセクションの開閉を制御するローカル state（デフォルト: `true`）
- 完了済みセクションは `border-t` で区切り線を表示

### 6. APIクライアント

**ファイル**: `frontend/src/api/tasks.ts`

```typescript
// tasks.ts:23-31
async getIncompleteTasks(): Promise<Task[]> {
  const response = await apiClient.get<TaskResponse[]>('/api/tasks');
  return response.data.map(mapTaskResponse);
},

async getCompletedTasks(): Promise<Task[]> {
  const response = await apiClient.get<TaskResponse[]>('/api/tasks/history');
  return response.data.map(mapTaskResponse);
},
```

## HTTPリクエスト/レスポンス

### リクエスト 1（並列）

```
GET /api/tasks
```

### レスポンス 1

```
HTTP/1.1 200 OK

[
  { "id": 2, "title": "タスクB", "status": "TODO", "createdAt": "2025-01-15T11:00:00", "completedAt": null },
  { "id": 1, "title": "タスクA", "status": "TODO", "createdAt": "2025-01-15T10:00:00", "completedAt": null }
]
```

### リクエスト 2（並列）

```
GET /api/tasks/history
```

### レスポンス 2

```
HTTP/1.1 200 OK

[
  { "id": 3, "title": "タスクC", "status": "DONE", "createdAt": "2025-01-14T09:00:00", "completedAt": "2025-01-14T12:00:00" }
]
```

## バックエンド トレース

### 1. Controller

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TaskController.java`

```java
// TaskController.java:23-26
@GetMapping
public List<Task> getIncompleteTasks() {
    return taskService.getIncompleteTasks();
}

// TaskController.java:28-31
@GetMapping("/history")
public List<Task> getCompletedTasks() {
    return taskService.getCompletedTasks();
}
```

- `ResponseEntity` ではなく `List<Task>` を直接返却 → Spring が自動的に 200 + JSON 変換

### 2. Service

**ファイル**: `backend/src/main/java/com/sonicflow/service/TaskService.java`

```java
// TaskService.java:22-28
public List<Task> getIncompleteTasks() {
    return taskRepository.findByStatusOrderByCreatedAtDesc(TaskStatus.TODO);
}

public List<Task> getCompletedTasks() {
    return taskRepository.findByStatusOrderByCreatedAtDesc(TaskStatus.DONE);
}
```

### 3. Repository

**ファイル**: `backend/src/main/java/com/sonicflow/repository/TaskRepository.java`

```java
// TaskRepository.java:13
List<Task> findByStatusOrderByCreatedAtDesc(TaskStatus status);
```

- Spring Data JPA のメソッド名クエリ: `findBy{Status}OrderBy{CreatedAt}Desc`
- 生成されるSQL: `SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC`

## データフロー全体

```
DB: tasks テーブル
  │
  ▼ findByStatusOrderByCreatedAtDesc(TODO)  +  findByStatusOrderByCreatedAtDesc(DONE)
Service: List<Task>(未完了)  +  List<Task>(完了済み)
  │
  ▼ Spring JSON自動変換 (Jackson)
Controller: JSON配列 × 2
  │
  ▼ HTTP Response (並列)
API Client: TaskResponse[] × 2
  │
  ▼ mapTaskResponse (string → Date変換)
useTasks: Task[] × 2
  │
  ▼ [...incomplete, ...completed]
tasks state: Task[] (全タスク合算)
  │
  ▼ filter(TODO) / filter(DONE)
TaskList props: incompleteTasks / completedTasks
```

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| useTasks | ネットワーク切断（`!err.response`） | `'サーバーに接続できません...'` |
| useTasks | その他のAPIエラー | `'タスクの取得に失敗しました'` |
| App.tsx | `error !== null` | 赤背景エラーUI + 「再試行」ボタン |
| App.tsx | `loading === true` | スピナー表示 |
| Promise.all | どちらか一方でも失敗 | 全体が失敗扱い → catch ブロック |

## 設計メモ

- **並列fetch**: `Promise.all` で未完了・完了済みを同時取得。逐次実行より高速。ただし片方が失敗すると両方やり直しになる。
- **クライアントサイドフィルタ**: サーバーが既にステータス別に分けて返すが、フロントエンドでも `tasks.filter()` で再フィルタする。これにより、CRUD操作後の楽観的更新でタスクのステータスが変わった場合にも正しく分類される。
- **ソート順**: バックエンドが `OrderByCreatedAtDesc` で新しい順に返却。フロントエンドでの再ソートは行わない。
- **refetch**: `useTasks` が返す `refetch` は `fetchTasks` そのもの。エラーUI の「再試行」ボタンに接続。
