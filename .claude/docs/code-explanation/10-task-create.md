# タスク作成フロー

## 概要

ユーザーが TaskInput に新しいタスクのタイトルを入力し Enter を押すと、フロントエンドが POST リクエストを送信し、バックエンドが Task エンティティを作成して DB に保存する。フロントエンドは API レスポンスを受け取り、ローカルの tasks 配列の先頭に追加する（楽観的更新）。

## シーケンス図

```
User          TaskInput        TaskList       App.tsx       useTasks        tasksApi        TaskController    TaskService     TaskRepository    DB
 │               │               │              │              │               │                │                │               │              │
 │ タイトル入力   │               │              │              │               │                │                │               │              │
 │──Enter押下──▶│               │              │              │               │                │                │               │              │
 │               │handleSubmit() │              │              │               │                │                │               │              │
 │               │──onAdd(title)─▶             │              │               │                │                │               │              │
 │               │               │──onAdd(title)─▶            │               │                │                │               │              │
 │               │               │              │──addTask()──▶│               │                │                │               │              │
 │               │               │              │              │──createTask()─▶│               │                │               │              │
 │               │               │              │              │               │──POST /api/tasks─▶              │               │              │
 │               │               │              │              │               │                │──createTask()──▶│              │              │
 │               │               │              │              │               │                │                │──save(task)───▶│             │
 │               │               │              │              │               │                │                │               │──INSERT──▶   │
 │               │               │              │              │               │                │                │◀──Task────────│◀────────────│
 │               │               │              │              │               │◀──201 + Task───│◀───Task────────│               │              │
 │               │               │              │              │◀──Task─────────│               │                │               │              │
 │               │               │              │◀─setTasks()──│               │                │                │               │              │
 │               │               │◀──再描画──────│              │               │                │                │               │              │
 │◀──新タスク表示─│               │              │              │               │                │                │               │              │
```

## フロントエンド トレース

### 1. UIトリガー: TaskInput コンポーネント

**ファイル**: `frontend/src/components/TaskList/TaskInput.tsx`

ユーザーが `<input>` にテキストを入力し Enter を押す。

- `TaskInput.tsx:10` — `value` state で入力値を管理
- `TaskInput.tsx:20-24` — `handleKeyDown`: Enter キー検出 → `handleSubmit()` を呼出
- `TaskInput.tsx:12-18` — `handleSubmit`: 空白トリム → 空でなければ `onAdd(trimmed)` → 入力欄クリア

```typescript
// TaskInput.tsx:12-18
const handleSubmit = () => {
  const trimmed = value.trim();
  if (trimmed) {
    onAdd(trimmed);
    setValue('');
  }
};
```

### 2. コンポーネントチェーン: TaskList → App.tsx

- `TaskList.tsx:67` — `<TaskInput onAdd={onAdd} />`
- `TaskList.tsx:10` — `onAdd` は props の `(title: string) => void`
- `App.tsx:65` — `<TaskList ... onAdd={addTask} ...>` で `useTasks` の `addTask` を渡す

### 3. フックロジック: useTasks.addTask

**ファイル**: `frontend/src/hooks/useTasks.ts`

```typescript
// useTasks.ts:36-45
const addTask = useCallback(async (title: string) => {
  try {
    setError(null);
    const newTask = await tasksApi.createTask(title);
    setTasks((prev) => [newTask, ...prev]);     // 先頭に追加
  } catch (err) {
    setError('タスクの作成に失敗しました');
    console.error('Failed to create task:', err);
  }
}, []);
```

- エラーステートをクリア
- API呼出 → 成功後、返却された Task を配列の先頭に追加（楽観的更新）
- 失敗時: エラーメッセージを `error` state にセット

### 4. APIクライアント: tasksApi.createTask

**ファイル**: `frontend/src/api/tasks.ts`

```typescript
// tasks.ts:33-36
async createTask(title: string): Promise<Task> {
  const response = await apiClient.post<TaskResponse>('/api/tasks', { title });
  return mapTaskResponse(response.data);
}
```

- `POST /api/tasks` に `{ title }` を送信
- レスポンスの `createdAt` (string) を `Date` に変換して返却

