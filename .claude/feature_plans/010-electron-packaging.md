# 010: Electron化 + バックエンド廃止 + 機能拡張

> Status: PLANNED
> Created: 2026-02-10

## Context

Sonic Flowは全9フェーズの機能実装が完了したMVP。次のステップとして：
- **Spring Bootバックエンドを廃止**し、完全スタンドアロンのデスクトップアプリ化
- **Electron**でmacOS + Windowsパッケージング
- **SQLite**（better-sqlite3）でデータ永続化（localStorage + H2 DBを置換）
- AI機能はElectronメインプロセス経由で維持（safeStorageでAPIキー保護）
- 新機能（タグ・フィルター、テンプレート、エクスポート/インポート）追加

---

## 実装フェーズ（優先度順）

### Phase 0: Electron Shell Foundation
**目的**: 既存Reactアプリをそのまま Electronで動かす（React側変更なし）

**新規ファイル**:
```
electron/
  main.ts              # メインプロセス（BrowserWindow作成）
  preload.ts           # contextBridge IPC公開（初期は空）
  tsconfig.json        # Electron用TypeScript設定
package.json           # ルート（Electron + frontend統合ビルド）
electron-builder.yml   # macOS .dmg + Windows .nsis 設定
```

**変更ファイル**:
- `frontend/vite.config.ts` — `base: './'` 追加（file://プロトコル対応）

**キーポイント**:
- dev: `concurrently` で Vite dev server + Electron起動（`wait-on`で5173待機）
- prod: `frontend/dist/index.html`を`file://`で読み込み
- `nodeIntegration: false`, `contextIsolation: true`（セキュリティ）
- 依存: `electron`, `electron-builder`, `concurrently`, `wait-on`

**検証**: Electronウィンドウでアプリ表示、既存バックエンド接続で全機能動作

---

### Phase 1: DataService抽象レイヤー
**目的**: React↔データ層の抽象化。HTTP/IPC切り替えをランタイム判定

**新規ファイル**:
```
frontend/src/services/
  DataService.ts           # インターフェース定義
  HttpDataService.ts       # 既存HTTP API委譲（レガシー互換）
  ElectronDataService.ts   # IPC invoke委譲
  dataServiceFactory.ts    # window.electronAPI検出で自動切替
  index.ts                 # バレルエクスポート
frontend/src/types/
  electron.d.ts            # window.electronAPI型定義
```

**変更ファイル**:
- `frontend/src/hooks/useTaskTreeAPI.ts` — `import * as api from '../api/taskClient'` → DataService経由
- `frontend/src/hooks/useLocalSoundMixer.ts` — soundApi → DataService
- `frontend/src/context/TimerContext.tsx` — timerApi → DataService
- `frontend/src/hooks/useMemos.ts` — api → DataService
- `frontend/src/hooks/useAICoach.ts` — fetchAIAdvice → DataService
- `frontend/src/components/Settings/AISettings.tsx` — AI設定API → DataService

**既存利用**: `api/taskClient.ts`のDTO変換ロジック（toDTO/fromDTO）は`HttpDataService`に吸収

**検証**: Webモード（Vite + backend）で全機能が従来通り動作すること

---

### Phase 2: SQLiteデータベース層
**目的**: Electronメインプロセスにbetter-sqlite3 + IPCハンドラー構築

**新規ファイル**:
```
electron/database/
  db.ts                    # SQLite接続シングルトン（WALモード, userData/sonic-flow.db）
  migrations.ts            # バージョン管理されたスキーマ作成
  taskRepository.ts        # Task CRUD（prepared statements）
  timerRepository.ts       # TimerSession/Settings操作
  soundRepository.ts       # Sound設定/プリセット操作
  memoRepository.ts        # Memo操作
  aiRepository.ts          # AI設定操作
  settingsRepository.ts    # アプリ設定（key-value）
electron/ipc/
  taskHandlers.ts          # db:tasks:* ハンドラー
  timerHandlers.ts         # db:timer:* ハンドラー
  soundHandlers.ts         # db:sound:* ハンドラー
  memoHandlers.ts          # db:memo:* ハンドラー
  aiHandlers.ts            # ai:* ハンドラー
  appHandlers.ts           # app:* ハンドラー
  registerAll.ts           # 一括登録
```

