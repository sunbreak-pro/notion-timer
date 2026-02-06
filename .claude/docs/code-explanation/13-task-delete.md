# タスク削除フロー

## 概要

ユーザーがタスク行のゴミ箱アイコンをクリックすると、確認ダイアログなしで即座に DELETE リクエストが送信され、タスクがDBから削除される。フロントエンドはローカルの tasks 配列からも該当タスクを除去する。

## シーケンス図

```
User          TaskItem       TaskList       App.tsx       useTasks        tasksApi         TaskController   TaskService      TaskRepository   DB
 │               │              │              │              │               │                │               │                │              │
 │ ゴミ箱クリック │              │              │              │               │                │               │                │              │
 │──────────────▶│              │              │              │               │                │               │                │              │
 │               │──onDelete(id)─▶             │              │               │                │               │                │              │
 │               │              │──onDelete(id)─▶             │               │                │               │                │              │
 │               │              │              │──deleteTask(id)──▶            │                │               │                │              │
 │               │              │              │              │──deleteTask()──▶               │                │               │              │
 │               │              │              │              │               │──DELETE /api/tasks/{id}──▶      │                │              │
 │               │              │              │              │               │                │──deleteTask()──▶               │              │
 │               │              │              │              │               │                │               │──deleteById()──▶│             │
 │               │              │              │              │               │                │               │                │──DELETE──▶   │
 │               │              │              │              │               │◀──204─────────│◀──────────────│◀───────────────│◀─────────────│
 │               │              │              │              │◀──void─────────│               │               │                │              │
 │               │              │              │◀─setTasks()──│(filter)        │               │                │              │
 │◀──タスク消滅──│◀─再描画───────│◀─────────────│              │               │                │               │                │              │
```

## フロントエンド トレース

### 1. UIトリガー: TaskItem のゴミ箱ボタン

**ファイル**: `frontend/src/components/TaskList/TaskItem.tsx`

```typescript
// TaskItem.tsx:87-92
<button
  onClick={() => onDelete(task.id)}
  className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
>
  <Trash2 size={16} />
</button>
```

- `opacity-0 group-hover:opacity-100`: タスク行にホバーした時のみゴミ箱アイコンが表示される
- ホバー時に赤色（`notion-danger`）に変化

### 2. コンポーネントチェーン

- `TaskList.tsx:61` — `<TaskItem onDelete={onDelete} />`
- `App.tsx:68` — `<TaskList onDelete={deleteTask} />`

### 3. フックロジック: useTasks.deleteTask

**ファイル**: `frontend/src/hooks/useTasks.ts`

```typescript
// useTasks.ts:60-69
const deleteTask = useCallback(async (id: number) => {
  try {
    setError(null);
    await tasksApi.deleteTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  } catch (err) {
    setError('タスクの削除に失敗しました');
    console.error('Failed to delete task:', err);
  }
}, []);
```

- API呼出（戻り値なし）→ 成功後、`filter` で該当タスクを配列から除去

### 4. APIクライアント: tasksApi.deleteTask

**ファイル**: `frontend/src/api/tasks.ts`

```typescript
// tasks.ts:43-45
async deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}
```

- レスポンスボディなし（204 No Content）

## HTTPリクエスト/レスポンス

### リクエスト

```
DELETE /api/tasks/1
```

### レスポンス（成功時）

```
HTTP/1.1 204 No Content
```

### レスポンス（存在しないID）

```
HTTP/1.1 404 Not Found
```

## バックエンド トレース

### 1. Controller: TaskController.deleteTask

**ファイル**: `backend/src/main/java/com/sonicflow/controller/TaskController.java`

```java
// TaskController.java:60-68
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
    try {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();    // 204
    } catch (IllegalArgumentException e) {
        return ResponseEntity.notFound().build();      // 404
    }
}
```

### 2. Service: TaskService.deleteTask

**ファイル**: `backend/src/main/java/com/sonicflow/service/TaskService.java`

```java
// TaskService.java:59-64
public void deleteTask(Long id) {
    if (!taskRepository.existsById(id)) {
        throw new IllegalArgumentException("Task not found: " + id);
    }
    taskRepository.deleteById(id);
}
```

- `existsById` で事前チェック → 存在しなければ例外
- `deleteById` で DB から削除

### 3. Repository

`TaskRepository` の `deleteById` は `JpaRepository` 組込みメソッド。

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| Service | id が存在しない | `IllegalArgumentException` → Controller が 404 返却 |
| useTasks | API例外 | `error` に `'タスクの削除に失敗しました'` をセット |
| useTasks | 成功時 | `filter` でローカル除去 → タスクが消える |

## 設計メモ

- **確認ダイアログなし**: 削除操作に確認UIがない。ホバーでのみアイコン表示することで誤操作を軽減している。
- **物理削除**: soft delete（論理削除）ではなく `deleteById` で物理削除。一度削除すると復元不可。
- **ローカル除去は API 成功後**: `await tasksApi.deleteTask(id)` の後に `filter` が実行されるため、API失敗時にUIからタスクが消えてしまうことはない。
- **存在チェックの二重実行**: Service で `existsById` → `deleteById` は2回のDBアクセス。`deleteById` 単体は存在しない場合に `EmptyResultDataAccessException` を投げるため、`existsById` は明示的なエラーメッセージのためのガード。
