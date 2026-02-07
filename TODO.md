# Sonic Flow - TODO

## High Priority

### AI Coaching (Feature D)
- [ ] AIService (Backend)
- [ ] POST /api/ai/advice エンドポイント
- [ ] AICoach コンポーネント (Frontend)
- [ ] アドバイス表示UI

### Noise Mixer - 音声再生
- [ ] 複数音源同時再生 (Web Audio API)
- [ ] useAudio フック作成

---

## Medium Priority

### Polish & Enhancement
- [ ] レスポンシブデザイン
- [ ] キーボードショートカット
- [ ] 通知機能 (タイマー終了時)

---

## Completed

### Documentation
- [x] プロジェクト仕様書作成 (Application_Overview.md)
- [x] CLAUDE.md 作成 (開発ガイド)
- [x] MEMORY.md 作成 (技術仕様)
- [x] README.md 更新 (開発ジャーナル形式)
- [x] TODO.md 作成
- [x] ADR/0001-tech-stack.md 作成

### Frontend Setup (Phase 1)
- [x] Vite + React + TypeScript プロジェクト作成
- [x] Tailwind CSS設定 (Notionスタイルカラー)
- [x] 基本レイアウトコンポーネント (Layout, Sidebar, MainContent)

### Task Management (Feature A)
- [x] TaskList コンポーネント
- [x] TaskItem コンポーネント (インライン編集対応)
- [x] TaskInput コンポーネント (新規タスク追加)
- [x] useTasks フック (CRUD操作)
- [x] タスク追加機能
- [x] タスク編集機能 (インライン)
- [x] タスク削除機能
- [x] ステータス切り替え (TODO/DONE)
- [x] フォーカスモード実装
- [x] 完了タスク折りたたみ表示

### TaskTree - 階層型タスク管理
- [x] フォルダ/サブフォルダ/タスクの階層構造
- [x] @dnd-kit によるドラッグ&ドロップ並び替え
- [x] ソフトデリート + ゴミ箱機能

### WorkScreen - 統合作業画面
- [x] ポモドーロタイマー + サウンドミキサー統合画面

### Backend Setup
- [x] Spring Boot プロジェクトのスキャフォールディング
- [x] build.gradle の作成
- [x] CORS設定 (WebMvcConfigurer)
- [x] H2 Database設定
- [x] Task Entity の作成
- [x] TaskRepository の作成
- [x] TaskService の作成
- [x] TaskController の作成 (CRUD API)

### Backend - Timer ドメイン
- [x] TimerSettings / TimerSession Entity
- [x] TimerRepository
- [x] TimerService
- [x] TimerController (設定・セッション API)

### Backend - Sound ドメイン
- [x] SoundSetting / SoundPreset Entity
- [x] SoundRepository
- [x] SoundService
- [x] SoundController (設定・プリセット API)

### Noise Mixer (Feature B) - UI
- [x] NoiseMixer コンポーネント
- [x] 音源選択UI (Rain, Thunder, Wind, Ocean, Birds, Fire)
- [x] 音量スライダー (0-100%)

### Focus Timer (Feature C)
- [x] FocusTimer コンポーネント
- [x] WORK/BREAK/LONG_BREAK カウントダウン
- [x] プログレスバー表示
- [x] 開始/停止/リセット機能
- [x] セッション数カウント
- [x] タイマー設定カスタマイズ

### Settings & Theme
- [x] ダークモード/ライトモード対応
- [x] フォントサイズ設定 (S/M/L)
- [x] Settings画面 (外観設定 + ゴミ箱)