**SQLiteスキーマ（v1）**:
```sql
-- Tasks (既存H2 Taskエンティティ互換)
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK(type IN ('folder', 'task')),
  parent_id     TEXT,
  sort_order    INTEGER DEFAULT 0,
  status        TEXT CHECK(status IN ('TODO', 'DONE')),
  is_expanded   INTEGER,
  is_deleted    INTEGER NOT NULL DEFAULT 0,
  deleted_at    TEXT,
  created_at    TEXT,
  completed_at  TEXT,
  scheduled_at  TEXT,
  content       TEXT,
  work_duration_minutes INTEGER,
  color         TEXT
);

-- Timer Sessions
CREATE TABLE IF NOT EXISTS timer_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id       TEXT,
  session_type  TEXT NOT NULL CHECK(session_type IN ('WORK', 'BREAK', 'LONG_BREAK')),
  started_at    TEXT NOT NULL,
  completed_at  TEXT,
  duration      INTEGER,
  completed     INTEGER NOT NULL DEFAULT 0
);

-- Timer Settings (シングルトン)
CREATE TABLE IF NOT EXISTS timer_settings (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  work_duration               INTEGER NOT NULL DEFAULT 25,
  break_duration              INTEGER NOT NULL DEFAULT 5,
  long_break_duration         INTEGER NOT NULL DEFAULT 15,
  sessions_before_long_break  INTEGER NOT NULL DEFAULT 4,
  updated_at                  TEXT NOT NULL
);

-- Sound Settings
CREATE TABLE IF NOT EXISTS sound_settings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sound_type  TEXT NOT NULL UNIQUE,
  volume      INTEGER NOT NULL DEFAULT 50,
  enabled     INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL
);

-- Sound Presets
CREATE TABLE IF NOT EXISTS sound_presets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  settings_json TEXT,
  created_at    TEXT NOT NULL
);

-- Memos
CREATE TABLE IF NOT EXISTS memos (
  id          TEXT PRIMARY KEY,
  date        TEXT UNIQUE NOT NULL,
  content     TEXT,
  created_at  TEXT,
  updated_at  TEXT
);

-- AI Settings (シングルトン)
CREATE TABLE IF NOT EXISTS ai_settings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key     TEXT,
  model       TEXT NOT NULL DEFAULT 'gemini-2.5-flash-lite',
  updated_at  TEXT NOT NULL
);

-- App Settings (localStorage代替)
CREATE TABLE IF NOT EXISTS app_settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_task ON timer_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_started ON timer_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_memos_date ON memos(date);
```

**IPCチャネル一覧**（全て `ipcRenderer.invoke` / `ipcMain.handle` パターン）:
| チャネル | Payload → Return |
|----------|-----------------|
| `db:tasks:fetchTree` | void → TaskNode[] |
| `db:tasks:create` | TaskNode → TaskNode |
| `db:tasks:update` | {id, updates} → TaskNode |
| `db:tasks:syncTree` | TaskNode[] → void |
| `db:tasks:softDelete` | string → void |
| `db:tasks:restore` | string → void |
| `db:tasks:permanentDelete` | string → void |
| `db:timer:fetchSettings` | void → TimerSettings |
| `db:timer:updateSettings` | Partial\<TimerSettings\> → TimerSettings |
| `db:timer:startSession` | {sessionType, taskId?} → TimerSession |
| `db:timer:endSession` | {id, duration, completed} → TimerSession |
| `db:timer:fetchSessions` | void → TimerSession[] |
| `db:sound:fetchSettings` | void → SoundSettings[] |
| `db:sound:updateSetting` | {soundType, volume, enabled} → SoundSettings |
| `db:memo:fetchAll` | void → MemoNode[] |
| `db:memo:fetchByDate` | string → MemoNode \| null |
| `db:memo:upsert` | {date, content} → MemoNode |
| `db:memo:delete` | string → void |

**データ移行**: 初回起動時、SQLiteが空ならrendererからlocalStorage 15キーを取得 → SQLiteインポート → localStorageクリア

**変更ファイル**:
- `electron/main.ts` — DB初期化 + `registerAllHandlers(db)` 呼び出し
- `electron/preload.ts` — 全チャネルのinvokeラッパー公開

**検証**: タスク作成→アプリ再起動→データ永続確認

---

### Phase 3: AIサービス移行
**目的**: Gemini API呼び出しをElectronメインプロセスに移行

**新規ファイル**:
```
electron/services/
  aiService.ts             # Gemini API呼び出し（Node.js fetch）
  safeStorageService.ts    # electron.safeStorage でAPIキー暗号化
```

**移植元**: `backend/src/main/java/com/sonicflow/service/AIService.java`
- 3種のプロンプトテンプレート（breakdown / encouragement / review）
- APIキー解決順序: SQLite ai_settings → `SONICFLOW_AI_API_KEY` 環境変数 → エラー
- エラーハンドリング（レート制限、無効キー、APIエラー）
- APIキーはsafeStorageで暗号化して保存、取り出し時に復号

**変更ファイル**:
- `electron/ipc/aiHandlers.ts` — 実ハンドラー接続

