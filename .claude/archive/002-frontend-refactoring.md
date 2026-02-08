# 002: フロントエンド コード品質分析 & リファクタリングプラン

> **作成日**: 2026-02-07
> **ステータス**: Phase 1 実施待ち
> **対象**: `frontend/src/` (49ファイル, 約2,440行)

---

## 1. 調査結果サマリー

### 問題一覧マップ

| # | カテゴリ | 対象ファイル | 問題 | 影響度 | Phase |
|---|---------|-------------|------|--------|-------|
| B1 | バグ温床 | `context/TimerContext.tsx` | `config`未メモ化 → interval毎秒再生成 | **高** | 1 |
| B2 | バグ温床 | `components/TaskDetail/MemoEditor.tsx` | `onUpdate` stale closure | **高** | 1 |
| B3 | バグ温床 | `components/TaskTree/TaskTreeNode.tsx` | onClick/onDoubleClick競合 | **中** | 1 |
| B4 | バグ温床 | (新規) `ErrorBoundary.tsx` | Error Boundary未実装 | **中** | 1 |
| B5 | バグ温床 | `hooks/useTaskTree.ts` | `activeNodes`が毎レンダーfilter再計算 | 低 | 4 |
| B6 | バグ温床 | `components/TaskDetail/SlashCommandMenu.tsx` | `filteredCommands`がレンダー毎に再計算（メモ化なし） | 低 | 4 |
| D1 | 重複 | `TaskDetailHeader.tsx` + `DurationSelector.tsx` | Duration Picker UIが完全重複 | **中** | 2 |
| D2 | 重複 | 5ファイル | localStorage キー文字列がハードコード散在 | **中** | 2 |
| D3 | 重複 | 4ファイル | localStorage読み書きパターンの重複 | 中 | 2 |
| D4 | 重複 | `SlashCommandMenu.tsx`, `DurationSelector.tsx` | コンポーネントファイル内の定数配列 | 低 | 2 |
| E1 | 効率改善 | `TaskTreeNode.tsx` (247行) | コンポーネント肥大化 | 中 | 3 |
| E2 | 効率改善 | `useTaskTree.ts` (301行) | フック肥大化 | 中 | 3 |
| E3 | 効率改善 | `SlashCommandMenu.tsx` (187行) | ロジック/UI混在 | 低 | 3 |
| E4 | 効率改善 | `Layout.tsx` | localStorage書込みデバウンスなし | 低 | 4 |
| E5 | 効率改善 | `package.json` | 未使用依存: axios (v1.13.4) | 低 | 4 |
| E6 | 効率改善 | `TaskTree.tsx` (224行) | 大規模ツリーの仮想化未対応 | 低 | 4 |

---

## 2. Phase 1: バグ修正（実施対象）

### Bug 1: TimerContext `config`未メモ化による非効率なinterval再生成

**ファイル**: `frontend/src/context/TimerContext.tsx:38-43, 62-99`

**原因分析**:
`config`オブジェクトがレンダーごとに新規作成される。`advanceSession`は`config`を依存配列に持つため、`useCallback`のメモ化が無効化される。結果として`advanceSession`の参照が毎レンダーで変わり、それに依存する`useEffect`(L82-99)が毎秒intervalを破棄・再生成する。

タイマー稼働中は毎秒`setRemainingSeconds`でリレンダーが発生するため、毎秒intervalが壊れて作り直される。動作はするが非効率であり、タイミングのずれやGC圧の原因になりうる。

**Before** (`TimerContext.tsx:38-43, 62-80`):
```tsx
// L38-43: 毎レンダーで新規オブジェクト生成
const config: TimerConfig = {
  workDuration: workDurationMinutes * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
};

// L62-80: configが毎回新参照 → advanceSessionも毎回新参照
const advanceSession = useCallback(() => {
  clearTimer();
  setIsRunning(false);
  if (sessionType === 'WORK') {
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);
    if (newCompleted % config.sessionsBeforeLongBreak === 0) {
      setSessionType('LONG_BREAK');
      setRemainingSeconds(config.longBreakDuration);
    } else {
      setSessionType('BREAK');
      setRemainingSeconds(config.breakDuration);
    }
  } else {
    setSessionType('WORK');
    setRemainingSeconds(config.workDuration);
  }
}, [sessionType, completedSessions, config, clearTimer]);
```

**After**:
```tsx
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// L38-43: useMemoでメモ化（workDurationMinutesが変わった時のみ再生成）
const config = useMemo<TimerConfig>(() => ({
  workDuration: workDurationMinutes * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
}), [workDurationMinutes]);

// advanceSessionの依存配列は同じだが、configの参照が安定するため
// workDurationMinutesが変わらない限りadvanceSessionも再生成されない
// → useEffect内のintervalが不要に破棄・再生成されなくなる
```