## HTTPリクエスト/レスポンス

### リクエスト

```
POST /api/tasks
Content-Type: application/json

{
  "title": "新しいタスクのタイトル"
}
```

### レスポンス（成功時）

```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "title": "新しいタスクのタイトル",
  "status": "TODO",
  "createdAt": "2025-01-15T10:30:00",
  "completedAt": null
}
```

### レスポンス（バリデーション失敗時）

```
HTTP/1.1 400 Bad Request
```

（title が null または空白の場合）

## バックエンド トレース

### 1. Controller: TaskController.createTask

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TaskController.java`

```java
// TaskController.java:33-41
@PostMapping
public ResponseEntity<Task> createTask(@RequestBody Map<String, String> request) {
    String title = request.get("title");
    if (title == null || title.isBlank()) {
        return ResponseEntity.badRequest().build();
    }
    Task task = taskService.createTask(title);
    return ResponseEntity.status(HttpStatus.CREATED).body(task);
}
```

- `Map<String, String>` で JSON を受取（DTOなし）
- title の null/空白チェック → 400
- 正常時は 201 Created + Task エンティティを返却

### 2. Service: TaskService.createTask

**ファイル**: `backend/src/main/java/com/sonicflow/service/TaskService.java`

```java
// TaskService.java:30-35
public Task createTask(String title) {
    Task task = new Task();
    task.setTitle(title);
    task.setStatus(TaskStatus.TODO);
    return taskRepository.save(task);
}
```

- 新しい Task エンティティを生成
- status を `TODO` に設定
- `save()` で永続化（`createdAt` は `@PrePersist` で自動設定）

### 3. Entity: Task.@PrePersist

**ファイル**: `backend/src/main/java/com/sonicflow/entity/Task.java`

```java
// Task.java:26-29
@PrePersist
protected void onCreate() {
    createdAt = LocalDateTime.now();
}
```

- JPA の `@PrePersist` により、`save()` 呼出時に `createdAt` が自動設定される
- `completedAt` は null のまま

### 4. Repository: TaskRepository

**ファイル**: `backend/src/main/java/com/sonicflow/repository/TaskRepository.java`

```java
// TaskRepository.java:11
public interface TaskRepository extends JpaRepository<Task, Long> { ... }
```

- `save()` は `JpaRepository` の組込みメソッド
- H2 の `IDENTITY` 戦略で `id` が自動採番

## データ変換テーブル

| レイヤー | id | title | status | createdAt | completedAt |
|---------|-----|-------|--------|-----------|-------------|
| TaskInput | — | `string` (入力値) | — | — | — |
| useTasks.addTask 引数 | — | `string` | — | — | — |
| tasksApi リクエストbody | — | `string` | — | — | — |
| Controller 受取 | — | `String` (Map) | — | — | — |
| Service 内 Entity | null→自動採番 | `String` | `TODO` | null→@PrePersist | null |
| DB INSERT | auto_increment | varchar | 'TODO' | timestamp | null |
| Controller レスポンス | `Long` | `String` | `"TODO"` | ISO文字列 | `null` |
| tasksApi 返却 | `number` | `string` | `"TODO"` | `Date` | `undefined` |
| useTasks state | `number` | `string` | `"TODO"` | `Date` | `undefined` |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| TaskInput | 空文字入力 | `handleSubmit` が何もしない（API呼出なし） |
| Controller | title が null/空白 | 400 Bad Request |
| useTasks | API例外 | `error` state に `'タスクの作成に失敗しました'` をセット |
| useTasks | ネットワーク切断 | Axios がエラーを投げ → catch ブロックで処理 |

## 設計メモ

- **楽観的追加**: `setTasks((prev) => [newTask, ...prev])` で配列の先頭に追加。re-fetch しないため即座にUIに反映される。
- **DTOなし**: Controller が `Map<String, String>` で受け取るため、フロントエンドは任意のキーを送信可能。型安全性はフロントエンドの TypeScript 型定義に依存。
- **入力値クリア**: `setValue('')` は `onAdd` 呼出直後に実行される（API完了を待たない）。ユーザーは即座に次のタスクを入力可能。
