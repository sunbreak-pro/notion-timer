# 008: Tips画面 + TipTapエディタ拡張

**Status**: IN_PROGRESS
**Created**: 2026-02-09

---

## 概要

2つの独立した機能:
1. **Tips画面**: LeftSidebarに新セクション追加。ショートカット一覧・各画面の使い方を5タブ構成で表示
2. **TipTapエディタ拡張**: スラッシュコマンドに Toggle List / Table / Callout / Image の4ブロックタイプ追加

---

## Feature 1: Tips画面

### タブ構成
| タブ | 内容 |
|------|------|
| Shortcuts | 全キーボードショートカット一覧（Global/Tasks/Timer/Calendar） |
| Tasks | タスクツリー操作ガイド（作成/DnD/フォルダ/ソフトデリート） |
| Timer | ポモドーロタイマーの使い方（WORK/BREAK/モーダル/バックグラウンド） |
| Calendar | カレンダー操作（月/週切替/タスク作成/フィルタ/時間軸UI） |
| Editor | リッチテキスト機能（スラッシュコマンド一覧/書式/新ブロックタイプ） |

### 変更ファイル
- `frontend/src/types/navigation.ts` — `SectionId` に `'tips'` 追加
- `frontend/src/components/Layout/LeftSidebar.tsx` — Tips メニューアイテム追加
- `frontend/src/App.tsx` — `renderContent()` に `case "tips"` 追加
- `frontend/src/components/Tips/Tips.tsx` — メインコンポーネント（タブ管理）
- `frontend/src/components/Tips/ShortcutsTab.tsx`
- `frontend/src/components/Tips/TasksTab.tsx`
- `frontend/src/components/Tips/TimerTab.tsx`
- `frontend/src/components/Tips/CalendarTab.tsx`
- `frontend/src/components/Tips/EditorTab.tsx`
- `frontend/src/components/Tips/index.ts`

---

## Feature 2: TipTapエディタ拡張

### 追加ブロックタイプ
| ブロック | 実装方式 | Slashコマンド |
|---------|---------|---------------|
| Toggle List | カスタムNode（HTML `<details>`/`<summary>` ベース） | "Toggle List" |
| Table | 公式 `@tiptap/extension-table` 系 | "Table" (3×3 default) |
| Callout | カスタムNode（emoji + テキスト） | "Callout" |
| Image | 公式 `@tiptap/extension-image` | "Image" (URL prompt) |

### 追加パッケージ
- `@tiptap/extension-table`
- `@tiptap/extension-table-row`
- `@tiptap/extension-table-cell`
- `@tiptap/extension-table-header`
- `@tiptap/extension-image`

### 変更ファイル
- `frontend/src/extensions/ToggleList.ts` — カスタム3ノード定義
- `frontend/src/extensions/Callout.ts` — カスタムCalloutノード
- `frontend/src/components/TaskDetail/MemoEditor.tsx` — 新extensions追加
- `frontend/src/components/TaskDetail/SlashCommandMenu.tsx` — 4コマンド追加
- `frontend/src/index.css` — 新ブロックタイプのCSS

---

## 今後の拡張候補
- Toggle List: ネストされたトグル
- Callout: 絵文字ピッカーでアイコン変更
- Image: ドラッグ&ドロップアップロード、リサイズハンドル
- Table: 列/行追加UI、リサイズハンドル