**影響範囲**: `advanceSession`, `reset` の依存、`useEffect`(L82-99)のinterval管理

---

### Bug 2: MemoEditor `onUpdate`のstale closure

**ファイル**: `frontend/src/components/TaskDetail/MemoEditor.tsx:33-51`

**原因分析**:
`useEditor`の第2引数（依存配列）が`[taskId]`のみ。エディタインスタンスは`taskId`が変わらない限り再生成されない。エディタ作成時に渡した`onUpdate`コールバックは初回の`handleUpdate`参照で固定される。

親コンポーネントが`onUpdate`プロップを更新しても（例: 別のタスクに切り替えた場合など）、エディタ内部のコールバックは古い`handleUpdate`を参照し続ける。`handleUpdate`自体は`useCallback([onUpdate])`でメモ化されているが、エディタが再生成されないため古いクロージャが残る。

**Before** (`MemoEditor.tsx:13-51`):
```tsx
export function MemoEditor({ taskId, initialContent, onUpdate }: MemoEditorProps) {
  const debounceRef = useRef<number | null>(null);

  const handleUpdate = useCallback((json: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      onUpdate(json);
    }, 800);
  }, [onUpdate]);

  const editor = useEditor({
    extensions: [ /* ... */ ],
    content: initialContent ? tryParseJSON(initialContent) : undefined,
    onUpdate: ({ editor }) => {
      handleUpdate(JSON.stringify(editor.getJSON()));
      // ↑ このhandleUpdateは初回マウント時の参照で固定される
    },
  }, [taskId]);
```

**After**:
```tsx
export function MemoEditor({ taskId, initialContent, onUpdate }: MemoEditorProps) {
  const debounceRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // 最新のonUpdateを常にrefに保持
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const editor = useEditor({
    extensions: [ /* ... */ ],
    content: initialContent ? tryParseJSON(initialContent) : undefined,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        onUpdateRef.current(json);  // refを経由して常に最新のonUpdateを呼ぶ
      }, 800);
    },
  }, [taskId]);

  // handleUpdate useCallbackは不要になるため削除
```

**補足**: TipTapの`useEditor`は依存配列が変わらない限りコールバックを更新しないため、`useRef`パターンが正解。`handleUpdate`の`useCallback`ラッパーは削除し、debounceロジックをonUpdate内にインライン化することでシンプルになる。

---

### Bug 3: TaskTreeNode onClick/onDoubleClick競合

**ファイル**: `frontend/src/components/TaskTree/TaskTreeNode.tsx:158-186`

**原因分析**:
タスクタイトルの`<span>`要素に`onClick`と`onDoubleClick`が同時に設定されている:
- `onClick`: タスクの場合は`onSelectTask(node.id)`、フォルダの場合は`setIsEditing(true)`
- `onDoubleClick`: `setIsEditing(true)`

ダブルクリック時、ブラウザは`onClick`を2回発火した後に`onDoubleClick`を発火する。タスクノードの場合:
1. 1回目click → `onSelectTask(node.id)` （選択）
2. 2回目click → `onSelectTask(node.id)` （選択、冗長）
3. dblclick → `setIsEditing(true)` （編集開始）

これ自体は動作するが、ダブルクリック時に`onSelectTask`が不要に2回呼ばれるほか、将来`onSelectTask`の処理が重くなった場合に問題になる。また、フォルダノードでは`onClick`で即座に編集開始するため`onDoubleClick`は到達しない（無意味なハンドラ）。

**Before** (`TaskTreeNode.tsx:169-185`):
```tsx
<span
  onClick={() => {
    if (node.type === "task" && onSelectTask) {
      onSelectTask(node.id);
    } else {
      setIsEditing(true);
    }
  }}
  onDoubleClick={() => setIsEditing(true)}
  className={`flex-1 text-sm cursor-pointer truncate ${
    isDone ? "line-through text-notion-text-secondary" : "text-notion-text"
  } ${isFolder ? "font-medium" : ""}`}
>
  {node.title}
</span>
```

**After**:
```tsx
const clickTimerRef = useRef<number | null>(null);

// ...

<span
  onClick={() => {
    if (isFolder) {
      setIsEditing(true);
      return;
    }
    // タスク: シングルクリック→選択、ダブルクリック→編集
    if (clickTimerRef.current !== null) {
      // 2回目のclick → ダブルクリックと判定
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setIsEditing(true);
    } else {
      // 1回目のclick → 300ms後に選択を実行
      clickTimerRef.current = window.setTimeout(() => {
        clickTimerRef.current = null;
        if (onSelectTask) onSelectTask(node.id);
      }, 300);
    }
  }}
  className={`flex-1 text-sm cursor-pointer truncate ${
    isDone ? "line-through text-notion-text-secondary" : "text-notion-text"
  } ${isFolder ? "font-medium" : ""}`}
>
  {node.title}
</span>
```

