# Windows 互換性対応

- **Status**: COMPLETED
- **Created**: 2026-02-11
- **Completed**: 2026-02-11

---

## 概要

現在のコードは macOS 前提で開発されており、`.exe` にパッケージ化して Windows で実行する際にいくつかの問題がある。本ドキュメントではコードベース全体を分析し、修正が必要な箇所と問題ない箇所を整理する。

---

## 結論: .exe 化した場合の動作

**基本的な動作（起動、DB、タイマー、音声再生、タスク管理）は問題なく動く。** ただし以下が動作しない：

- **全てのキーボードショートカット**（Cmd+K, Cmd+1-4, Cmd+,, Cmd+Shift+T, Cmd+., Cmd+Enter）
- **コマンドパレットからのサイドバートグル等**（合成イベントが metaKey 固定）
- **ショートカット表示**（⌘ 記号が Windows ユーザーに意味不明）

---

## A. 修正が必要な箇所

### A1. キーボードショートカットのキー判定（影響度: 高）

Windows には `Cmd` キーが存在しないため、`e.metaKey` のチェックが全て失敗する。

| ファイル | 行 | ショートカット |
|---|---|---|
| `frontend/src/App.tsx` | L374 | `Cmd+K` → コマンドパレット |
| `frontend/src/App.tsx` | L387 | `Cmd+,` → Settings |
| `frontend/src/App.tsx` | L394 | `Cmd+1-4` → セクション切り替え |
| `frontend/src/App.tsx` | L401 | `Cmd+Shift+T` → タイマーモーダル |
| `frontend/src/components/Layout/Layout.tsx` | L68 | `Cmd+.` / `Cmd+Shift+.` → サイドバートグル |
| `frontend/src/components/TaskTree/TaskTree.tsx` | L281 | `Cmd+Enter` → タスクステータス切り替え |

**修正方針**: `e.metaKey` → `(e.metaKey || e.ctrlKey)` に変更

```typescript
// Before
if (e.metaKey && e.code === "KeyK") { ... }

// After
if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") { ... }
```

### A2. コマンドパレットの合成 KeyboardEvent（影響度: 中）

コマンドパレットからサイドバートグルやフォントサイズ変更を実行する際、`metaKey: true` 固定の KeyboardEvent を合成している。

| ファイル | 行 | 内容 |
|---|---|---|
| `frontend/src/App.tsx` | L276-281 | 左サイドバートグル |
| `frontend/src/App.tsx` | L292-298 | 右サイドバートグル |
| `frontend/src/App.tsx` | L326-331 | フォントサイズ拡大 |
| `frontend/src/App.tsx` | L336-341 | フォントサイズ縮小 |

**修正方針（推奨）**: 合成イベントをやめて直接コールバックを呼ぶ

```typescript
// Before (イベント合成)
action: () => window.dispatchEvent(
  new KeyboardEvent("keydown", { key: ".", code: "Period", metaKey: true, bubbles: true })
)

// After (直接呼び出し)
action: () => toggleLeftSidebar()
```

### A3. ショートカット表示テキスト（影響度: 中）

UIに `⌘` 記号がハードコードされている。Windows ユーザーには `Ctrl` と表示すべき。

| ファイル | 内容 |
|---|---|
| `frontend/src/App.tsx` L160-288 | CommandPalette の `shortcut` プロパティ (`"⌘1"`, `"⌘,"`, `"⌘⇧T"` 等) |
| `frontend/src/components/TaskDetail/BubbleToolbar.tsx` L155-186 | ツールチップ (`"Bold (⌘B)"` 等) |
| `frontend/src/components/Tips/ShortcutsTab.tsx` L15 | ショートカット一覧 (`"⌘ + ,"` 等) |

**修正方針**: プラットフォーム判定ユーティリティを作成

```typescript
// utils/platform.ts
export const isMac = window.electronAPI?.platform === 'darwin';
export const modKey = isMac ? '⌘' : 'Ctrl+';
export const modSymbol = isMac ? '⌘' : 'Ctrl';
```

---

## B. 問題ない箇所（対応済み or クロスプラットフォーム安全）

### B1. Electron メインプロセス ✅

| 箇所 | 理由 |
|---|---|
| `main.ts` L41-42 — `titleBarStyle` / `trafficLightPosition` | `process.platform === 'darwin'` で分岐済み。Windows では標準タイトルバー |
| `main.ts` L97 — `window-all-closed` | macOS 以外は `app.quit()` で正しく終了 |
| `menu.ts` — accelerator | `CmdOrCtrl` を使用。Electron が自動で Cmd/Ctrl を切り替え |
| `preload.ts` L71 — `platform` | `process.platform` を expose。フロントエンドで判定可能 |

