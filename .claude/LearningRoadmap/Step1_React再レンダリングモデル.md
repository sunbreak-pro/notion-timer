# Step 1: Reactの再レンダリングモデルを理解する

**状態**: 解説済み / ミニ課題未回答

---

## 1-1. 解説: なぜイミュータブル更新が必要なのか

### Reactの根本的なルール

Reactは画面を更新するとき、**「データが変わったかどうか」を参照（メモリアドレス）で判断する**。中身を見比べているのではなく、**別のオブジェクトになったかどうか**で判断している。

これを理解するために、JavaScriptの変数がどう動くかを見てみよう。

```typescript
// ---- ミュータブル（直接変更）----
const task = { id: "1", title: "買い物" };
task.title = "掃除";  // 同じオブジェクトの中身を書き換えた

// taskの参照（メモリアドレス）は変わっていない
// React: 「同じオブジェクトだな、変更なし」 → 画面更新しない ❌
```

```typescript
// ---- イミュータブル（新しいオブジェクトを作る）----
const task = { id: "1", title: "買い物" };
const newTask = { ...task, title: "掃除" };  // 新しいオブジェクトを作った

// newTaskは別のメモリアドレスを持つ新しいオブジェクト
// React: 「別のオブジェクトだ、変更あり！」 → 画面更新する ✅
```

**重要なポイント**: `{ ...task, title: "掃除" }` は「taskの全プロパティをコピーして、titleだけ上書きした**新しいオブジェクト**」を作る。元のtaskは変わらない。

### 配列も同じルール

```typescript
const tasks = [task1, task2, task3];

// ❌ ミュータブル: 配列の中身を直接変えても、配列自体は同じ参照
tasks[0].title = "新しいタイトル";
setNodes(tasks);  // Reactは「同じ配列だ」と判断 → 更新されない

// ✅ イミュータブル: map()で新しい配列を作る
const newTasks = tasks.map(t =>
  t.id === "1" ? { ...t, title: "新しいタイトル" } : t
);
setNodes(newTasks);  // 新しい配列 → React再レンダリング
```

`map()`は**常に新しい配列を返す**。だから配列の参照が変わり、Reactが検知できる。

---

## 1-2. コード追跡: `useTaskTreeCRUD.ts` を1行ずつ解体する

### まず、このファイルの全体像

対象ファイル: `frontend/src/hooks/useTaskTreeCRUD.ts`

引数を見よう:

```typescript
export function useTaskTreeCRUD(
  nodes: TaskNode[],          // 現在のタスク一覧（配列）
  persist: (updated: TaskNode[]) => void,  // 更新を保存する関数
  getNodeDepth: (nodeId: string) => number, // フォルダの深さを取得
  generateId: (type: NodeType) => string,   // 新しいIDを生成
)
```

このフックは**自分でstateを持たない**。`nodes`（データ）と`persist`（保存方法）を外から受け取る。これが「関心の分離」 — CRUDロジックは**データがどこに保存されるかを知らない**。localStorageかもしれないし、APIかもしれない。

---

### `updateNode` を1行ずつ解体

```typescript
const updateNode = useCallback((id: string, updates: Partial<TaskNode>) => {
  persist(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
}, [nodes, persist]);
```

この1行の中で何が起きているか、内側から順番に展開しよう:

**Step A: `nodes.map(n => ...)`**
- `nodes`配列の全要素を順番に処理して、**新しい配列**を作る
- 例: nodes = [{id:"1", title:"A"}, {id:"2", title:"B"}, {id:"3", title:"C"}]

**Step B: `n.id === id ? ... : n`** (三項演算子)
- 各要素について「このノードが更新対象か？」を判定
- 対象でなければ → `n`（元のオブジェクトをそのまま返す）
- 対象なら → Step Cへ

**Step C: `{ ...n, ...updates }`** (スプレッド構文)
- `...n` → 元のノードの全プロパティを展開（id, type, title, parentId, ...）
- `...updates` → 更新したいプロパティだけ上書き
- 後に書いたものが勝つので、updatesの値で元の値が上書きされる

