# Sonic Flow - Changelog

完了済み機能・タスクの履歴。

---

## コードクリーンアップ & ディレクトリ構造整理 (009)

### Phase 1: ディレクトリ構造整理
- Barrel `index.ts` を5ディレクトリに追加（api, context, hooks, types, utils）
- `ErrorBoundary.tsx` を `components/shared/` へ移動
- `navigation.ts`（1行のみ）を `taskTree.ts` に統合・削除

### Phase 2: Context命名規約統一
- `*ContextValue.ts` 4ファイルをcamelCase→PascalCaseにリネーム

### Phase 3: エラーハンドリング改善
- `.catch(() => {})` サイレントエラー10箇所に `console.warn` 追加
- JSON.parse失敗時のログ3箇所追加

### Phase 4: セキュリティ脆弱性修正
- SlashCommandMenu XSS修正（画像URL検証: http/httpsのみ許可）
- useCustomSounds MIME検証強化（マジックバイトチェック追加）

### Phase 5: バックエンド クラッシュ防止
- H2コンソールをdevプロファイルのみに制限
- TaskService 循環参照防止（visited Setで無限再帰回避）
- TimerController 型キャスト安全化（instanceofパターンマッチング）
- MemoController 日付パース安全化（DateTimeParseException → 400）
- AIService JSON解析をJackson ObjectMapperに置換

### Phase 6: グローバル例外ハンドラー
- `@ControllerAdvice` で統一エラーレスポンス（400/500）

---

## サウンド再生エンジン バグ修正

### AudioEngine 致命的バグ3件修正
- **AudioContext closed状態の未処理修正**: `ensureContext()`で`state === 'closed'`なら新規AudioContextを作成するよう修正（React StrictMode / WorkScreen再マウントで発生）
- **cleanup後のnull化漏れ修正**: `contextRef.current?.close()`後に`null`代入を追加し、closedなContextの再利用を防止
- **play/pause競合修正**: `pauseTimeoutsRef`でフェードアウト用setTimeoutのIDを管理し、play前にpendingなpauseをキャンセル
- **unmount時タイムアウトリーク修正**: cleanup時に全pauseタイムアウトをclearTimeout

---

## Timer/Sound API連携 + キーボードショートカット拡張

### Timer/Sound バックエンドAPI接続 (004残タスク → 001)
- **ddl-auto変更**: `create-drop` → `update` でDB永続化
- **型修正**: `TimerSession.taskId` を `number` → `string | null` に修正
- **localStorage キー追加**: `BREAK_DURATION`, `LONG_BREAK_DURATION`, `SESSIONS_BEFORE_LONG_BREAK`
- **timerClient.ts (新規)**: Timer Settings/Sessions API クライアント（fetch API）
- **soundClient.ts (新規)**: Sound Settings/Presets API クライアント（fetch API）
- **TimerContext バックエンド同期**: 楽観的更新パターン（localStorage即時 → 500msデバウンスPUT）
  - マウント時に `fetchTimerSettings()` → localStorage上書き（フォールバック対応）
  - `break/longBreak/sessionsBeforeLongBreak` をハードコードから `useLocalStorage` に移行
  - セッション記録: `start()` → POST、`pause()/reset()` → PUT（部分完了）、タイマー完了 → PUT（完了）
- **Sound Mixer バックエンド同期**: `useLocalSoundMixer` に同パターン追加
  - マウント時にバックエンドから設定取得
  - `toggleSound`/`setVolume` 時にサウンドタイプ別デバウンスPUT
- **TimerContextValue 拡張**: `breakDurationMinutes`, `longBreakDurationMinutes`, `setBreakDurationMinutes`, `setLongBreakDurationMinutes`, `setSessionsBeforeLongBreak` 追加

