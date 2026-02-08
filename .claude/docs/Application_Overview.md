
# Project Name: Sonic Flow
## 概要
「Notionライクなタスク管理」に「環境音ミキサー」と「ポモドーロタイマー」を組み合わせた、没入型個人タスク管理アプリケーション。
フロントエンドにReact、バックエンドにJava (Spring Boot) を使用したSPA構成。

## 1. 技術スタック

### Backend (API Server)
* **Language:** Java 23
* **Framework:** Spring Boot 3.4.2
* **Build Tool:** Gradle (Groovy DSL)
* **Database:** H2 Database (ファイルベースモードで永続化)
* **AI Integration:** OpenAI API / Gemini API (Backend Proxy経由)

### Frontend (UI/UX)
* **Framework:** React 19 (TypeScript)
* **Build Tool:** Vite 7
* **Styling:** Tailwind CSS v4
* **State Management:** React Context API
* **Icons:** Lucide React
* **HTTP Client:** native fetch (Axios削除済み)
* **Audio:** Web Audio API (予定)
* **Rich Text:** TipTap (@tiptap/react)
* **Drag & Drop:** @dnd-kit

### データ永続化（現状）
**フロントエンドはlocalStorageのみで動作**。バックエンドREST APIは構築済みだが未接続。
- タスクツリー: `localStorage("sonic-flow-task-tree")`
- タイマー設定: `localStorage("sonic-flow-work-duration")`
- サウンド設定: `localStorage("sonic-flow-sound-mixer")`
- テーマ設定: `localStorage`経由

将来の目標: すべてのユーザーデータをバックエンド (H2 DB) に移行し、デバイス間連携を実現。

## 2. アプリケーション機能要件

### Feature A: タスク管理 (TaskTree)
* 階層型タスクツリー（フォルダ/タスク、フラット配列 + parentId参照）
* フォルダは5階層までネスト可能 (`MAX_FOLDER_DEPTH = 5`)
* @dnd-kitによるドラッグ&ドロップ並び替え・階層移動
* ソフトデリート (`isDeleted`フラグ) + ゴミ箱から復元
* TipTapリッチテキストによるタスクメモ編集
* Inbox + プロジェクト別フィルタリング

### Feature B: ノイズミキサー (Frontend UI)
* 6種の環境音UI（Rain, Thunder, Wind, Ocean, Birds, Fire）
* 各環境音の音量を個別にスライダーで調整（0% - 100%）
* ※音声再生は未実装（Web Audio API統合予定）

### Feature C: 集中タイマー (TimerContext)
* WORK → BREAK → LONG_BREAK の自動遷移
* 作業時間カスタマイズ（5〜60分、5分刻み）
* プログレスバー + ドットインジケータ
* タスクと紐付けてタイマー実行（`activeTask`）
* モーダル表示 / バックグラウンド継続
* TaskTreeNode上にインライン残り時間表示

### Feature D: AIコーチング (Backend Proxy) — 未実装
* タスク分解・励まし・振り返りのアドバイス
* APIキーはバックエンド経由で管理

### 外観設定
* ダークモード/ライトモード切替
* フォントサイズ設定（S/M/L）
* Settings画面（外観設定 + ゴミ箱）

## 3. API 定義 (RESTful) — バックエンド構築済み / フロントエンド未接続

### Tasks
* `GET /api/tasks`: 未完了タスク一覧取得
* `GET /api/tasks/history`: 完了済みタスク一覧取得
* `POST /api/tasks`: 新規タスク作成
* `PUT /api/tasks/{id}`: タスク更新
* `DELETE /api/tasks/{id}`: タスク削除

### Sound Settings
* `GET /api/sound-settings` / `PUT /api/sound-settings`
* `GET /api/sound-presets` / `POST /api/sound-presets` / `DELETE /api/sound-presets/{id}`

### Timer
* `GET /api/timer-settings` / `PUT /api/timer-settings`
* `POST /api/timer-sessions` / `PUT /api/timer-sessions/{id}`
* `GET /api/timer-sessions` / `GET /api/tasks/{taskId}/sessions`

### AI — 未実装
* `POST /api/ai/advice`

## 4. データモデル

### フロントエンド: TaskNode (`types/taskTree.ts`)
```typescript
interface TaskNode {
  id: string;
  type: 'folder' | 'task';
  title: string;
  parentId: string | null;
  order: number;
  status?: 'TODO' | 'DONE';
  isExpanded?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  completedAt?: string;
  content?: string;           // TipTap rich text (JSON)
  workDurationMinutes?: number;
}
```

### バックエンド: Task Entity (Phase 1 — フロントエンドとは未同期)
* `id`: Long, `title`: String, `status`: Enum (TODO/DONE)
* `createdAt`, `completedAt`: LocalDateTime

### その他バックエンドエンティティ
* SoundSettings, SoundPreset, TimerSettings, TimerSession

## 5. フロントエンド構成

### Context Provider スタック (`main.tsx`)
```
ThemeProvider → TaskTreeProvider → TimerProvider → App
```

### レイアウト (3カラム)
```
App (状態オーケストレーター)
├── Sidebar (240px固定)
├── SubSidebar (リサイズ可能160-400px)
│   └── TaskTree (Inbox + Projects + Completed)
└── MainContent (flex-1)
    └── TaskDetail | WorkScreen | Settings
```

### 主要フック
| Hook | 管理対象 | 永続化 |
|------|---------|--------|
| useTaskTree (+ CRUD/Deletion/Movement) | タスクツリー全体 | localStorage |
| useLocalSoundMixer | サウンドミキサー設定 | localStorage |
| useTimerContext | タイマー状態 | Context + localStorage |
| useLocalStorage | 汎用localStorage永続化 | localStorage |

## 6. 開発の進め方と制約事項
1. **CORS設定:** `WebConfig.java`で`localhost:5173`のみ許可
2. **音源ファイル:** リポジトリにコミット禁止（`public/sounds/`は`.gitignore`対象）
3. **AIキー:** フロントエンドに直接記載禁止、バックエンド経由のみ
4. **データ永続化:** 現在はlocalStorageのみ。Backend再統合は将来課題
