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
- **ノイズミキサー**: 6種の環境音UI（Rain, Thunder, Wind, Ocean, Birds, Fire）※音声再生は開発中
- **AIコーチング**: 開発予定
- **外観設定**: ダークモード/ライトモード切替、フォントサイズ設定（S/M/L）
- **Settings画面**: 外観設定、ゴミ箱（削除タスクの復元・完全削除）

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