### キーボードショートカット拡張 (007 Phase 1-4)
- **Phase 1 セクション切替**: `Cmd+1`〜`Cmd+5` で tasks/session/calendar/analytics/settings に切替
- **Phase 2 タスク操作**: `↑/↓` フォーカス移動、`→/←` フォルダ展開/折りたたみ、`Cmd+Enter` 完了トグル、`Tab/Shift+Tab` インデント/アウトデント
- **Phase 3 タイマー制御**: `r` リセット、`Cmd+Shift+T` モーダル開閉
- **Phase 4 カレンダーナビゲーション**: `j/k` 前後移動、`t` 今日、`m` 月/週切替

### プラン整理
- `006-calendar-enhancement.md` → archive (COMPLETED)
- `008-tips-and-editor-enhancements.md` → archive (COMPLETED)
- Backend テスト修正: TaskNodeDTO コンストラクタに `color` パラメータ追加

---

## Phase 7: Backend再統合 + Calendar & Analytics

### Backend再統合 (004)
- **Task Entity全面改修**: `Long` ID → `String` ID（フロントエンド `"task-xxxx"` 形式に統一）
- **TaskNodeDTO**: record型で `TaskNode` と1:1マッピング
- **TaskRepository**: `findByIsDeletedFalseOrderBySortOrderAsc()`, `findByIsDeletedTrue()` 追加
- **TaskService全面改修**: `getTaskTree()`, `syncTree()`, `softDelete()`, `restore()`, `permanentDelete()` — カスケード操作対応
- **TaskController新API**: `GET /tree`, `GET /deleted`, `PUT /tree` (一括同期), `DELETE /{id}/soft`, `POST /{id}/restore`
- **TimerSession.taskId**: `Long` → `String` 型変更
- **MigrationController**: `POST /api/migrate/tasks` — localStorage一括投入エンドポイント
- **TaskServiceTest**: 新API対応にテスト全面更新

### Frontend API Client & Hooks
- **taskClient.ts**: native fetch による Task API クライアント（CRUD + sync + migration）
- **useTaskTreeAPI hook**: API起動時にfetch → localStorageフォールバック。Optimistic Update + 500msデバウンスのwrite-through同期
- **TaskTreeContext切替**: `useTaskTree` → `useTaskTreeAPI` にデータソース切替（接続ポイント1箇所のみ）
- **useMigration hook**: localStorage→Backend自動マイグレーション（二重実行防止フラグ付き）

### Calendar & Analytics (005)
- **ナビゲーション拡張**: `SectionId` に `'calendar' | 'analytics'` 追加、LeftSidebar にメニュー追加
- **CalendarView**: 月/週表示切替、前後ナビゲーション、Todayボタン
- **MonthlyView**: 6行x7列グリッド、前後月の日付パディング
- **WeeklyView**: 1行x7列シンプル版
- **DayCell**: 今日ハイライト、最大2件表示 + "+N more" 折りたたみ
- **CalendarTaskItem**: タスク名省略表示、完了状態スタイル
- **DateTimePicker**: カスタムコンポーネント（ミニカレンダー + 時/分セレクター + クリアボタン）
- **useCalendar hook**: タスクを日付キーでグループ化、月/週の日付配列生成
- **scheduledAt フィールド**: TaskNode型拡張、新規タスク作成時に自動設定
- **TaskDetailHeader**: DateTimePicker統合
- **フィルタタブ**: incomplete/completed 切替
- **AnalyticsView**: 基本統計（総タスク数、完了数、進行中数、フォルダ数、完了率）

---

## Phase 6: バグ修正 + Noise Mixer音声再生 + ポリッシュ

### バグ修正・技術的負債 (Phase 1)
- **TimerContext stale closure修正**: `advanceSession`の`sessionType`/`completedSessions`/`config`を`useRef`+`useEffect`で保持し、`setInterval`コールバック内のstale値参照を解消
- **TaskNodeContent 300msクリック遅延修正**: `setTimeout`によるシングル/ダブルクリック区別を廃止、ネイティブ`onClick`/`onDoubleClick`に置き換え
- **React lint error全件修正**: `react-hooks/exhaustive-deps`警告、`react-refresh/only-export-components`エラー、`react-hooks/refs`エラーを修正。TypeScript build error（test/setup.ts `beforeEach`未定義）を`tsconfig.app.json`のexcludeで解消
- **バンドルサイズ最適化**: `MemoEditor`（TipTap）を`React.lazy()`+`Suspense`で遅延読み込み化。メインchunk 671KB→298KB（57%削減）

