# Sonic Flow

## 概要
Notionライクなタスク管理に「環境音ミキサー」と「ポモドーロタイマー」を組み合わせた、没入型個人タスク管理アプリケーション。

### 主な機能
- **タスク管理**: 階層型タスクツリー（フォルダ/サブフォルダ/タスク）、ドラッグ&ドロップ並び替え、ソフトデリート+ゴミ箱
- **プロジェクトナビゲーション**: サブサイドバーでInbox+フォルダ別にタスクを絞り込み表示
- **グローバルタイマー**: 画面遷移してもタイマーが継続するContextベースのポモドーロタイマー
- **集中タイマー**: WORK/BREAK/LONG_BREAK対応、作業時間カスタマイズ（5〜60分、5分刻み）、プログレスバー（ドットインジケータ付き）
- **タイマーモーダル**: タスクのPlayボタンでモーダル表示、閉じてもバックグラウンドでタイマー継続
- **サイドバータイマー表示**: タイマー実行中はサイドバーにタスク名・残り時間・編集ボタンを表示
- **TaskTreeタイマー表示**: 実行中のタスク行に残り時間テキスト+ミニプログレスバーを表示
- **ノイズミキサー**: 6種の環境音（Rain, Thunder, Wind, Ocean, Birds, Fire）、Web Audio APIによるリアルタイム再生・ミキシング
- **AIコーチング**: Gemini API連携、タスク分解/励まし/レビューの3モード
- **外観設定**: ダークモード/ライトモード切替、フォントサイズ設定（S/M/L）
- **デスクトップ通知**: タイマーセッション完了時にブラウザ通知
- **キーボードショートカット**: Space（タイマー）、n（新規タスク）、Escape（モーダル閉じ）、Delete（タスク削除）、Cmd+.（左サイドバー開閉）、Cmd+Shift+.（右サイドバー開閉）、Cmd+,（Settings遷移）、Cmd+1〜5（セクション切替）、↑/↓（タスク移動）、Tab/Shift+Tab（インデント）、r（タイマーリセット）、Cmd+Shift+T（モーダル）、j/k/t/m（カレンダー操作）
- **Settings画面**: 外観設定、通知設定、ゴミ箱（削除タスクの復元・完全削除）
- **Tips画面**: ショートカット一覧、タスク/タイマー/カレンダー/エディタの操作ガイド（5タブ構成）
- **リッチテキストエディタ**: TipTap拡張（Toggle List/Table/Callout/Image）、スラッシュコマンド対応
- **カレンダー**: 月/週表示切替、タスクを日付別に表示、フィルタリング（incomplete/completed）
- **アナリティクス**: 基本統計（総タスク数、完了率、フォルダ数）
- **Backend連携**: localStorage→H2 DB自動マイグレーション、Optimistic Update、オフラインフォールバック

### 技術スタック
- **Frontend**: React 19 (TypeScript) + Vite + Tailwind CSS v4 + @dnd-kit
- **Backend**: Spring Boot 3.4.2 (Java 23) + H2 Database

---

## API エンドポイント

### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | 未完了タスク取得 |
| GET | `/api/tasks/history` | 完了タスク取得 |
| POST | `/api/tasks` | タスク作成 |
| PUT | `/api/tasks/{id}` | タスク更新 |
| DELETE | `/api/tasks/{id}` | タスク削除 |

