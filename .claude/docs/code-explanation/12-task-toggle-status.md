# タスクステータス切り替えフロー

## 概要

ユーザーがタスクのチェックボックスをクリックすると、TODO ⇔ DONE のステータスが切り替わる。バックエンドは status 変更時に `completedAt` タイムスタンプを自動管理する。DONE に変更すると `completedAt` が設定され、TODO に戻すと `completedAt` が null にクリアされる。

## シーケンス図

```
User          TaskItem       TaskList       App.tsx       useTasks           tasksApi        TaskController   TaskService       DB
 │               │              │              │              │                 │                │               │               │
 │ チェックボックス│              │              │              │                 │                │               │               │
 │──クリック─────▶│              │              │              │                 │                │               │               │
 │               │──onToggle(id)─▶             │              │                 │                │               │               │
 │               │              │──onToggle(id)─▶             │                 │                │               │               │
 │               │              │              │──toggleTaskStatus(id)──▶        │                │               │               │
 │               │              │              │              │ task検索→newStatus算出           │                │               │
 │               │              │              │              │──updateTask(id,{status})──▶      │                │               │
 │               │              │              │              │                 │──PUT /tasks/{id}──▶            │               │
 │               │              │              │              │                 │                │──updateTask()──▶              │
 │               │              │              │              │                 │                │               │ completedAt管理│
 │               │              │              │              │                 │                │               │──UPDATE──▶    │
 │               │              │              │              │                 │◀──200 + Task───│◀──Task────────│◀──────────────│
 │               │              │              │              │◀──Task───────────│               │               │               │
 │               │              │              │◀─setTasks()──│                 │                │               │               │
 │◀──表示切替────│◀─再描画───────│◀─────────────│              │                 │                │               │               │
```

## フロントエンド トレース

### 1. UIトリガー: TaskItem のチェックボックス

**ファイル**: `frontend/src/components/TaskList/TaskItem.tsx`

```typescript
// TaskItem.tsx:55-64
<button
  onClick={() => onToggle(task.id)}
  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
    isDone
      ? 'bg-notion-accent border-notion-accent text-white'
      : 'border-notion-border hover:border-notion-accent'
  }`}
>
  {isDone && <Check size={14} />}
</button>
```

- `isDone` (`TaskItem.tsx:47`): `task.status === 'DONE'` で判定
- DONE → 青背景+チェックマーク / TODO → 空ボーダー

### 2. コンポーネントチェーン

- `TaskList.tsx:59` — `<TaskItem onToggle={onToggle} />`
- `App.tsx:66` — `<TaskList onToggle={toggleTaskStatus} />`

### 3. フックロジック: useTasks.toggleTaskStatus

**ファイル**: `frontend/src/hooks/useTasks.ts`

```typescript
// useTasks.ts:71-77
const toggleTaskStatus = useCallback(async (id: number) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newStatus: TaskStatus = task.status === 'TODO' ? 'DONE' : 'TODO';
  await updateTask(id, { status: newStatus });
}, [tasks, updateTask]);
```

- 現在の `tasks` 配列から対象タスクを検索
- status を反転（TODO → DONE, DONE → TODO）
- `updateTask` を呼出（[11-task-edit-title.md](./11-task-edit-title.md) と同じ関数を再利用）

### 4. updateTask → tasksApi.updateTask

```typescript
// useTasks.ts:47-58
const updateTask = useCallback(async (id: number, updates: Partial<Pick<Task, 'title' | 'status'>>) => {
  const updatedTask = await tasksApi.updateTask(id, updates);
  setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
}, []);
```

## HTTPリクエスト/レスポンス

### リクエスト（TODO → DONE）

```
PUT /api/tasks/1
Content-Type: application/json

{
  "status": "DONE"
}
```

### レスポンス

```
HTTP/1.1 200 OK

{
  "id": 1,
  "title": "タスクのタイトル",
  "status": "DONE",
  "createdAt": "2025-01-15T10:30:00",
  "completedAt": "2025-01-15T14:00:00"    ← 自動設定
}
```

### リクエスト（DONE → TODO）

```
PUT /api/tasks/1
Content-Type: application/json

{
  "status": "TODO"
}
```

### レスポンス

```
HTTP/1.1 200 OK

{
  "id": 1,
  "title": "タスクのタイトル",
  "status": "TODO",
  "createdAt": "2025-01-15T10:30:00",
  "completedAt": null                      ← クリア
}
```

## バックエンド トレース

### 1. Controller: TaskController.updateTask

`TaskController.java:43-58` — タイトル編集と同じ Controller メソッド。今回は `status` が `Map` に含まれる。

```java
// TaskController.java:50-52
if (request.containsKey("status")) {
    status = TaskStatus.valueOf(request.get("status"));
}
```

### 2. Service: TaskService.updateTask（status部分）

**ファイル**: `backend/src/main/java/com/sonicflow/service/TaskService.java`

```java
// TaskService.java:45-54
if (status != null) {
    TaskStatus previousStatus = task.getStatus();
    task.setStatus(status);

    if (status == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
        task.setCompletedAt(LocalDateTime.now());   // DONE移行 → completedAt設定
    } else if (status == TaskStatus.TODO) {
        task.setCompletedAt(null);                   // TODO移行 → completedAtクリア
    }
}
```

**completedAt 自動管理ロジック**:

| 遷移 | completedAt の処理 |
|------|-------------------|
| TODO → DONE | `LocalDateTime.now()` を設定 |
| DONE → TODO | `null` にクリア |
| DONE → DONE（重複） | 何もしない（既存の completedAt を保持） |

## データ変換テーブル（TODO → DONE の場合）

| レイヤー | status | completedAt |
|---------|--------|-------------|
| TaskItem クリック | (反転を指示) | — |
| toggleTaskStatus | `"DONE"` | — |
| API リクエスト body | `"DONE"` | (送信しない) |
| Controller 受取 | `TaskStatus.DONE` | — |
| Service 処理後 | `DONE` | `LocalDateTime.now()` |
| DB UPDATE | `'DONE'` | `2025-01-15T14:00:00` |
| API レスポンス | `"DONE"` | `"2025-01-15T14:00:00"` |
| mapTaskResponse後 | `"DONE"` | `Date` オブジェクト |

## エラーハンドリング

| レイヤー | 条件 | 挙動 |
|---------|------|------|
| toggleTaskStatus | task が見つからない | `return`（何もしない） |
| Controller | 不正な status 文字列 | `IllegalArgumentException` → 404 |
| useTasks | API例外 | `error` に `'タスクの更新に失敗しました'` をセット |

## 設計メモ

- **completedAt の自動管理**: フロントエンドは status のみ送信し、`completedAt` はバックエンドが自動制御する。フロントエンドが不正なタイムスタンプを送る余地がない。
- **DONE → DONE の防御**: `previousStatus != TaskStatus.DONE` チェックにより、既にDONEのタスクに再度DONEを送っても `completedAt` は上書きされない。
- **toggleTaskStatus の依存配列**: `[tasks, updateTask]` — `tasks` 配列の最新版を参照するため、古い status で反転してしまう問題を回避。
- **UI即時反映**: `setTasks` の `map` でローカル置換するため、チェックボックスのアニメーションは API レスポンスを待って表示される。
