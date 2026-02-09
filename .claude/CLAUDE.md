# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
Notionライクなタスク管理 + 環境音ミキサー + ポモドーロタイマーを組み合わせた没入型個人タスク管理アプリ（Sonic Flow）

---

## 開発コマンド

### Frontend (React 19 + Vite + TypeScript)
```bash
cd frontend && npm run dev          # 開発サーバー (port 5173)
cd frontend && npm run build        # tsc -b && vite build
cd frontend && npm run lint         # ESLint
```

### Backend (Spring Boot 3.4.2 + Java 23)
```bash
cd backend && ./gradlew bootRun     # 開発サーバー (port 8080)
cd backend && ./gradlew test        # JUnit テスト
cd backend && ./gradlew build       # ビルド
```

両方同時に起動が必要（CORS: localhost:5173 → localhost:8080）

Viteが`/api`リクエストをバックエンド(8080)にプロキシするため、フロントエンドからは相対パス(`/api/...`)でアクセス可能。

### H2 データベースコンソール
```
http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:./data/sonicflow
Username: sa / Password: (空)
```

---

## アーキテクチャ

### 現在のデータ永続化（重要）
**タスクツリー・タイマー・サウンドはバックエンドAPI接続済み**。楽観的更新パターン（localStorage即時反映 → 500msデバウンスで非同期PUT）。
- タスクツリー: `localStorage("sonic-flow-task-tree")` + バックエンドAPI同期
- タイマー設定: `localStorage` + バックエンドAPI同期（work/break/longBreak/sessionsBeforeLongBreak）
- タイマーセッション: バックエンドAPI記録（start→POST、pause/reset/完了→PUT）
- サウンド設定: `localStorage("sonic-flow-sound-mixer")` + バックエンドAPI同期
- テーマ設定: `localStorage`経由（バックエンド未接続）

Phase 7で**楽観的更新パターン**を導入済み: UI→localStorage即時反映→バックエンドへ500msデバウンス非同期同期。バックエンド不可用時はlocalStorageフォールバック。

✅ **`ddl-auto=update`**: DBスキーマは永続化済み。バックエンド再起動でデータは保持される。

### フロントエンド構成

**Context Provider スタック** (`main.tsx`):
```
ThemeProvider → TaskTreeProvider → TimerProvider → App
```

**ルーティング**: React Routerなし。`App.tsx`が`activeSection`状態で5セクション（tasks/session/calendar/analytics/settings）を切り替え。

**レイアウト構成** (3カラム):
```
App (状態オーケストレーター)
├── Sidebar (240px固定, ナビゲーション)
├── SubSidebar (リサイズ可能160-400px)
│   └── TaskTree (Inbox + Projects + Completed)
└── MainContent (flex-1)
    └── TaskDetail | WorkScreen | CalendarView | AnalyticsView | Settings
```
WorkScreenはモーダルオーバーレイとしても表示可能（`isTimerModalOpen`）。

**TaskNode データモデル** (`types/taskTree.ts`):
- フラット配列 + `parentId`参照で階層を表現（ネストツリーではない）
- `type`: `'folder' | 'task'` — typeが振る舞いを決定
- フォルダは5階層までネスト可能（`MAX_FOLDER_DEPTH = 5`）、タスクはどこにでも配置可能
- ソフトデリート: `isDeleted`フラグ → Settings画面のゴミ箱から復元可能

**主要フック**:
- `useTaskTree` — タスクツリー全体のCRUD・移動・DnD操作（分割済み: useTaskTreeCRUD/Deletion/Movement）
- `useLocalSoundMixer` — サウンドミキサー状態（UI stub、音声再生は未実装）
- `useTimerContext` / `useTaskTreeContext` — Context消費用の薄いラッパー

