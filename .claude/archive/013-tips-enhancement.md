# 013 - Tips セクション補完

## Status: COMPLETED

## 概要
Tips画面のドキュメントを大幅に補完。実装済みの全キーボードショートカット（25+件）をShortcutsTabに網羅し、Memo・Analyticsの新タブを追加。既存タブにもコンテキストメニュー、タグ、テンプレート等の欠落情報を追記。

## 変更内容

### ShortcutsTab.tsx — 全ショートカット網羅
- 4カテゴリ/~12件 → 6カテゴリ/29件に拡充
- 新カテゴリ: Navigation (⌘1-5), View (サイドバー開閉)
- 既存カテゴリに追加: コマンドパレット(⌘K), タイマーモーダル(⌘⇧T), リセット(r), Task Tree操作(矢印/Tab/⌘Enter)
- `shift` 定数追加でWindows対応

### MemoTab.tsx — 新規作成
- Daily Memo, Date Navigation, Rich Text Editor, Calendar Integration, Deleting Memos の5セクション

### AnalyticsTab.tsx — 新規作成
- Overview Metrics, Completion Rates, Accessing Analytics の3セクション

### Tips.tsx — タブ追加
- TABS配列に `memo`, `analytics` を追加（editor の前）
- renderTab() に対応ケース追加

### TasksTab.tsx — セクション追加
- Task Details: ⌘Enter完了切替、Tab/Shift+Tab インデント
- Context Menu: 右クリック操作メニュー
- Tags: タグ作成・付与・フィルタ
- Templates: テンプレート保存・適用

### TimerTab.tsx — 項目追加
- Starting a Session: `r` リセット
- Timer Modal: ⌘⇧T モーダル開閉

### CalendarTab.tsx — セクション追加
- Keyboard Shortcuts: j/k/t/m キーバインド
- Kbd ヘルパーコンポーネント追加

## 技術的判断
- 各タブ内で Section/Strong/Kbd ヘルパーをローカル定義（既存パターン踏襲、共通化は行わない）
- `isMac` は `utils/platform.ts` から import（Windows互換性対応で作成済み）