**トレードオフ**: 300msの遅延でシングルクリック（選択）の反応がわずかに遅くなる。ただしNotionも同様のパターンを採用しており、UX上の違和感は小さい。`onDoubleClick`ハンドラは削除し、クリック回数の判定をonClick内で完結させる。

---

### Bug 4: Error Boundary未実装

**ファイル**: 新規作成 `frontend/src/components/ErrorBoundary.tsx`

**原因分析**:
React Error Boundaryが存在しないため、コンポーネントのレンダリングエラーでアプリ全体がクラッシュしホワイトスクリーンになる。特に以下のケースでリスクが高い:
- `localStorage`のパース失敗（不正なJSON）
- TipTapエディタの初期化エラー
- DnD操作中の予期しない状態

**実装コード例**:
```tsx
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-screen gap-4 text-notion-text">
          <p className="text-lg">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-md bg-notion-accent text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**配置場所** (`App.tsx`または`main.tsx`):
```tsx
<ErrorBoundary>
  <ThemeProvider>
    <TimerProvider>
      <App />
    </TimerProvider>
  </ThemeProvider>
</ErrorBoundary>
```

---

## 3. Phase 2: 重複排除（将来対応）

### D1: Duration Picker統一

`TaskDetailHeader.tsx`と`DurationSelector.tsx`に同一のDuration Picker UIが存在する。

**重複要素**:
- `PRESETS = [15, 25, 30, 45, 60, 90, 120, 180, 240]` — 完全一致
- `formatDuration()` 関数 — 完全一致
- `-/+` ボタンのステップロジック（60分境界で5分/15分切り替え）— 同等

**方針**: 共通コンポーネント `components/shared/DurationPicker.tsx` を作成し、両者から参照する。`formatDuration`と`PRESETS`もここにまとめる。

### D2: localStorage定数集約

現在5ファイルにハードコードされたストレージキー:

| キー | ファイル |
|------|---------|
| `sonic-flow-task-tree` | `hooks/useTaskTree.ts` |
| `sonic-flow-sound-mixer` | `hooks/useLocalSoundMixer.ts` |
| `sonic-flow-work-duration` | `context/TimerContext.tsx` |
| `sonic-flow-theme` | `context/ThemeContext.tsx` |
| `sonic-flow-font-size` | `context/ThemeContext.tsx` |
| `sonic-flow-subsidebar-width` | `components/Layout/Layout.tsx` |

**方針**: `constants/storageKeys.ts`に集約し、キー名の一元管理と重複防止を実現する。

### D3: 汎用`useLocalStorage`フック

4ファイルに類似のlocalStorage読み書きパターンが存在（try/catchガード、JSON.parse/stringify、フォールバック値）。

**方針**: `hooks/useLocalStorage.ts`を作成し、共通パターンを抽出。型パラメータ・バリデーション関数をサポートする。
```ts
function useLocalStorage<T>(key: string, defaultValue: T, validate?: (v: T) => boolean): [T, (v: T) => void]
```

### D4: コンポーネント外定数の移動

- `SlashCommandMenu.tsx` の `COMMANDS` 配列 (42行)
- `DurationSelector.tsx` の `PRESETS` 配列（D1で統合予定）

**方針**: D1解決後の残りのみ対応。`COMMANDS`は同ファイルのトップレベル定義で問題なし（現状維持で可）。

---

## 4. Phase 3: コンポーネント分割（将来対応）

### E1: TaskTreeNode.tsx (247行) → 分割

**現状**: レンダリング、編集、DnD、タイマー表示、アクションボタンが1コンポーネントに集中。

**分割案**:
| 新コンポーネント | 責務 | 概算行数 |
|----------------|------|---------|
| `TaskTreeNode.tsx` | 構造・ルーティング | ~60行 |
| `TaskNodeContent.tsx` | タイトル表示・クリック処理 | ~50行 |
| `TaskNodeEditor.tsx` | インライン編集 | ~40行 |
| `TaskNodeActions.tsx` | Play/Delete ボタン群 | ~40行 |
| `TaskNodeTimer.tsx` | プログレスバー表示 | ~30行 |

### E2: useTaskTree.ts (301行) → 分割

**現状**: CRUD、削除/復元、移動ロジックが単一フックに集中。

**分割案**:
| 新フック | 責務 | 概算行数 |
|---------|------|---------|
| `useTaskTree.ts` | メインフック（結合・公開API） | ~60行 |
| `useTaskTreeCRUD.ts` | add, update, toggle系 | ~80行 |
| `useTaskTreeDeletion.ts` | softDelete, restore, permanentDelete | ~70行 |
| `useTaskTreeMovement.ts` | moveNode, moveNodeInto, moveToRoot | ~100行 |

### E3: SlashCommandMenu.tsx (187行) → 分割

**現状**: TipTapイベント監視、キーボードナビゲーション、UIレンダリングが混在。

**分割案**:
- `useSlashCommand.ts` — トランザクション監視、開閉制御、キー操作
- `SlashCommandMenu.tsx` — UIレンダリングのみ

---

## 5. Phase 4: パフォーマンス最適化（将来対応）

### E4: localStorage書込みデバウンス

`Layout.tsx`のサイドバーリサイズ時、`mousemove`イベントごとにlocalStorageへ書き込んでいる。`mouseup`時のみ保存、もしくはデバウンス（200ms）で書込み頻度を削減。

### E5: 未使用依存の削除

`axios`(v1.13.4) が`package.json`に含まれているが、フロントエンドのどこからもインポートされていない。将来のAPI通信で使用予定がなければ削除。

### E6: 大規模ツリーの仮想化

タスク数が数百を超えた場合のパフォーマンス劣化に備え、`react-window`等による仮想スクロールを検討。現時点では不要だが、ツリーノード数の増加に応じて導入を判断。

### B5/B6: メモ化の追加

- `useTaskTree.ts`の`activeNodes`/`deletedNodes`を`useMemo`化
- `SlashCommandMenu.tsx`の`filteredCommands`を`useMemo`化

---

## 6. API移行を見据えた設計指針

将来のバックエンドAPI移行（localStorage → REST API）に向けて、リファクタリング時に意識すべき設計指針:

### Repository Pattern の抽象化

```ts
// データアクセスインターフェース
interface TaskRepository {
  getAll(): Promise<TaskNode[]>;
  save(nodes: TaskNode[]): Promise<void>;
}

