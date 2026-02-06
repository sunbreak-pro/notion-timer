# タスクタイトル編集フロー

## 概要

ユーザーがタスクのタイトルテキストをクリックするとインライン編集モードに切り替わる。編集後に Enter またはフォーカスアウトで保存が実行され、PUT リクエストでバックエンドのタイトルが更新される。Escape で編集キャンセル。

## シーケンス図

```
User          TaskItem          TaskList        App.tsx        useTasks        tasksApi         TaskController   TaskService     DB
 │               │                │               │              │               │                │               │              │
 │ タイトルクリック│               │               │              │               │                │               │              │
 │──────────────▶│               │               │              │               │                │               │              │
 │               │setIsEditing(true)             │              │               │                │               │              │
 │               │(input表示)     │               │              │               │                │               │              │
 │ 編集+Enter    │               │               │              │               │                │               │              │
 │──────────────▶│               │               │              │               │                │               │              │
 │               │handleSave()   │               │              │               │                │               │              │
 │               │──onUpdate(id,title)──▶         │              │               │                │               │              │
 │               │               │──onUpdate(id,title)──▶       │               │                │               │              │
 │               │               │               │──updateTask(id,{title})──▶    │               │               │              │
 │               │               │               │              │──updateTask()──▶               │               │              │
 │               │               │               │              │               │──PUT /api/tasks/{id}──▶        │              │
 │               │               │               │              │               │                │──updateTask()─▶│             │
 │               │               │               │              │               │                │               │──UPDATE──▶   │
 │               │               │               │              │               │◀──200 + Task───│◀──Task────────│◀─────────────│
 │               │               │               │              │◀──Task─────────│               │               │              │
 │               │               │               │◀─setTasks()──│               │               │                │              │
 │◀──更新済表示──│◀──再描画───────│◀──────────────│              │               │                │               │              │
```

## フロントエンド トレース

### 1. UIトリガー: TaskItem の <span> クリック

**ファイル**: `frontend/src/components/TaskList/TaskItem.tsx`

- `TaskItem.tsx:78` — `<span onClick={() => setIsEditing(true)}>`
- クリックで `isEditing` state が `true` になり、テキスト表示が `<input>` に切り替わる

### 2. 編集モード

```typescript
// TaskItem.tsx:16-17
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(task.title);
```

- `TaskItem.tsx:20-25` — `useEffect`: `isEditing` が true になると input にフォーカス + 全選択
- `TaskItem.tsx:66-75` — 編集中は `<input>` を表示（`border-b border-notion-accent` でアンダーライン）

### 3. 保存ロジック: handleSave

```typescript
// TaskItem.tsx:27-35
const handleSave = () => {
  const trimmed = editValue.trim();
  if (trimmed && trimmed !== task.title) {
    onUpdate(task.id, trimmed);     // 変更がある場合のみAPI呼出
  } else {
    setEditValue(task.title);       // 変更なし → 元に戻す
  }
  setIsEditing(false);
};
```

**トリガー**:
- `TaskItem.tsx:38-39` — Enter キー → `handleSave()`
- `TaskItem.tsx:72` — `onBlur` → `handleSave()`

**キャンセル**:
- `TaskItem.tsx:41-44` — Escape キー → `setEditValue(task.title)` + `setIsEditing(false)`

### 4. コンポーネントチェーン

- `TaskList.tsx:60` — `<TaskItem onUpdate={(id, title) => onUpdate(id, title)} />`
- `App.tsx:67` — `onUpdate={(id, title) => updateTask(id, { title })}` — title のみの更新に変換

### 5. フックロジック: useTasks.updateTask

**ファイル**: `frontend/src/hooks/useTasks.ts`

```typescript
// useTasks.ts:47-58
const updateTask = useCallback(async (id: number, updates: Partial<Pick<Task, 'title' | 'status'>>) => {
  try {
    setError(null);
    const updatedTask = await tasksApi.updateTask(id, updates);
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? updatedTask : task))
    );
  } catch (err) {
    setError('タスクの更新に失敗しました');
  }
}, []);
```

- API呼出 → 成功後、tasks 配列内の該当タスクをレスポンスで置換

### 6. APIクライアント: tasksApi.updateTask

**ファイル**: `frontend/src/api/tasks.ts`

```typescript
// tasks.ts:38-41
async updateTask(id: number, updates: { title?: string; status?: TaskStatus }): Promise<Task> {
  const response = await apiClient.put<TaskResponse>(`/api/tasks/${id}`, updates);
  return mapTaskResponse(response.data);
}
```

## HTTPリクエスト/レスポンス

### リクエスト

```
PUT /api/tasks/1
Content-Type: application/json

{
  "title": "更新されたタイトル"
}
```

### レスポンス

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "更新されたタイトル",
  "status": "TODO",
  "createdAt": "2025-01-15T10:30:00",
  "completedAt": null
}
```

## バックエンド トレース

### 1. Controller: TaskController.updateTask

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TaskController.java`

```java
// TaskController.java:43-58
@PutMapping("/{id}")
public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Map<String, String> request) {
    try {
        String title = request.get("title");
        TaskStatus status = null;
        if (request.containsKey("status")) {
            status = TaskStatus.valueOf(request.get("status"));
        }
        Task task = taskService.updateTask(id, title, status);
        return ResponseEntity.ok(task);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.notFound().build();
    }
}
```

- title と status を Map から取得（タイトル編集時は status が null）
- `taskService.updateTask` に両方渡す

### 2. Service: TaskService.updateTask（title部分）

**ファイル**: `backend/src/main/java/com/sonicflow/service/TaskService.java`

```java
// TaskService.java:37-57
public Task updateTask(Long id, String title, TaskStatus status) {
    Task task = taskRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));

    if (title != null) {
        task.setTitle(title);      // ← タイトル編集時はここのみ実行
    }

    if (status != null) { ... }    // ← タイトル編集時は skip

    return taskRepository.save(task);
}
```

- `title != null` の場合のみタイトルを更新
- `status` は null なので status 関連の処理はスキップ

## データ変換テーブル

| レイヤー | 送信データ | 備考 |
|---------|----------|------|
| TaskItem handleSave | `(id: number, title: string)` | trimmed + 変更チェック済み |
| App.tsx onUpdate | `updateTask(id, { title })` | `{ title }` オブジェクトに変換 |
| tasksApi | `PUT /api/tasks/{id}` + `{ title }` | status フィールドなし |
| Controller | `Map: { "title": "..." }` | status は null |
| Service | `title="...", status=null` | title のみ更新 |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| TaskItem | 空文字 or 変更なし | API呼出せず、元の値に戻す |
| Controller | id が存在しない | `IllegalArgumentException` → 404 |
| useTasks | API例外 | `error` に `'タスクの更新に失敗しました'` をセット |

## 設計メモ

- **変更チェック**: `trimmed !== task.title` で実際に変更がある場合のみ API を呼ぶ。不要なリクエストを回避。
- **フォーカス + 全選択**: `inputRef.current.focus()` + `inputRef.current.select()` で編集開始時にテキスト全選択。ユーザーはすぐに上書き入力できる。
- **Blur でも保存**: Enter 以外にフォーカスアウトでも `handleSave` が走る。他のUI要素をクリックしても編集が失われない。