### Timer (`/api/timer-*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timer-settings` | タイマー設定取得 |
| PUT | `/api/timer-settings` | タイマー設定更新 |
| POST | `/api/timer-sessions` | セッション開始 |
| PUT | `/api/timer-sessions/{id}` | セッション終了 |
| GET | `/api/timer-sessions` | 全セッション取得 |
| GET | `/api/tasks/{taskId}/sessions` | タスク別セッション取得 |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/advice` | AIコーチングアドバイス取得 |

### Sound (`/api/sound-*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sound-settings` | サウンド設定取得 |
| PUT | `/api/sound-settings` | サウンド設定更新 |
| GET | `/api/sound-presets` | プリセット一覧取得 |
| POST | `/api/sound-presets` | プリセット作成 |
| DELETE | `/api/sound-presets/{id}` | プリセット削除 |

---

## 開発ジャーナル

### 2026-02-09 - Timer/Sound API連携 + キーボードショートカット拡張

#### Timer/Sound バックエンドAPI接続
- `ddl-auto` を `create-drop` → `update` に変更（DB永続化）
- `timerClient.ts` / `soundClient.ts` 新規作成（fetch APIベース）
- TimerContext: 楽観的更新パターンでバックエンド同期（設定 + セッション記録）
- break/longBreak/sessionsBeforeLongBreak をハードコードから `useLocalStorage` + API同期に移行
- Sound Mixer: サウンドタイプ別デバウンスPUTでバックエンド同期
- バックエンド不可用時は localStorage フォールバック

#### キーボードショートカット拡張 (Phase 1-4)
- `Cmd+1〜5` — セクション切替（tasks/session/calendar/analytics/settings）
- `↑/↓` — タスクツリー内フォーカス移動
- `→/←` — フォルダ展開/折りたたみ
- `Cmd+Enter` — タスク完了/未完了トグル
- `Tab/Shift+Tab` — タスクインデント/アウトデント
- `r` — タイマーリセット
- `Cmd+Shift+T` — タイマーモーダル開閉
- `j/k` — カレンダー前後移動
- `t` — 今日にジャンプ
- `m` — 月/週表示切替

### 2026-02-09 - Tips画面 + TipTapエディタ拡張 (Plan 008)

#### Tips画面
- LeftSidebarに6つ目のセクション「Tips」追加（Lightbulbアイコン）
- 5タブ構成: Shortcuts / Tasks / Timer / Calendar / Editor
- 全キーボードショートカット一覧、各画面の操作ガイド、スラッシュコマンド一覧を表示

#### TipTapエディタ拡張（4ブロックタイプ追加）
- **Toggle List**: カスタムNode拡張（HTML `<details>`/`<summary>` ベース、開閉可能）
- **Table**: 公式 `@tiptap/extension-table` 系（3×3デフォルト、ヘッダー行付き）
- **Callout**: カスタムNode拡張（💡絵文字 + 背景色付きボックス）
- **Image**: 公式 `@tiptap/extension-image`（URL prompt入力）
- スラッシュコマンドメニューに4コマンド追加、CSSスタイリング追加

### 2026-02-09 - Keyboard Shortcuts 追加

#### 新規ショートカット
- `Cmd+.` — Left Sidebar 開閉トグル（Layout.tsx）
- `Cmd+Shift+.` — Right Sidebar 開閉トグル（Layout.tsx）
- `Cmd+,` — Settings画面に遷移（App.tsx、入力中でも動作）

#### Feature Plan
- `.claude/feature_plans/007-keyboard-shortcuts.md` 作成（セクション切替、タスク操作、タイマー制御、カレンダー操作、コマンドパレットの将来ショートカット提案）

### 2026-02-09 - Calendar Enhancement (Plan 006)

#### フォルダカラーシステム
- フォルダ作成時に10色パステルパレットから自動カラー割当
- タスクは親フォルダのカラーを継承（`resolveTaskColor`）
- バックエンド: Task entity + DTO に `color` カラム追加

#### フォルダタグ
- 親フォルダ階層パスをタグとして表示（例: `Projects/frontend`）
- `FolderTag` コンポーネント（パステルカラーpill/badge）
- TaskDetailHeader + CalendarTaskItem に表示

#### カレンダーからタスク作成
- DayCell hover時に `+` ボタン表示
- クリック → 無題タスク作成（scheduledAt=クリック日付 12:00）→ WorkScreen モーダル即時表示
- `addNode` に `options?: { scheduledAt?: string }` 引数追加

#### Weekly表示 時間軸UI
- Google Calendar風 `WeeklyTimeGrid` コンポーネント新規作成
- 24時間タイムライン + 時刻ラベル + 水平グリッド線
- フォルダカラー付きタスクブロック（`TimeGridTaskBlock`）
- 現在時刻インジケーター（赤い水平線、毎分更新）
- 重複タスクの横並びレイアウト（最大5列）
- 空きスロットクリックで15分刻みスナップ付きタスク作成

#### 新規ファイル
- `frontend/src/constants/folderColors.ts` - カラーパレット
- `frontend/src/constants/timeGrid.ts` - 時間グリッド定数
- `frontend/src/utils/folderColor.ts` - カラー解決ユーティリティ
- `frontend/src/utils/folderTag.ts` - タグパス計算ユーティリティ
- `frontend/src/components/shared/FolderTag.tsx` - フォルダタグbadge
- `frontend/src/components/Calendar/WeeklyTimeGrid.tsx` - 時間軸付き週表示
- `frontend/src/components/Calendar/TimeGridTaskBlock.tsx` - タスクブロック

---

### 2026-02-08 (3) - バグ修正 + Noise Mixer音声再生 + ポリッシュ

#### バグ修正・技術的負債
- **TimerContext stale closure修正**: `advanceSession`のクロージャ問題を`useRef`+`useEffect`パターンで解消
- **TaskNodeContent 300msクリック遅延修正**: ネイティブ`onClick`/`onDoubleClick`に置き換え
- **lint error全件修正**: React Compiler lint error 0件達成
- **バンドルサイズ57%削減**: `MemoEditor`を`React.lazy()`で遅延読み込み（671KB→298KB）

#### Noise Mixer 音声再生
- `useAudioEngine` hook新規作成（Web Audio API, ループ再生, フェードイン/アウト）
- `WorkScreen`で`useLocalSoundMixer`状態をオーディオエンジンに自動連携
- タブ非表示時自動ミュート、アンマウント時リソース解放

#### ポリッシュ
- ブラウザ通知（`Notification API`）+ Settings画面にトグル追加
- キーボードショートカット4種（Space/n/Escape/Delete）

#### 新規ファイル
- `frontend/src/hooks/useAudioEngine.ts` — Web Audio APIラッパー
- `frontend/src/components/Settings/NotificationSettings.tsx` — 通知設定UI

#### 変更ファイル
- `context/TimerContext.tsx` — stale closure修正 + 通知ロジック追加
- `components/TaskTree/TaskNodeContent.tsx` — クリックハンドラ簡素化
- `components/TaskDetail/TaskDetail.tsx` — MemoEditor遅延読み込み
- `components/WorkScreen/WorkScreen.tsx` — `useAudioEngine`統合
- `components/WorkScreen/TaskSelector.tsx` — lint fix（unused `nodes`）
- `components/Settings/Settings.tsx` — NotificationSettings追加
- `constants/sounds.ts` — `file`フィールド追加
- `constants/storageKeys.ts` — `NOTIFICATIONS_ENABLED`追加
- `tsconfig.app.json` — testディレクトリ除外
- `App.tsx` — キーボードショートカットハンドラ追加

### 2026-02-08 (2) - AI Coach 429エラー修正 & モデル移行
- **モデル変更**: `gemini-2.0-flash` → `gemini-2.5-flash-lite`（旧モデル廃止対応）
- **DB自動マイグレーション**: `@PostConstruct migrateDeprecatedModel()` で既存DB内の旧モデル名を自動更新
- **デバッグログ追加**: `RestClientResponseException` 発生時にHTTPステータス・モデル名・レスポンスボディをログ出力
- **エラーメッセージ改善**: Gemini APIのエラー詳細（`message`フィールド）をユーザー向けメッセージに付加
- **taskContentトランケート**: `buildPrompt()` で500文字上限を設定し、不要なトークン消費を防止
- 変更ファイル: `AIService.java`, `AIConfig.java`, `AISettings.java`, `application.properties`, `AISettings.tsx`

### 2026-02-08 - AI Coaching 実装 (Gemini API)
- Backend: `AIConfig` + `AIService` + `AIController` で Gemini API (gemini-2.5-flash-lite) 連携
- Frontend: `useAICoach` hook + `AICoachPanel` コンポーネントを TaskDetail に統合
- 3種のリクエストタイプ: breakdown（ステップ分解）/ encouragement（励まし）/ review（レビュー）
- Vite proxy (`/api` → `localhost:8080`) 追加

### 2026-02-07 (3) - Phase 2 重複排除 (D1-D4)

#### 変更内容
- **D2: localStorage定数集約**: 全6キーを`constants/storageKeys.ts`に集約、各ファイルのハードコード文字列を定数参照に置換
- **D3: 汎用`useLocalStorage`フック**: `hooks/useLocalStorage.ts`を新規作成し、ThemeContext / TimerContext / Layout / useLocalSoundMixer の手動read/write処理を統一
- **D1: DurationPicker統一**: DurationSelector.tsx と TaskDetailHeader.tsx の完全重複コード（PRESETS定数、formatDuration関数、±ステップロジック、プリセットグリッド）を`components/shared/DurationPicker.tsx`に統合
- **D4: コンポーネント外定数の整理**: D1で解決済み（PRESETS移動）、SlashCommandMenuのCOMMANDS配列は現状維持

#### 新規ファイル
- `frontend/src/constants/storageKeys.ts` — localStorage キー定数
- `frontend/src/hooks/useLocalStorage.ts` — 汎用localStorage永続化フック
- `frontend/src/components/shared/DurationPicker.tsx` — 共通Duration Pickerコンポーネント
- `frontend/src/utils/duration.ts` — formatDuration ユーティリティ関数

#### 変更ファイル
- `hooks/useTaskTree.ts` — STORAGE_KEYS定数参照に置換
- `hooks/useLocalSoundMixer.ts` — STORAGE_KEYS + useLocalStorageで書き換え
- `context/TimerContext.tsx` — STORAGE_KEYS + useLocalStorageで書き換え
- `context/ThemeContext.tsx` — STORAGE_KEYS + useLocalStorageで書き換え
- `components/Layout/Layout.tsx` — STORAGE_KEYS + useLocalStorageで書き換え
- `components/WorkScreen/DurationSelector.tsx` — DurationPickerラッパーに簡素化
- `components/TaskDetail/TaskDetailHeader.tsx` — DurationPicker + formatDuration使用に統合

### 2026-02-07 (2) - フロントエンド コード品質分析 & リファクタリングプラン作成

#### 変更内容
- **包括的コード品質調査**: フロントエンド49ファイル・約2,440行を分析し、バグ温床6件・重複4件・効率改善6件を特定
- **Phase 1 バグ修正プラン**: TimerContext config未メモ化、MemoEditor stale closure、TaskTreeNode click競合、Error Boundary未実装の4件を具体的なBefore/Afterコード例付きで文書化
- **Phase 2-4 将来対応概要**: 重複排除、コンポーネント分割、パフォーマンス最適化の方針を記載
- **API移行設計指針**: Repository Patternによるデータアクセス抽象化、非同期化への備えを記載

#### 新規ファイル
- `.claude/current_plans/002-frontend-refactoring.md` — リファクタリングプランドキュメント

### 2026-02-07 - ドキュメント構造の再編成

#### 変更内容
- **ドキュメント分類体系を導入**: `.claude/` 配下に `current_plans/`（進行中）、`feature_plans/`（将来予定）、`archive/`（完了済み）を新設
- **ライフサイクル**: `feature_plans/` → `current_plans/` → `archive/` のフローで管理
- **TODO.md**: 完了タスクを削除し、簡潔なロードマップに書き換え。各項目から `feature_plans/` へリンク
- **CHANGELOG.md**: 新規作成。Phase 1/2 の全完了タスク履歴を集約
- **既存ドキュメント移動**:
  - `docs/documentation-update-plan.md` → `current_plans/001-documentation-sync.md`
  - `docs/UI_Implementation_Plan.md` → `archive/001-ui-implementation-phase2.md`
  - `docs/code-integrity-report.md` → `archive/002-code-integrity-review.md`
- **feature_plans 新規作成**: AI Coaching / Noise Mixer音声再生 / Polish & Enhancement / Backend再統合

### 2026-02-06 (2) - UI拡張: グローバルタイマー + サブサイドバー

#### 実装済み
- **TimerContext**: タイマーをReact Contextに昇格、全コンポーネントから共有可能に
  - `activeTask`状態（タイマーと紐づくタスク情報）
  - `startForTask(id, title)` / `clearTask()` / `setWorkDurationMinutes()`
  - 作業時間をlocalStorageに永続化（5〜60分、デフォルト25分）
- **モーダル化**: WorkScreenのフルスクリーンオーバーレイを中央配置モーダルに変更
  - バックドロップクリック / ESCキーで閉じる（タイマーはバックグラウンドで継続）
- **サイドバータイマー表示**: Session下にタスク名・残り時間・Pencil編集ボタンを表示
- **TaskTreeタイマー表示**: アクティブタスク行に残り時間テキスト + ミニプログレスバー + Pauseアイコン
- **SubSidebar**: Inbox（ルートタスク）+ フォルダ一覧でタスク絞り込み、新規フォルダ作成UI
- **DurationSelector**: +/-ボタン（5分刻み）+ プリセット（15/25/30/45/60分）、実行中はdisabled
- **プログレスバードット**: 現在位置に12pxのドットインジケータ、1秒スムーズトランジション

#### 新規ファイル
- `frontend/src/context/timerContextValue.ts` — Timer Context型定義
- `frontend/src/context/TimerContext.tsx` — TimerProvider
- `frontend/src/hooks/useTimerContext.ts` — Consumerフック
- `frontend/src/components/Layout/SubSidebar.tsx` — プロジェクトナビゲーション
- `frontend/src/components/WorkScreen/DurationSelector.tsx` — タイマー時間選択UI

#### 変更ファイル
- `main.tsx` — TimerProvider追加
- `App.tsx` — isTimerModalOpen + selectedFolderId状態、フォルダナビ連携
- `WorkScreen.tsx` — Context化、モーダルUI、DurationSelector追加
- `TimerProgressBar.tsx` — ドットインジケータ追加
- `Sidebar.tsx` — タイマー表示+編集ボタン
- `Layout.tsx` — SubSidebar条件レンダリング
- `TaskTreeNode.tsx` — タイマー表示+ミニプログレスバー
- `TaskTree.tsx` — selectedFolderIdでフィルタリング

### 2026-02-06 - 実装状況まとめ

#### 実装済み
- **Backend全体**: Task/Timer/Sound の3ドメイン（Controller/Service/Repository/Entity）、CORS設定、H2 DB
- **TaskTree**: 階層型タスク管理（フォルダ/サブフォルダ/タスク）、@dnd-kitによるDnD並び替え、ソフトデリート
- **WorkScreen**: ポモドーロタイマー + サウンドミキサー統合画面
- **FocusTimer**: WORK/BREAK/LONG_BREAK、セッション数カウント、プログレスバー、設定カスタマイズ
- **NoiseMixer**: 6種の環境音選択UI + 音量スライダー
- **Settings**: ダークモード/ライトモード、フォントサイズ（S/M/L）、ゴミ箱

#### 未実装
- AIコーチング（バックエンドエンドポイント未作成）
- 音声再生（Web Audio API連携）
- レスポンシブデザイン、キーボードショートカット、通知機能

### 2025-02-06 - プロジェクト初期化

#### Completed
- プロジェクト仕様書の作成 (Application_Overview.md)
- 開発ドキュメント構成の策定
  - CLAUDE.md: 開発ガイド・作業指示
  - MEMORY.md: 技術仕様（API/データモデル）
  - README.md: 開発ジャーナル
  - TODO.md: 実装タスクリスト
  - ADR: アーキテクチャ決定記録

#### Learnings
- Claude Code用のドキュメント構成
  - CLAUDE.md: プロジェクトルートに配置、作業指示・コーディング規約
  - MEMORY.md: ~/.claude/projects/配下、セッション間で保持される技術仕様
- 日本語（概要）+ 英語（技術仕様）の二言語運用が効果的

---

## セットアップ

### 前提条件
- Node.js 18+
- Java 23
- npm または yarn

### インストール
```bash
# フロントエンド
cd frontend
npm install

# バックエンド
cd backend
./gradlew build
```

### 起動
```bash
# バックエンド (port 8080)
cd backend && ./gradlew bootRun

# フロントエンド (port 5173)
cd frontend && npm run dev
```

---

## ドキュメント
- [開発ガイド](.claude/CLAUDE.md)
- [仕様書](.claude/docs/Application_Overview.md)
- [アーキテクチャ決定記録](.claude/docs/adr/)
- [ロードマップ](TODO.md)
- [完了履歴](CHANGELOG.md)
- [進行中プラン](.claude/current_plans/)
- [機能仕様ストック](.claude/feature_plans/)