// localStorage実装（現在）
class LocalStorageTaskRepository implements TaskRepository {
  async getAll() { return loadNodes(); }
  async save(nodes) { saveNodes(nodes); }
}

// API実装（将来）
class ApiTaskRepository implements TaskRepository {
  async getAll() { return fetch('/api/tasks').then(r => r.json()); }
  async save(nodes) { /* ... */ }
}
```

### 非同期化への備え

Phase 2の`useLocalStorage`フックを設計する際、将来的にAPIコールに置き換えやすいよう:
- 戻り値に`loading`/`error`状態を含める余地を残す
- 同期的なlocalStorageアクセスでも`Promise`ラップを検討（ただし過度な抽象化は避ける）
- 現時点では同期APIで実装し、API移行時にインターフェースを拡張する

### Context層での切り替え

データソースの切り替えはContext Provider層で行い、コンポーネントは接続先を意識しない設計を維持:
```
Component → useContext(TaskContext) → TaskProvider → Repository
                                                    ↑
                                          環境変数等で切り替え
```

---

## 7. 検証方法

### Phase 1 修正の動作確認手順

| 確認項目 | 手順 | 期待結果 |
|---------|------|---------|
| ビルド通過 | `npm run build` | エラーなし |
| Lint通過 | `npm run lint` | エラーなし |
| タイマー基本動作 | Work開始→完了→Break遷移 | セッション遷移が正常 |
| タイマー中のUI | タイマー稼働中にDevToolsのProfiler確認 | interval再生成が発生しない |
| メモ編集 | タスク選択→メモ入力→別タスク選択→メモ入力 | 正しいタスクにメモが保存される |
| クリック操作 | タスクをシングルクリック→選択確認 | 300ms後に選択される |
| ダブルクリック操作 | タスクをダブルクリック→編集確認 | 編集モードに入る |
| エラー回復 | DevToolsでコンポーネントエラーを注入 | ErrorBoundaryが表示される |
| タスクCRUD | 作成→編集→完了→削除 | 全操作正常 |
| DnD操作 | タスクをドラッグ&ドロップ | 順序変更が正常 |
| テーマ切替 | ダーク/ライト切替 | 即座に反映 |

---

## 補足: ファイル規模の参考データ

| ファイル | 行数 | Phase関連 |
|---------|------|----------|
| `hooks/useTaskTree.ts` | 301 | E2 (Phase 3) |
| `components/TaskTree/TaskTreeNode.tsx` | 247 | B3 (Phase 1), E1 (Phase 3) |
| `components/TaskTree/TaskTree.tsx` | 224 | — |
| `components/TaskDetail/SlashCommandMenu.tsx` | 187 | E3 (Phase 3) |
| `context/TimerContext.tsx` | 169 | B1 (Phase 1) |
| `components/TaskDetail/MemoEditor.tsx` | 67 | B2 (Phase 1) |
| `components/WorkScreen/DurationSelector.tsx` | 60 | D1 (Phase 2) |
| `components/TaskDetail/TaskDetailHeader.tsx` | 132 | D1 (Phase 2) |
