# Sonic Flow - Changelog

完了済み機能・タスクの履歴。

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
