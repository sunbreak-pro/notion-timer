---
name: debug-strategy
description: Sonic Flow 固有のデバッグ戦略。Use when debugging IPC errors, SQLite issues, Audio problems, or Context/Provider bugs. Triggers include error investigation, bug fixing, crash diagnosis.
---

「debug-strategyを起動します」と表示する。

## 基本フロー

**再現 → 追跡 → 特定 → 修正 → 検証**

## IPC デバッグ

### チャンネル未許可エラー

```
Error: IPC channel not allowed: <channel>
```

1. `electron/preload.ts` の `ALLOWED_CHANNELS` にチャンネルが存在するか確認
2. チャンネル名のtypoチェック（prefix規則: `db:domain:action`）

### ハンドラ未登録 / エラー

1. `electron/ipc/registerAll.ts` でハンドラ登録を確認
2. 対応する `*Handlers.ts` でtry-catchとエラーメッセージを確認
3. Repository層のメソッド名・引数の不一致をチェック

### シリアライゼーション

- IPC経由で渡せるのはJSON互換データのみ
- `Date`オブジェクトは文字列化される → フロントで再パース必要
- `undefined` は送信時に消える → `null` を使う

## SQLite デバッグ

### カラム名マッピング

- DB: `snake_case` (e.g., `created_at`)
- JS: `camelCase` (e.g., `createdAt`)
- Repository の `rowToModel` 変換関数を確認

### マイグレーション問題

1. `PRAGMA user_version` で現在のバージョンを確認
2. `electron/database/migrations.ts` で該当バージョンの処理を読む
3. WALモード注意: 同時アクセス時のロック

### 診断コマンド

```bash
# DBファイルの場所（dev環境）
ls ~/Library/Application\ Support/sonic-flow/

# DB直接確認
sqlite3 ~/Library/Application\ Support/sonic-flow/sonic-flow.db ".tables"
sqlite3 ~/Library/Application\ Support/sonic-flow/sonic-flow.db "PRAGMA user_version"
```

## Audio デバッグ

### Web Audio API

- `AudioContext` の state 確認（`suspended` → ユーザー操作後に `resume()` 必要）
- フェードイン/アウト: `useAudioEngine` の `gainNode` 操作を確認
- 音源ファイル: `public/sounds/` (gitignore対象、ローカルのみ)

### カスタムサウンド

- blob管理: `useCustomSounds` → IPC → ファイルシステム
- メタデータ: `db:customSound:*` チャンネル

## Context/Provider デバッグ

### Provider順序問題

`main.tsx` のProvider順序（外→内）:

```
ErrorBoundary → Theme → TaskTree → Calendar → Memo → Note → Timer → Audio
```

- 内側のProviderは外側のContextに依存可能（逆は不可）
- TimerはTaskTreeに依存（activeTask参照）

### null Context検出

```
Cannot read properties of null (reading '...')
```

- コンポーネントが対応するProviderの外で使われている
- `useXxxContext()` フックのnullチェックを確認

## デバッグツール活用

1. **Grep**: エラーメッセージで検索 → 発生箇所特定
2. **Read**: スタックトレースのファイル:行番号を直接読む
3. **DevTools**: `npm run dev` → Electron DevTools (Cmd+Opt+I)
4. **ログ**: メインプロセスはターミナル出力、レンダラーはDevToolsコンソール
