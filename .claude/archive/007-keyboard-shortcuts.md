# 007 - Keyboard Shortcuts 拡張

**Status**: COMPLETED (Phase 0-5 ALL COMPLETED)
**Created**: 2026-02-09

## Overview
Sonic Flow全体にキーボードショートカットを体系的に導入し、マウス操作なしでの高速ワークフローを実現する。
Phase 0（Cmd+. / Cmd+Shift+. / Cmd+,）は実装済み。

## 実装済み (Phase 0)

| Shortcut | Action |
|----------|--------|
| `Cmd+.` | Left Sidebar 開閉トグル |
| `Cmd+Shift+.` | Right Sidebar 開閉トグル |
| `Cmd+,` | Settings画面に遷移 |

---

## Phases

### Phase 1: セクション切替 — Priority: High

| Shortcut | Action |
|----------|--------|
| `Cmd+1` | Tasks セクション |
| `Cmd+2` | Session セクション |
| `Cmd+3` | Calendar セクション |
| `Cmd+4` | Analytics セクション |
| `Cmd+5` | Settings セクション |

**実装箇所**: `App.tsx` の keydown handler に追加。`metaKey + Digit1〜5` で `setActiveSection` を呼び分ける。

### Phase 2: タスク操作 — Priority: High

| Shortcut | Action |
|----------|--------|
| `Enter` | 選択タスクのタイトルをインラインリネーム開始 |
| `Cmd+Enter` | 選択タスクの完了/未完了トグル |
| `Cmd+Shift+N` | 新規フォルダ作成 |
| `↑` / `↓` | タスクツリーでフォーカス移動 |
| `→` / `←` | フォルダの展開/折りたたみ |
| `Tab` | 選択タスクをインデント（親フォルダに入れる） |
| `Shift+Tab` | 選択タスクをアウトデント（親から出す） |

**実装箇所**: `TaskTree.tsx` / `TaskTreeNode.tsx` にキーボードナビゲーションを追加。フォーカス管理には `roving tabindex` パターンを使用。

### Phase 3: タイマー制御 — Priority: Medium

| Shortcut | Action |
|----------|--------|
| `Space` | タイマー開始/一時停止（実装済み） |
| `r` | タイマーリセット |
| `Cmd+Shift+T` | タイマーモーダル開閉 |

**実装箇所**: `App.tsx` の既存 keydown handler を拡張。

### Phase 4: カレンダー操作 — Priority: Medium

| Shortcut | Action |
|----------|--------|
| `j` / `→` | 次の月/週 |
| `k` / `←` | 前の月/週 |
| `t` | 今日にジャンプ |
| `m` | Monthly / Weekly 表示切替 |

**実装箇所**: `CalendarView.tsx` にセクション固有の keydown handler を追加。`activeSection === 'calendar'` 時のみ有効。

### Phase 5: コマンドパレット — Priority: Medium

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | コマンドパレット表示 |

**概要**: Notionライクなコマンドパレットモーダル。全ショートカットの検索・実行、タスク検索、セクション切替を統合。
- `CommandPalette.tsx` コンポーネント新規作成
- 検索フィルタリング + ↑↓ キーで候補選択 + Enter で実行
- 登録済みショートカット一覧も表示

---

## 設計方針

### キーハンドラの優先順位
1. **Cmd系ショートカット** — 入力中でも動作（`isInputFocused()` チェック前に判定）
2. **単キーショートカット** — 入力中は無効化（`isInputFocused()` チェック後に判定）
3. **セクション固有ショートカット** — 該当セクションがアクティブ時のみ有効

### 実装パターン
- グローバルショートカット: `App.tsx` / `Layout.tsx` の `useEffect` + `window.addEventListener`
- セクション固有: 各セクションコンポーネント内の `useEffect`
- 将来的にはカスタムフック `useKeyboardShortcuts` に集約を検討

### アクセシビリティ
- ショートカットはすべてオプショナル（マウス操作でも同じ操作が可能）
- Settings画面にショートカット一覧を表示するセクションを追加予定

---

## Files (Phase 1-2 見込み)

### Modified
- `frontend/src/App.tsx` — セクション切替ショートカット追加
- `frontend/src/components/TaskTree/TaskTree.tsx` — キーボードナビゲーション
- `frontend/src/components/TaskTree/TaskTreeNode.tsx` — フォーカス管理

### New (Phase 5)
- `frontend/src/components/CommandPalette/CommandPalette.tsx`
- `frontend/src/hooks/useKeyboardShortcuts.ts`