**検証**: AIアドバイス取得E2Eテスト

---

### Phase 4: バックエンド廃止 + カスタムサウンド移行
**目的**: Spring Bootバックエンド完全削除、データフロー簡素化

**削除**:
- `backend/` ディレクトリ全体
- `frontend/vite.config.ts` の `/api` プロキシ設定
- `frontend/src/services/HttpDataService.ts`
- `frontend/src/hooks/useMigration.ts`
- `frontend/src/api/` ディレクトリ全体（HTTP クライアント不要）

**カスタムサウンド移行**:
- IndexedDB blob → Electronファイルシステム(`userData/custom-sounds/`)に保存
- 新規: `electron/database/customSoundRepository.ts`, `electron/ipc/customSoundHandlers.ts`
- 変更: `frontend/src/hooks/useCustomSounds.ts` — idb-keyval → DataService IPC

**データフロー簡素化**（localStorage キャッシュ層廃止）:
- `useTaskTreeAPI.ts` — `loadLocalNodes`/`saveLocalNodes`削除、debounce削除、`isBackendAvailable`削除
- `useLocalSoundMixer.ts`, `useMemos.ts`, `TimerContext.tsx` — 同様の簡素化
- 新フロー: React state → DataService.method() → IPC → SQLite（直結、~1ms）

**検証**: HTTP呼び出しゼロ確認（DevTools Networkタブ）、全機能E2E動作

---

### Phase 5: ElectronネイティブUX
**目的**: デスクトップアプリとしてのUX向上

**新規ファイル**:
```
electron/
  menu.ts              # ネイティブメニュー
  tray.ts              # システムトレイ（タイマー状態）
  windowState.ts       # ウィンドウ位置・サイズ永続化
```

**メニュー構成**:
- File: New Task, New Folder, Export, Import, Quit
- Edit: Undo, Redo, Cut, Copy, Paste, Select All
- View: Toggle Sidebars, Timer Modal, Zoom
- Window: Minimize, Close
- Help: About, Tips

**変更ファイル**:
- `frontend/src/App.tsx` — macOSトラフィックライト配置、カスタムタイトルバー
- `frontend/src/index.css` — `-webkit-app-region: drag` スタイル

**検証**: メニュー動作、ウィンドウ状態復元、トレイ更新

---

### Phase 6: 新機能

#### 6a: タグ & フィルター
**SQLite追加（migration v2）**:
```sql
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT
);
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**新規**: `tag.ts`型, `TagBadge.tsx`, `TagFilter.tsx`, `TagEditor.tsx`
**変更**: `TaskTreeNode.tsx`（バッジ）, `CalendarTaskItem.tsx`（バッジ）, `taskTree.ts`（tags?追加）

#### 6b: タスクテンプレート
**SQLite追加**: `task_templates` — id, name, nodes_json, created_at
**新規**: `template.ts`型, `TemplateDialog.tsx`
**変更**: `TaskNodeContextMenu.tsx`（「テンプレートとして保存」）

#### 6c: エクスポート/インポート
**IPC**: `data:export`（保存ダイアログ）, `data:import`（開くダイアログ）
**フォーマット**: JSON（全テーブル + バージョン番号）
**新規**: `DataManagement.tsx`
**変更**: `Settings.tsx`にデータ管理セクション追加

**検証**: タグCRUD + フィルター、テンプレート保存→適用、エクスポート→インポート往復

---

### Phase 7: 本番環境対応
- **自動アップデート**: `electron-updater` + GitHub Releases
- **エラーログ**: `userData/logs/` にエラー記録
- **コード署名**: macOS notarization + Windows署名
- **パフォーマンス**: SQLiteクエリベンチマーク（10,000タスク）

---

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| better-sqlite3ネイティブモジュールリビルド | High | `@electron/rebuild` + バージョンピン |
| localStorage→SQLite移行時データ損失 | Critical | 書込確認後にクリア（追加的移行） |
| React側import大量変更 | Medium | DataServiceバレルで一括import |
| IndexedDB→ファイルシステムのblob移行 | Medium | 初回起動時renderer→IPC転送 |
| macOSコード署名 | Medium | Phase 7で対応、開発中は未署名OK |
| Electronセキュリティ | Critical | nodeIntegration:false, contextIsolation:true |

---

## 依存関係

```
Phase 0 (Electron Shell)
  └→ Phase 1 (DataService抽象)
      └→ Phase 2 (SQLite層)
          ├→ Phase 3 (AI移行)
          └→ Phase 4 (Backend廃止) ← Phase 3完了必須
              └→ Phase 5 (ネイティブUX)
                  └→ Phase 6 (新機能)
                      └→ Phase 7 (本番対応)
```
