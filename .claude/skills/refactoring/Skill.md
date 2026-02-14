---
name: refactoring
description: Sonic Flow のリファクタリングガイド。Use when refactoring code, extracting hooks/components, restructuring modules, or improving code quality. Triggers include refactor, extract, restructure, simplify, clean up.
---

「refactoringを起動します」と表示する。

## 基本原則

1. **動作を変えずに構造を改善する**（機能追加と混ぜない）
2. **テストが通る状態を維持する**（小さいステップで進める）
3. **既存パターンに合わせる**（このプロジェクトの規約に従う）

## よくあるリファクタリングパターン

### Hook 抽出

コンポーネントからロジックを分離:

```typescript
// Before: コンポーネント内にロジック混在
function MyComponent() {
  const [items, setItems] = useState([]);
  useEffect(() => { /* fetch logic */ }, []);
  const addItem = () => { /* ... */ };
  return <div>...</div>;
}

// After: フックに抽出
function useMyItems() {
  const [items, setItems] = useState([]);
  useEffect(() => { /* fetch logic */ }, []);
  const addItem = () => { /* ... */ };
  return { items, addItem };
}

function MyComponent() {
  const { items, addItem } = useMyItems();
  return <div>...</div>;
}
```

- フックファイル: `frontend/src/hooks/useXxx.ts`
- 命名: `use` + ドメイン名（camelCase）

### コンポーネント分割

大きなコンポーネントを分割:

1. 描画部分ごとにサブコンポーネントを抽出
2. Props で必要なデータを渡す（Context経由よりProps優先）
3. 同じディレクトリか `components/` サブディレクトリに配置

### Context 分割

肥大化した Context を分離:

1. 独立した関心事ごとに Context を分ける
2. Provider の依存関係を確認（`main.tsx` の順序）
3. `renderWithProviders.tsx` にも反映

### 型の整理

```
frontend/src/types/
├── taskTree.ts     # ドメイン型（TaskNode等）
├── timer.ts        # タイマー関連型
└── ...
```

- 共有型は `types/` ディレクトリに
- コンポーネント固有の Props 型はコンポーネントファイル内に

## レイヤー別の注意点

### Repository リファクタリング

- prepared statements の再利用を維持
- `rowToModel` 変換関数のパターンを守る
- 型は `ReturnType<typeof createXxxRepository>` で導出

### IPC ハンドラリファクタリング

- チャンネル名を変更する場合は **3点セット** を必ず更新:
  - `preload.ts` / `*Handlers.ts` / `ElectronDataService.ts`
- 既存チャンネルの後方互換に注意

### DataService リファクタリング

- インターフェース (`DataService.ts`) を先に変更
- 実装 (`ElectronDataService.ts`) を合わせる
- `mockDataService.ts` のモックも更新

## チェックリスト

- [ ] `cd frontend && npm run test` — 全テスト通過
- [ ] `cd frontend && npm run lint` — ESLint通過
- [ ] `cd frontend && npx tsc --noEmit` — 型エラーなし
- [ ] 不要なインポート・エクスポートが残っていない
- [ ] コミットメッセージ: `refactor: <subject>`
