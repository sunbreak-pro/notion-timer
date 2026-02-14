---
name: code-review
description: Sonic Flow 固有のコードレビューチェックリスト。Use when reviewing code changes, PRs, or self-reviewing before commit. Triggers include code review, PR review, pre-commit review, quality check.
---

「code-reviewを起動します」と表示する。

変更されたファイルを特定し、以下のチェックリストから該当項目を確認する。
指摘は **Blocking / Important / Suggestion** に分類する。

## 1. IPC / Electron チェック

- [ ] **3点同期**: IPC追加・変更時に以下が揃っているか
  - `electron/preload.ts` (ALLOWED_CHANNELS)
  - `electron/ipc/*Handlers.ts` (ハンドラ登録)
  - `frontend/src/services/ElectronDataService.ts` (呼び出し側)
- [ ] ハンドラに try-catch があるか（`registerAll.ts`の一括パターン確認）
- [ ] IPC経由データがJSON互換か（Date, undefined, 循環参照に注意）
- [ ] `nodeIntegration: false`, `contextIsolation: true` が維持されているか

## 2. DataService 層チェック

- [ ] 新しいデータ操作が `DataService.ts` インターフェースに定義されているか
- [ ] `ElectronDataService.ts` に実装があるか
- [ ] コンポーネントから直接 `window.electronAPI` を呼んでいないか（DataService経由であるべき）

## 3. Provider / Context チェック

- [ ] Provider順序が正しいか（`main.tsx`: Theme → TaskTree → Calendar → Memo → Note → Timer → Audio）
- [ ] 新しいProviderを追加した場合、`renderWithProviders.tsx` にも追加したか
- [ ] Context値の型が `ReturnType<typeof useHook>` パターンに従っているか

## 4. SQLite / Migration チェック

- [ ] テーブル/カラム追加で `IF NOT EXISTS` を使っているか
- [ ] `PRAGMA user_version` が正しくインクリメントされているか
- [ ] カラム名が `snake_case` か（JS側は `camelCase`、変換関数を確認）

## 5. フロントエンド品質

- [ ] TypeScript strict mode でエラーがないか
- [ ] i18n: 新しいUIテキストが `en.json` / `ja.json` 両方に追加されているか
- [ ] ID生成が `"task-xxx"` / `"folder-xxx"` 形式のString型か
- [ ] ESLint (`npm run lint`) が通過するか

## 6. テスト

- [ ] 新機能にテストがあるか
- [ ] `createMockDataService` に新メソッドのモックが追加されているか
- [ ] テストファイルがソースと同じディレクトリにあるか（コロケーション）

## 7. セキュリティ

- [ ] APIキーがフロントエンドに直接記載されていないか（`safeStorageService`経由）
- [ ] 音源ファイルがコミットに含まれていないか
