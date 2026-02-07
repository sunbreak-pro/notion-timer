# 003: SubSidebar & WorkScreen 5項目改善

## Status: COMPLETED

## 実装済み Issue 一覧

### Issue 1: +ボタン完全削除 ✅
- `TaskTreeInput.tsx`: Plus/Folder アイコン、creationType state、ボタン2つを削除
- `TaskTreeNode.tsx`: childPlaceholder テキスト更新
  - folder内: `"Type task name (/ for subfolder)"`
  - subfolder内: `"Type task name..."`

### Issue 2: DnD脱出不可の修正 ✅
- `useTaskTree.ts`: `moveNode()` の task バリデーション修正（`parentId=null` を許可）
- `useTaskTree.ts`: `promoteToFolder()` 追加（subfolder → folder 昇格）
- `TaskTree.tsx`: `handleDragEnd` 書き直し（Inbox/Projectsドロップゾーン対応）

### Issue 3: インデント線の幅変更 ✅
- `TaskTreeNode.tsx`: `w-px` → `w-1`（4px）

### Issue 4: WorkScreen タスク選択機能 ✅
- `TaskSelector.tsx` (NEW): 階層タスク選択ドロップダウン
  - 未完了タスクのみ表示、フォルダ階層表示
  - 新規タスク作成（Inboxに追加）
  - Free Session 解除オプション
- `WorkScreen.tsx`: `<h2>` → `<TaskSelector>` に置換

### Issue 5: DnDフォルダ持ち上がりバグ修正 ✅
- `TaskTree.tsx`: 単一 SortableContext → セクション別 SortableContext に分割
  - Inbox: `inboxIds` の SortableContext
  - Projects: `folderIds` の SortableContext
- `TaskTreeNode.tsx`: 展開フォルダの子を独自 SortableContext でラップ
- `TaskTree.tsx`: `useDroppable` によるセクションヘッダーのドロップゾーン追加
  - ドラッグ時のビジュアルフィードバック（accent カラーのハイライト）

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `TaskTreeInput.tsx` | ボタン削除、簡素化 |
| `TaskTreeNode.tsx` | placeholder更新、w-1、SortableContext追加 |
| `TaskTree.tsx` | SortableContext分割、useDroppable追加、handleDragEnd書き直し |
| `useTaskTree.ts` | promoteToFolder追加、moveNode修正 |
| `WorkScreen.tsx` | TaskSelector統合 |
| `TaskSelector.tsx` (NEW) | 階層タスク選択ドロップダウン |