### B2. ファイルパス ✅

全て Node.js の `path.join()` + `app.getPath()` を使用。ハードコードされた `/` パスなし。

### B3. ネイティブモジュール (better-sqlite3) ✅

electron-builder がターゲット OS 向けにリビルドする。`asarUnpack` も設定済み。

### B4. フォント ✅

`index.css` のフォントスタック: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", ...`
Windows では `Segoe UI` が使われる。monospace も `Consolas` を含む。

### B5. 通知 ✅

Web Notification API を使用。Electron が Windows のトースト通知にマッピング。

### B6. タイトルバー / ウィンドウ ✅

- macOS: `hiddenInset` + カスタム drag 領域 + padding-top（信号機ボタン回避）
- Windows: `default`（標準タイトルバー）。`titlebar-drag` CSS は無害

`LeftSidebar.tsx` L42,48 で `isMac` 判定してパディングを分岐済み。

### B7. NSIS インストーラー設定 ✅

`electron-builder.yml`:
- `oneClick: false` — カスタムインストール
- `allowToChangeInstallationDirectory: true` — インストール先変更可能

### B8. shell.openPath ✅

`diagnosticsHandlers.ts` L52 でログフォルダを開く。Windows でもエクスプローラーが開く。

### B9. SQLite / WAL モード ✅

better-sqlite3 の WAL モードは Windows でも正常動作。

### B10. Web Audio API / HTML5 Audio ✅

Chromium ベースなので Electron 内での音声再生に OS 差なし。

---

## C. 注意点（すぐには問題にならないが将来的に留意）

| 項目 | 説明 |
|---|---|
| 自動アップデート | NSIS インストーラー + electron-updater は Windows でも動作する。現在 `--publish never` なので未使用 |
| コード署名 | Windows で SmartScreen 警告を回避するには EV コード署名証明書が必要（別途 `code-signing-plan.md` に記載） |
| Delete キー | `App.tsx` L433: `e.key === "Delete" || e.key === "Backspace"` で両方対応済み。Windows キーボードは Delete キーが標準的にあるので問題なし |
| TipTap エディタ | TipTap 自体が `Mod` キーバインディングを持っており、Mac では Cmd、Windows では Ctrl に自動マッピング。BubbleToolbar のボタンクリックは `editor.chain()` 経由なのでプラットフォーム非依存 |

---

## D. 修正の優先度と工数

| 優先度 | 対象 | 工数目安 | 備考 |
|---|---|---|---|
| **P0** | A1. `e.metaKey` → `(e.metaKey \|\| e.ctrlKey)` | 小 | 6箇所の条件式変更 |
| **P0** | A2. 合成イベントの修正 | 中 | Layout の toggle 関数を App に引き上げるか callback を渡す |
| **P1** | A3. ショートカット表示テキスト | 小 | ユーティリティ関数 + 表示箇所の差し替え |

P0 を対応すれば Windows でショートカットが使えるようになり、実用上問題なく動作する。

---

## E. 実装完了内容（2026-02-11）

### 新規ファイル
- `frontend/src/utils/platform.ts` — `isMac`, `modSymbol`, `modKey`, `formatShortcut` エクスポート

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `frontend/src/App.tsx` | A1: `e.metaKey` → `mod`（`e.metaKey \|\| e.ctrlKey`）に変更。A2: 合成イベント → `layoutRef.current?.toggleLeftSidebar()` / `toggleRightSidebar()` 直接呼び出し。A3: ショートカット表示を `isMac` で分岐 |
| `frontend/src/components/Layout/Layout.tsx` | A1: `e.metaKey` → `(e.metaKey \|\| e.ctrlKey)`。`LayoutHandle` インターフェース + `handleRef` prop 追加 |
| `frontend/src/components/Layout/LeftSidebar.tsx` | ローカル `isMac` 宣言を `utils/platform` のインポートに置換 |
| `frontend/src/components/Layout/index.ts` | `LayoutHandle` 型の re-export 追加 |
| `frontend/src/components/TaskTree/TaskTree.tsx` | A1: `e.metaKey` → `(e.metaKey \|\| e.ctrlKey)` |
| `frontend/src/components/TaskDetail/BubbleToolbar.tsx` | A3: ツールチップ表示を `isMac` で分岐 |
| `frontend/src/components/Tips/ShortcutsTab.tsx` | A3: ショートカット一覧の `⌘` を `isMac` で分岐 |