**タイマーシステム**:
- `TimerContext`がクライアントサイド`setInterval`でカウントダウン
- `activeTask`（タイマー対象）と`selectedTaskId`（詳細表示対象）は独立
- WORK → BREAK → LONG_BREAK を自動遷移
- モーダルを閉じてもバックグラウンドで継続
- `TaskTreeNode`にインラインで残り時間+ミニプログレスバーを表示

**ドラッグ&ドロップ**: `@dnd-kit`使用。`moveNode`（並び替え）と`moveNodeInto`（階層移動）は別操作。循環参照防止あり。

**リッチテキスト**: TipTap (`@tiptap/react`) でタスクメモ編集（MemoEditor）。`React.lazy`で遅延ロード（バンドル57%削減）。

**localStorage キー** (`constants/storageKeys.ts`):
`sonic-flow-task-tree`, `sonic-flow-work-duration`, `sonic-flow-break-duration`, `sonic-flow-long-break-duration`, `sonic-flow-sessions-before-long-break`, `sonic-flow-sound-mixer`, `sonic-flow-theme`, `sonic-flow-left-sidebar-open`, `sonic-flow-right-sidebar-open`, `sonic-flow-right-sidebar-width`, `sonic-flow-notifications-enabled`

### バックエンド構成

**パッケージ**: `com.sonicflow.{controller,service,repository,entity,config}`

**エンティティ**: Task, TimerSession, TimerSettings（シングルトン）, SoundSettings, SoundPreset
- JPA関連なし（TimerSession.taskIdは素のLong、ForeignKeyではない）
- `@PrePersist`でタイムスタンプ自動設定

**API**:
- Tasks: `GET /api/tasks/tree`, `PUT /api/tasks/tree`(一括同期), `POST /api/tasks`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}/soft`, `POST /api/tasks/{id}/restore`, `DELETE /api/tasks/{id}`
- Timer: `/api/timer-sessions`, `/api/timer-settings`
- Sound: `/api/sound-settings`, `/api/sound-presets`
- AI: `POST /api/ai/advice`, `GET/PUT /api/ai/settings` — Gemini API (`SONICFLOW_AI_API_KEY`環境変数必須)
- Migration: `POST /api/migrate/tasks` (localStorage→DB一括インポート)

**IDはString型**: フロントエンドの`"task-xxx"`/`"folder-xxx"`形式に統一済み（Phase 7）。

---

## コーディング規約

| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TaskList.tsx` |
| フック | camelCase + use接頭辞 | `useTasks.ts` |
| 変数・関数 | camelCase | `taskList`, `fetchTasks` |
| 定数 | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Java クラス | PascalCase | `TaskController.java` |

- Frontend: ESLint設定に従う
- Backend: Google Java Style Guide準拠
- コメントは必要最小限

---

## コミット規約

```
<type>: <subject>
```
type: `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`

---

## 作業時の注意点

- **README.md更新必須**: コード変更時は開発ジャーナルセクションにエントリ追加（降順）
- **音源ファイル**: リポジトリにコミット禁止（`public/sounds/`は`.gitignore`対象）
- **AIキー**: フロントエンドに直接記載禁止、バックエンド経由のみ
- **CORS**: `WebConfig.java`で`localhost:5173`のみ許可（本番時は要変更）

---

## ドキュメント体系

| ディレクトリ | 用途 |
|------------|------|
| `.claude/current_plans/` | 進行中の実装プラン |
| `.claude/feature_plans/` | 将来の機能仕様ストック |
| `.claude/archive/` | 完了済みプラン |
| `.claude/docs/Application_Overview.md` | 仕様書 |
| `.claude/docs/adr/` | アーキテクチャ決定記録 |
| `TODO.md` | ロードマップ |
| `CHANGELOG.md` | 完了タスク履歴 |

ライフサイクル: `feature_plans/` → `current_plans/` → `archive/`

**プラン完了時の手順**:
1. プランファイル内の Status を `COMPLETED` に更新
2. `current_plans/` から `archive/` へファイルを移動
3. `CHANGELOG.md` に完了内容を追記
