# Code Integrity Report

## 2026-02-07: selectedFolderId 廃止 & 統一ツリー化

### 変更概要
`selectedFolderId` による Inbox/Folder 2モード設計を廃止し、Notion のようにルートレベルにフォルダもタスクも同列で表示する統一ツリーに変更。

### 経緯
- `selectedFolderId` を `useState` から `const null` に変更した結果、フォルダが表示されなくなった
- `TaskTree.tsx` で `getChildren(null).filter((n) => n.type !== "folder")` によりフォルダが除外されていた
- フォルダの選択・ナビゲーション手段がなく、作成しても見えない状態だった

### 変更内容
| ファイル | 変更 |
|---------|------|
| `App.tsx` | `selectedFolderId` 変数・prop 渡しを削除 |
| `Layout.tsx` | `selectedFolderId` prop 削除、リサイズ修正 |
| `SubSidebar.tsx` | `selectedFolderId` prop 削除 |
| `TaskTree.tsx` | フォルダフィルタ削除、`displayNodes = getChildren(null)` に統一 |

### リサイズ修正
- **offset**: `e.clientX - 48` → `e.clientX - 240` (Sidebar 幅が `w-60` = 240px に変更されていた)
- **handle position**: `relative` → `absolute top-0 right-0` (SubSidebar の下に押し出されていた問題を修正)
- **z-index**: `z-0` → `z-10` (SubSidebar の上に描画)
- **wrapper**: `shrink-0` 追加 (flex 親での縮小防止)
- `SIDEBAR_WIDTH` 定数を導入して offset をハードコード値から分離
