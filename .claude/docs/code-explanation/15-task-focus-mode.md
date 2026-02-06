# フォーカスモード（フロントエンドのみ）

## 概要

フォーカスモードはフロントエンドのみで完結するUI機能。ON にすると、選択したタスク以外が半透明になり、1つのタスクに集中できる視覚効果を提供する。バックエンドとの通信は一切発生しない。

## シーケンス図

```
User          TaskList        App.tsx
 │               │              │
 │ Focus Mode    │              │
 │──ボタンクリック▶              │
 │               │──onToggleFocusMode()──▶
 │               │              │ setFocusMode(!prev)
 │               │              │ if(解除) setFocusedTaskId(null)
 │               │◀─再描画──────│
 │               │              │
 │ タスクをクリック│             │
 │──────────────▶│              │
 │               │──onFocusTask(id)──▶
 │               │              │ setFocusedTaskId(id)
 │               │◀─再描画──────│
 │◀──フォーカスUI │              │
```

## フロントエンド トレース

### 1. State 管理: App.tsx

**ファイル**: `frontend/src/App.tsx`

```typescript
// App.tsx:9-10
const [focusMode, setFocusMode] = useState(false);
const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
```

| State | 型 | デフォルト | 用途 |
|-------|---|-----------|------|
| `focusMode` | `boolean` | `false` | フォーカスモードのON/OFF |
| `focusedTaskId` | `number \| null` | `null` | フォーカス中のタスクID |

### 2. フォーカスモード切替: handleToggleFocusMode

```typescript
// App.tsx:24-29
const handleToggleFocusMode = () => {
  setFocusMode((prev) => !prev);
  if (focusMode) {
    setFocusedTaskId(null);    // OFF にする時はフォーカスIDもクリア
  }
};
```

- ON → OFF: `focusedTaskId` を null にリセット
- OFF → ON: まだタスクは選択されていない状態

### 3. タスク選択: handleFocusTask

```typescript
// App.tsx:31-33
const handleFocusTask = (id: number | null) => {
  setFocusedTaskId(id);
};
```

### 4. TaskList への props 渡し

```typescript
// App.tsx:69-72
focusMode={focusMode}
focusedTaskId={focusedTaskId}
onFocusTask={handleFocusTask}
onToggleFocusMode={handleToggleFocusMode}
```

### 5. フォーカスモードボタン: TaskList

**ファイル**: `frontend/src/components/TaskList/TaskList.tsx`

```typescript
// TaskList.tsx:38-48
<button
  onClick={onToggleFocusMode}
  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
    focusMode
      ? 'bg-notion-accent text-white'       // ON → 青背景白文字
      : 'text-notion-text-secondary hover:bg-notion-hover'  // OFF → グレー
  }`}
>
  <Focus size={16} />
  <span>Focus Mode</span>
</button>
```

### 6. タスクのクリック検出

```typescript
// TaskList.tsx:53-56
<div
  key={task.id}
  onClick={() => focusMode && onFocusTask(task.id)}
>
```

- `focusMode && onFocusTask(task.id)`: フォーカスモード ON の時のみタスク選択が有効

### 7. 視覚効果: TaskItem

**ファイル**: `frontend/src/components/TaskList/TaskItem.tsx`

```typescript
// TaskItem.tsx:15
export function TaskItem({ task, onToggle, onUpdate, onDelete, isFocused, dimmed }: TaskItemProps) {
```

```typescript
// TaskItem.tsx:50-53
<div className={`group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-notion-hover transition-all ${
  dimmed ? 'opacity-30' : ''
} ${isFocused ? 'ring-2 ring-notion-accent' : ''}`}>
```

| props | 条件 | 視覚効果 |
|-------|------|---------|
| `isFocused=true` | フォーカス中のタスク | `ring-2 ring-notion-accent`（青い外枠） |
| `dimmed=true` | 非フォーカスのタスク | `opacity-30`（30%の透明度） |
| 両方 false | フォーカスモードOFF | 通常表示 |

### 8. isFocused / dimmed の算出

**未完了タスク** (`TaskList.tsx:62-63`):

```typescript
isFocused={focusMode && focusedTaskId === task.id}
dimmed={focusMode && focusedTaskId !== null && focusedTaskId !== task.id}
```

| focusMode | focusedTaskId | 対象タスク | isFocused | dimmed |
|-----------|--------------|-----------|-----------|--------|
| false | — | — | false | false |
| true | null | — | false | false |
| true | 1 | id=1 | true | false |
| true | 1 | id=2 | false | true |

**完了済みタスク** (`TaskList.tsx:88`):

```typescript
dimmed={focusMode}
```

- フォーカスモードON → 完了済みタスクは常に `dimmed`
- 完了済みタスクは `isFocused` にならない

## 状態遷移図

```
[OFF]
  │
  │ Focus Mode ボタンクリック
  ▼
[ON, focusedTaskId=null] ────── 全タスク通常表示
  │
  │ タスクをクリック
  ▼
[ON, focusedTaskId=X] ────── タスクX: リング表示、他: 半透明
  │
  │ 別タスクをクリック
  ▼
[ON, focusedTaskId=Y] ────── タスクY: リング表示、他: 半透明
  │
  │ Focus Mode ボタンクリック
  ▼
[OFF, focusedTaskId=null] ── 全タスク通常表示（リセット）
```

## エラーハンドリング

なし。フロントエンドのみの状態管理のため、エラーが発生する余地がない。

## 設計メモ

- **DB永続化なし**: フォーカス状態はリロードで消える。一時的なUI状態として設計されている。
- **完了済みタスクの扱い**: フォーカスモードON時、完了済みセクションは常にdimmed。フォーカス対象に選べない。
- **条件付きクリック**: `focusMode && onFocusTask(task.id)` により、フォーカスモードOFF時のクリックはタスク選択を発火しない。通常モードでの誤動作を防止。
- **Phase 2 との連携想定**: フォーカスしたタスクIDをタイマーの `startTimer(taskId)` に渡すことで、「このタスクに集中する」フローが完成する。現時点ではUI接続のみ。