**具体例**:
```typescript
// updateNode("2", { title: "新タイトル" }) を呼んだ場合
nodes.map(n => n.id === "2" ? { ...n, ...{title: "新タイトル"} } : n)

// 結果:
// [{id:"1", title:"A"},      ← 変更なし（n.id !== "2"）
//  {id:"2", title:"新タイトル"}, ← 新しいオブジェクト！
//  {id:"3", title:"C"}]      ← 変更なし
```

**Step D: `persist(...)`**
- この新しい配列をpersistに渡す → 内部でsetNodes + localStorageに保存

**まとめると**:
> 「全ノードをmap()で走査し、IDが一致するノードだけ新しいオブジェクトに差し替えた**新しい配列**を作り、それを保存する」

---

### `toggleExpanded` を読む

```typescript
const toggleExpanded = useCallback((id: string) => {
  persist(nodes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n));
}, [nodes, persist]);
```

`updateNode`とほぼ同じ構造。違いは:
- `Partial<TaskNode>`を外から受け取るのではなく、`isExpanded: !n.isExpanded`と**反転**を内部で決めている
- `!n.isExpanded` → true→false、false→true、undefined→true

---

### `addNode` を読む

```typescript
const addNode = useCallback((type: NodeType, parentId: string | null, title: string) => {
  // フォルダの深さ制限チェック
  if (type === 'folder' && parentId !== null) {
    const parentDepth = getNodeDepth(parentId);
    if (parentDepth + 1 >= MAX_FOLDER_DEPTH) return null;  // 深すぎたら追加しない
  }

  // 同じ親を持つ兄弟ノードを数える（順番を決めるため）
  const siblings = nodes.filter(n => !n.isDeleted && n.parentId === parentId);

  // 新しいノードオブジェクトを作る
  const newNode: TaskNode = {
    id: generateId(type),         // "task-abc123" や "folder-xyz789"
    type,                          // 'task' or 'folder'
    title,
    parentId,
    order: siblings.length,        // 兄弟の最後に追加
    status: type === 'task' ? 'TODO' : undefined,  // タスクならTODO、フォルダなら不要
    isExpanded: type !== 'task' ? true : undefined, // フォルダは開いた状態で追加
    createdAt: new Date().toISOString(),
    scheduledAt: type === 'task' ? new Date().toISOString() : undefined,
  };

  // ★ ここがポイント: [...nodes, newNode] = 元の配列 + 新しいノード = 新しい配列
  persist([...nodes, newNode]);
  return newNode;
}, [nodes, persist, getNodeDepth, generateId]);
```

`[...nodes, newNode]` は:
- `...nodes` → 既存の全ノードを展開
- `newNode` → 末尾に新しいノードを追加
- `[]` → これら全部を入れた**新しい配列**を作る

`nodes.push(newNode)`（ミュータブル）ではなく、`[...nodes, newNode]`（イミュータブル）を使うのは、Reactに「配列が変わった」と認識させるため。

---

## 1-3. ミニ課題: `toggleTaskStatus` を読み解く（未回答）

以下のコードを読んで、3つの質問に答えてみよう:

```typescript
const toggleTaskStatus = useCallback((id: string) => {
  persist(nodes.map(n => {
    if (n.id !== id || n.type !== 'task') return n;    // ← (A)
    const newStatus: TaskStatus = n.status === 'TODO' ? 'DONE' : 'TODO';  // ← (B)
    return {
      ...n,                                             // ← (C)
      status: newStatus,                                // ← (D)
      completedAt: newStatus === 'DONE' ? new Date().toISOString() : undefined, // ← (E)
    };
  }));
}, [nodes, persist]);
```

### 質問

1. **(A)の行**: `n.id !== id || n.type !== 'task'` — これはどういう条件のとき元のノードをそのまま返しているか？（2つのケースがある）

2. **(B)-(E)**: もし `id = "task-5"` のノードの現在の`status`が`"TODO"`だったら、返されるオブジェクトの`status`と`completedAt`はそれぞれ何になるか？

3. **全体**: もしnodesに5つのノードがあり、`toggleTaskStatus("task-5")`を呼んだとき、map()の結果として返される配列の5つの要素のうち、**新しいオブジェクトになるのは何個**で、**元のオブジェクトがそのまま使われるのは何個**か？