### Noise Mixer 音声再生 (Phase 2)
- **useAudioEngine hook新規作成**: Web Audio API (`AudioContext` + `HTMLAudioElement` + `MediaElementAudioSourceNode` + `GainNode`)をラップ。ループ再生、リアルタイム音量制御、200msフェードイン/アウト
- **SoundMixer接続**: `WorkScreen`で`useAudioEngine(mixer)`を呼び出し、`useLocalSoundMixer`の状態変更を自動反映
- **リソース管理**: アンマウント時の`AudioContext.close()`+全要素解放、タブ非表示時の自動ミュート/復帰
- **sounds定数にfileパス追加**: `SOUND_TYPES`に`file`フィールド追加（`/sounds/*.mp3`）

### ポリッシュ (Phase 3)
- **ブラウザ通知**: タイマーセッション完了時に`Notification API`でデスクトップ通知。Settings画面にトグルUI追加
- **キーボードショートカット**: `Space`（タイマー開始/停止）、`n`（新規タスク）、`Escape`（モーダル閉じ）、`Delete`/`Backspace`（タスク削除）。テキスト入力中は無効化

---

## Phase 5: AI Coaching (Gemini API)

### AI Coaching Backend
- `AIConfig.java` — RestClient Bean + APIキー管理 (`SONICFLOW_AI_API_KEY` 環境変数)
- `AIService.java` — Gemini API通信、日本語プロンプト(breakdown/encouragement/review)
- `AIController.java` — `POST /api/ai/advice` エンドポイント
- `application.properties` — `sonicflow.ai.api-key`, `sonicflow.ai.model` 設定追加

### AI Coaching Frontend
- `types/ai.ts` — AIAdviceRequest/Response 型定義
- `api/aiClient.ts` — native fetch による API通信
- `hooks/useAICoach.ts` — 状態管理フック (advice/loading/error)
- `components/AICoach/` — AICoachPanel, AIRequestButtons, AIAdviceDisplay
- `TaskDetail.tsx` — MemoEditor下部にAICoachPanel統合
- `vite.config.ts` — `/api` プロキシ追加 (→ localhost:8080)

### AI Coach 429エラー修正 & モデル移行
- モデル `gemini-2.0-flash` → `gemini-2.5-flash-lite` に変更（旧モデル廃止対応）
- `AIService.java` — `@PostConstruct migrateDeprecatedModel()` でDB自動マイグレーション
- `AIService.java` — デバッグログ追加（HTTPステータス・モデル名・レスポンスボディ）
- `AIService.java` — `extractGeminiError()` でAPIエラー詳細をユーザーに表示
- `AIService.java` — `buildPrompt()` で taskContent を500文字に制限
- `AIConfig.java`, `AISettings.java`, `application.properties`, `AISettings.tsx` — デフォルトモデル更新

---

## Phase 4: ドキュメント同期 & テスト基盤

### ドキュメント同期 (Plan 001-documentation-sync)
- `Application_Overview.md` — Java 21→23、フラットTask→TaskNodeツリー、Axios→native fetch、localStorage中心アーキテクチャに全面更新
- `ADR 0001` — Java 23、React 19、Vite 7、Tailwind v4、native fetch、TipTap、@dnd-kit追記
- `00-index.md` — Phase実装マトリクス全面更新（タイマー/サウンド/設定 ✅反映、接続状態カラム追加）
- `01-architecture-overview.md` — localStorage中心アーキテクチャに書き換え、Context Provider構成・コンポーネント階層・状態管理パターン更新
- `02-infrastructure.md` — Axiosクライアント削除、useLocalStorage/storageKeys説明追加、レイアウトシステム更新

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
