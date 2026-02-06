# Sonic Flow - TODO

## High Priority

### Backend Setup
- [ ] Spring Boot プロジェクトのスキャフォールディング
- [ ] build.gradle の作成
- [ ] CORS設定 (WebMvcConfigurer)
- [ ] H2 Database設定
- [ ] Task Entity の作成
- [ ] TaskRepository の作成
- [ ] TaskService の作成
- [ ] TaskController の作成 (CRUD API)

---

## Medium Priority

### Noise Mixer (Feature B)
- [ ] NoiseMixer コンポーネント
- [ ] 音源選択UI
- [ ] 音量スライダー (0-100%)
- [ ] 複数音源同時再生
- [ ] useAudio フック作成

### Focus Timer (Feature C)
- [ ] FocusTimer コンポーネント
- [ ] 25分/5分カウントダウン
- [ ] プログレスバー表示
- [ ] 開始/停止/リセット機能

---

## Low Priority

### AI Coaching (Feature D)
- [ ] AIService (Backend)
- [ ] POST /api/ai/advice エンドポイント
- [ ] AICoach コンポーネント (Frontend)
- [ ] アドバイス表示UI

### Polish & Enhancement
- [ ] ダークモード対応
- [ ] レスポンシブデザイン
- [ ] キーボードショートカット
- [ ] 通知機能 (タイマー終了時)
- [ ] 設定画面 (タイマー時間カスタマイズ)

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
