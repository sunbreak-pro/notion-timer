# Sonic Flow - Changelog

完了済み機能・タスクの履歴。

---

## Phase 3: リファクタリング & 改善

### SubSidebar & WorkScreen 改善 (Plan 003)
- SubSidebar リサイズ対応 (160-400px)
- WorkScreen モーダルオーバーレイモード
- TaskTreeInput の UX 改善

### Subfolder 廃止、Folder 統一型 + 5階層ネスト対応
- `subfolder` タイプを廃止し `folder` に統一
- フォルダの5階層ネスト対応 (`MAX_FOLDER_DEPTH = 5`)
- localStorage の自動マイグレーション

### Frontend リファクタリング (Plan 002)
- Phase 1 バグ修正 (B1-B4): localStorage参照統一、key collision修正
- Phase 2 重複排除 (D1-D4): 定数・ロジック重複の解消
- Phase 3 コンポーネント分割 (E1-E3): TaskTreeNode→5分割、useTaskTree→4分割、SlashCommandMenu→hook+component分割
- Phase 4 パフォーマンス最適化 (E4-E6, B5-B6): useMemo化、localStorage書込みデバウンス、未使用axios削除

---

## Phase 2: UI-First Implementation

### TaskTree - 階層型タスク管理
- フォルダ/サブフォルダ/タスクの3階層構造
- @dnd-kit によるドラッグ&ドロップ並び替え
- ソフトデリート + ゴミ箱機能

### WorkScreen - 統合作業画面
- ポモドーロタイマー + サウンドミキサー統合画面
- オーバーレイモード（タスクPlay起動）+ メインコンテンツモード（Session）

### Noise Mixer (Feature B) - UI
- NoiseMixer コンポーネント
- 音源選択UI (Rain, Thunder, Wind, Ocean, Birds, Fire)
- 音量スライダー (0-100%)

### Focus Timer (Feature C)
- FocusTimer コンポーネント
- WORK/BREAK/LONG_BREAK カウントダウン
- プログレスバー表示
- 開始/停止/リセット機能
- セッション数カウント
- タイマー設定カスタマイズ

### Settings & Theme
- ダークモード/ライトモード対応
- フォントサイズ設定 (S/M/L)
- Settings画面 (外観設定 + ゴミ箱)

---

## Phase 1: Foundation

### Documentation
- プロジェクト仕様書作成 (Application_Overview.md)
- CLAUDE.md 作成 (開発ガイド)
- MEMORY.md 作成 (技術仕様)
- README.md 更新 (開発ジャーナル形式)
- TODO.md 作成
- ADR/0001-tech-stack.md 作成

### Frontend Setup
- Vite + React + TypeScript プロジェクト作成
- Tailwind CSS設定 (Notionスタイルカラー)
- 基本レイアウトコンポーネント (Layout, Sidebar, MainContent)

### Task Management (Feature A)
- TaskList コンポーネント
- TaskItem コンポーネント (インライン編集対応)
- TaskInput コンポーネント (新規タスク追加)
- useTasks フック (CRUD操作)
- タスク追加/編集/削除機能
- ステータス切り替え (TODO/DONE)
- フォーカスモード実装
- 完了タスク折りたたみ表示

### Backend Setup
- Spring Boot プロジェクトのスキャフォールディング
- build.gradle の作成
- CORS設定 (WebMvcConfigurer)
- H2 Database設定
- Task Entity / Repository / Service / Controller (CRUD API)

### Backend - Timer ドメイン
- TimerSettings / TimerSession Entity
- TimerRepository / TimerService / TimerController

### Backend - Sound ドメイン
- SoundSetting / SoundPreset Entity
- SoundRepository / SoundService / SoundController
