# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
Notionライクなタスク管理 + 環境音ミキサー + ポモドーロタイマーを組み合わせた没入型個人タスク管理デスクトップアプリ（Sonic Flow）。Electron + SQLite でスタンドアロン動作（バックエンドサーバー不要）。

---

## 開発コマンド

### 起動（Electron + Vite同時起動）
```bash
npm run dev     # tsc → concurrently: Vite(5173) + tsc --watch + Electron
npm run build   # Frontend + Electron ビルド
npm run start   # ビルド後にElectron起動
```

### Frontend単体
```bash
cd frontend && npm run dev          # Vite開発サーバー (port 5173)
cd frontend && npm run build        # tsc -b && vite build
cd frontend && npm run lint         # ESLint
cd frontend && npm run test         # Vitest（単発実行）
cd frontend && npm run test:watch   # Vitest（ウォッチモード）
```

### Electron単体
```bash
cd electron && npx tsc              # 一回コンパイル
cd electron && npx tsc --watch      # ウォッチモード
```

### パッケージング
```bash
npm run dist        # electron-builder
npm run dist:mac    # macOS向け
npm run dist:win    # Windows向け
```

### ネイティブモジュール再ビルド
```bash
npx electron-rebuild -f -w better-sqlite3
```

---

## アーキテクチャ

### 全体構成

```
Renderer (React 19 + Vite)
  ↓ window.electronAPI.invoke(channel, ...args)
Preload (contextBridge, チャンネルホワイトリスト)
  ↓ ipcRenderer.invoke
Main Process (Electron 35)
  ↓ ipcMain.handle
Repository層 (better-sqlite3 → userData/sonic-flow.db)
```

セキュリティ: `contextIsolation=true`, `nodeIntegration=false`, `preload.ts`でチャンネルホワイトリスト制御。

### データ永続化
**SQLite (better-sqlite3)** でローカルファイルに永続化。DBファイル: `userData/sonic-flow.db`（WALモード）。

テーブル: tasks, timer_settings, timer_sessions, sound_settings, sound_presets, memos, ai_settings, tags, task_tags, task_templates, custom_sounds

**localStorage は UI状態のみ**（6キー、`constants/storageKeys.ts`）: theme, font-size, sidebar幅, 通知ON/OFF, 左右サイドバー開閉。

### DataService 抽象化レイヤー（重要）
フロントエンドは `DataService` インターフェース経由でデータアクセス。直接IPCを呼ばない。

```
frontend/src/services/
├── DataService.ts          # インターフェース定義（全ドメインの操作）
├── ElectronDataService.ts  # IPC実装（window.electronAPI.invoke）
├── dataServiceFactory.ts   # シングルトンファクトリ
└── index.ts                # getDataService() エクスポート
```

各Context/hookは `getDataService()` 経由でデータ操作を行う。

### IPC チャンネル一覧
`preload.ts` の `ALLOWED_CHANNELS` で許可制御。プレフィックス規則:
- `db:tasks:*` / `db:timer:*` / `db:sound:*` / `db:memo:*` — DB CRUD
- `db:customSound:*` / `db:tags:*` / `db:templates:*` — DB CRUD
- `ai:*` — Gemini API呼び出し（メインプロセス経由）
- `data:export` / `data:import` — JSON一括入出力
- `app:migrateFromLocalStorage` — 初回マイグレーション

### Electron メインプロセス構成
```
electron/
├── main.ts              # エントリポイント（BrowserWindow作成、dev/prod分岐）
├── preload.ts           # contextBridge + チャンネルホワイトリスト
├── database/
│   ├── db.ts            # better-sqlite3 シングルトン初期化
│   ├── migrations.ts    # テーブルスキーマ定義
│   └── *Repository.ts   # 8つのリポジトリ（task/timer/sound/memo/ai/tag/template/customSound）
├── ipc/
│   ├── registerAll.ts   # 全ハンドラ一括登録（個別try/catch付き）
│   └── *Handlers.ts     # ドメイン別IPCハンドラ（10ファイル）
└── services/
    ├── aiService.ts         # Gemini API呼び出し
    └── safeStorageService.ts  # APIキー安全保存
```

### フロントエンド構成

**Context Provider スタック** (`main.tsx`):
```
StrictMode → ErrorBoundary → ThemeProvider → TaskTreeProvider → MemoProvider → TimerProvider → AudioProvider → TagProvider → App
```

