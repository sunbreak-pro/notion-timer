# Code Integrity Report

Phase 2 UI実装後のコード整合性レビュー結果

---

## 1. 発見した問題と修正結果

### 1.1 SessionType インポート不整合 (修正済み)

**問題**: `SessionType`が`types/timer.ts`と`hooks/useLocalTimer.ts`の2箇所で重複定義。3ファイルが非正規の場所(`useLocalTimer.ts`)からインポートしていた。

**修正内容**: 全てのインポートを`types/timer.ts`に統一

| ファイル | 変更 |
|---------|------|
| `context/TimerContext.tsx` | `../hooks/useLocalTimer` → `../types/timer` |
| `context/timerContextValue.ts` | 同上 |
| `components/WorkScreen/TimerDisplay.tsx` | `../../hooks/useLocalTimer` → `../../types/timer` |

### 1.2 TaskTree フィルタバグ (修正済み)

**問題**: `TaskTree.tsx:45` の `|| true` がフィルタを無効化し、Inbox表示でフォルダが表示されていた。

```diff
- getChildren(null).filter((n) => n.type !== "folder" || true)
+ getChildren(null).filter((n) => n.type !== "folder")
```

### 1.3 SubSidebar 未使用props (修正済み)

**問題**: `folders`と`onSelectFolder`がSubSidebarに定義されているが、コンポーネント内で使用されていなかった。

**修正内容**: 3ファイルからprop定義と受け渡しを削除

| ファイル | 削除したprops |
|---------|--------------|
| `SubSidebar.tsx` | `folders`, `onSelectFolder` (interface) |
| `Layout.tsx` | `folders`, `onSelectFolder` (interface, destructure, JSX) |
| `App.tsx` | `rootFolders`計算, `folders`/`onSelectFolder` prop |

### 1.4 App.tsx selectedFolderId 状態整理 (修正済み)

**問題**: `setSelectedFolderId`がどこにも渡されなくなり、`noUnusedLocals`エラーが発生。

**修正**: `useState`をconst宣言に変更。フォルダ選択機能の再実装時にstateに戻す。

---

## 2. 削除したデッドコード

### Phase 1 Hooks
| ファイル | 理由 |
|---------|------|
| `hooks/useLocalTimer.ts` | `TimerContext.tsx`が同等機能を内包。SessionType再エクスポートも不要に |
| `hooks/useTimer.ts` | `TimerContext.tsx`に置き換え済み。インポート元なし |
| `hooks/useTasks.ts` | `useTaskTree.ts`に置き換え済み。インポート元なし |
| `hooks/useSoundSettings.ts` | `useLocalSoundMixer.ts`に置き換え済み。インポート元なし |

### Phase 1 API クライアント
| ファイル | 理由 |
|---------|------|
| `api/client.ts` | Axiosインスタンス。Phase 2ではlocalStorage直接使用に移行 |
| `api/tasks.ts` | バックエンド通信用。Phase 2ではローカル状態管理に移行 |
| `api/timerSettings.ts` | 同上 |
| `api/soundSettings.ts` | 同上 |

### Phase 1 型定義・モック
| ファイル | 理由 |
|---------|------|
| `types/task.ts` | `types/taskTree.ts`に統合済み。`TaskStatus`が重複定義 |
| `mocks/tasks.ts` | Phase 1のフラットTask用モック。インポート元なし |

### Phase 1 コンポーネント
| ディレクトリ | 理由 |
|------------|------|
| `components/TaskList/` (4ファイル) | `TaskTree/`に完全置き換え済み。外部からのインポートなし |

**保持したファイル**:
- `mocks/taskTree.ts` — `useTaskTree.ts`が現在もインポート中

---

## 3. 残存する技術的負債

### High Priority

| 項目 | 詳細 |
|------|------|
| **React Compiler lint errors (14件)** | `TimerContext.tsx`のuseCallback依存関係がReact Compilerと不整合。全て`react-hooks/preserve-manual-memoization`エラー |
| **Frontend-Backend データモデル不整合** | Backend: `Task` (id, title, status, createdAt, completedAt)。Frontend: `TaskNode` (id, type, title, parentId, order, status, content, workDurationMinutes等)。ツリー構造・content・workDurationMinutesがBackendに未反映 |
| **localStorage依存** | タスクツリー(`useTaskTree.ts`)、タイマー設定、サウンド設定が全てlocalStorage。設計方針(Backend永続化)と乖離 |

### Medium Priority

| 項目 | 詳細 |
|------|------|
| **フォルダ選択機能の未接続** | `selectedFolderId`はconst nullに固定。SubSidebarからのフォルダ選択がApp.tsxに伝播しない |
| **Backend APIの未使用** | CORSやControllerは実装済みだがFrontendからの通信が全て削除された状態 |
| **TimerContext config再生成** | `config`オブジェクトが毎レンダーで再生成されuseCallbackの依存が不安定（lint warning 2件の原因） |

### Low Priority

| 項目 | 詳細 |
|------|------|
| **チャンクサイズ警告** | ビルド時に500kB超の警告。code-splitの検討が必要 |
| **mocks/taskTree.ts** | 初期データとしてハードコードされたモックが残存 |

---

## 4. 現在のアーキテクチャ (Phase 2)

```
App.tsx
├── TimerProvider (context/TimerContext.tsx)
│   └── タイマー状態管理 (localStorage: work-duration)
├── TaskTreeProvider (context/TaskTreeContext.tsx)
│   └── タスクツリー状態管理 (localStorage: task-tree)
├── SoundMixerProvider
│   └── サウンド状態管理 (localStorage)
└── Layout
    ├── Sidebar (ナビゲーション)
    ├── SubSidebar (タスクツリー表示)
    │   └── TaskTree → TaskTreeNode (再帰)
    └── MainContent
        ├── TaskDetail (タスク詳細・編集)
        ├── WorkScreen (タイマー・サウンドミキサー)
        └── Settings (設定)
```

### データフロー
```
localStorage ←→ useTaskTree.ts (hook)
                    ↓
              TaskTreeContext (provider)
                    ↓
              App.tsx (orchestrator)
              ↙          ↘
    SubSidebar          MainContent
    (TaskTree)          (TaskDetail / WorkScreen)
```

---

## 5. ファイル整合性マップ

### 型定義の依存関係
```
types/timer.ts
  └── SessionType → TimerContext.tsx, timerContextValue.ts, TimerDisplay.tsx

types/taskTree.ts
  ├── TaskNode → App.tsx, Layout.tsx, SubSidebar.tsx, TaskTree.tsx,
  │              TaskTreeNode.tsx, TaskDetail.tsx, useTaskTree.ts
  ├── NodeType → TaskTreeNode.tsx, useTaskTree.ts
  └── TaskStatus → useTaskTree.ts

types/navigation.ts
  └── SectionId → App.tsx, Layout.tsx, Sidebar.tsx
```

### Context依存関係
```
TimerContext.tsx (Provider)
  ├── timerContextValue.ts (interface + createContext)
  └── useTimerContext.ts (consumer hook)
       └── App.tsx, WorkScreen.tsx, Settings.tsx

TaskTreeContext.tsx (Provider)
  ├── useTaskTree.ts (hook, localStorage)
  │   └── mocks/taskTree.ts (初期データ)
  └── useTaskTreeContext.ts (consumer hook)
       └── App.tsx, TaskTree.tsx, TaskTreeNode.tsx
```