**ルーティング**: React Routerなし。`App.tsx`が`activeSection`状態で7セクション（tasks/memo/session/calendar/analytics/settings/tips）を切り替え。

**レイアウト構成** (3カラム):
```
App (状態オーケストレーター)
├── Sidebar (240px固定, ナビゲーション)
├── SubSidebar (リサイズ可能160-400px)
│   └── TaskTree (Inbox + Projects + Completed)
└── MainContent (flex-1)
    └── TaskDetail | MemoView | WorkScreen | CalendarView | AnalyticsView | Settings | Tips
```
WorkScreenはモーダルオーバーレイとしても表示可能（`isTimerModalOpen`）。

**TaskNode データモデル** (`types/taskTree.ts`):
- フラット配列 + `parentId`参照で階層を表現（ネストツリーではない）
- `type`: `'folder' | 'task'` — typeが振る舞いを決定
- フォルダは5階層までネスト可能（`MAX_FOLDER_DEPTH = 5`）、タスクはどこにでも配置可能
- ソフトデリート: `isDeleted`フラグ → Settings画面のゴミ箱から復元可能

**主要フック**:
- `useTaskTreeAPI` — タスクツリーCRUD（IPC経由SQLite永続化）、内部で分割: `useTaskTreeCRUD` / `useTaskTreeDeletion` / `useTaskTreeMovement`
- `useLocalSoundMixer` — サウンドミキサー状態管理（ボリューム、有効/無効）
- `useAudioEngine` — Web Audio APIによるリアルタイム再生・フェードイン/アウト
- `useCustomSounds` — カスタムサウンドメタデータ + IPC blob管理
- `useTimerContext` / `useTaskTreeContext` / `useAudioContext` / `useMemoContext` / `useTagContext` — Context消費用ラッパー

**タイマーシステム**:
- `TimerContext`がクライアントサイド`setInterval`でカウントダウン
- `activeTask`（タイマー対象）と`selectedTaskId`（詳細表示対象）は独立
- WORK → BREAK → LONG_BREAK を自動遷移
- モーダルを閉じてもバックグラウンドで継続

**ドラッグ&ドロップ**: `@dnd-kit`使用。`moveNode`（並び替え）と`moveNodeInto`（階層移動）は別操作。循環参照防止あり。

**リッチテキスト**: TipTap (`@tiptap/react`) でタスクメモ編集（MemoEditor）。`React.lazy`で遅延ロード。

**IDはString型**: `"task-xxx"`/`"folder-xxx"`形式。

---

## コーディング規約

| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TaskList.tsx` |
| フック | camelCase + use接頭辞 | `useTasks.ts` |
| 変数・関数 | camelCase | `taskList`, `fetchTasks` |
| 定数 | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Context Value型 | PascalCase | `AudioContextValue.ts` |

- Frontend: ESLint設定に従う
- コメントは必要最小限

---

## コミット規約

```
<type>: <subject>
```
type: `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`

---

## 作業時の注意点

- **README.md更新必須**: コード変更の作業完了時は必ず以下を実施:
  1. 開発ジャーナルセクションに日付付きエントリを追加（降順、最新が先頭）
  2. 機能追加・削除時は「主な機能」セクションも更新
  3. アーキテクチャ変更時は「技術スタック」「セットアップ」セクションも更新
- **音源ファイル**: リポジトリにコミット禁止（`public/sounds/`は`.gitignore`対象）
- **AIキー**: フロントエンドに直接記載禁止、Electronメインプロセス経由のみ（`safeStorageService`使用）
- **IPC追加時**: `preload.ts`の`ALLOWED_CHANNELS`、`electron/ipc/`のハンドラ、`ElectronDataService.ts`の3箇所を更新

---

## ドキュメント体系

| ディレクトリ | 用途 |
|------------|------|
| `.claude/feature_plans/` | 実装プラン（PLANNED / IN_PROGRESS） |
| `.claude/archive/` | 完了済みプラン |
| `.claude/docs/Application_Overview.md` | 仕様書 |
| `.claude/docs/adr/` | アーキテクチャ決定記録 |
| `TODO.md` | ロードマップ |
| `CHANGELOG.md` | 完了タスク履歴 |

ライフサイクル: `feature_plans/` → `archive/`

**プラン完了時の手順**:
1. プランファイル内の Status を `COMPLETED` に更新
2. `feature_plans/` から `archive/` へファイルを移動
3. `CHANGELOG.md` に完了内容を追記
