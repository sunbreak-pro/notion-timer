# Feature Plan: Markdown Shortcuts → Floating Bubble Toolbar

**Status**: PLANNED
**Created**: 2026-02-10

---

## Context

現在のエディタではテキスト書式設定に Markdown 記法（`**太字**`、`*斜体*` など）を使用しているが、非エンジニアにとって直感的ではない。テキストを選択した際に Notion スタイルのフローティングツールバー（バブルメニュー）を表示し、クリックで書式設定できるようにする。

## 要件

1. **テキスト選択時にフローティングツールバーを表示**
2. **インライン書式のみ**: Bold, Italic, Strikethrough, Inline Code, Link, Text Color
3. **Markdown 記法ショートカット（`**`, `*`, `~~` 等の入力ルール）を削除**
4. **キーボードショートカット追加 + ツールチップ表示**:
   - `⌘+B` Bold / `⌘+I` Italic / `⌘+Shift+S` Strikethrough / `⌘+E` Code / `⌘+K` Link
5. **ブロック操作はスラッシュコマンドに据え置き**

---

## 新規 npm パッケージ

```bash
cd frontend && npm install @tiptap/extension-color @tiptap/extension-text-style
```

- `@tiptap/extension-bubble-menu` / `BubbleMenu` コンポーネント: `@tiptap/react` のトランジティブ依存で既にインストール済み
- `@tiptap/extension-link`: StarterKit v3.19.0 に含まれる（別途インストール不要）

---

## ファイル変更一覧

| ファイル | 操作 | 概要 |
|---------|------|------|
| `frontend/package.json` | 修正 | `@tiptap/extension-color`, `@tiptap/extension-text-style` 追加 |
| `frontend/src/components/TaskDetail/BubbleToolbar.tsx` | **新規作成** | バブルメニューUI本体 |
| `frontend/src/components/TaskDetail/MemoEditor.tsx` | 修正 | BubbleToolbar統合、拡張設定変更、入力ルール無効化 |
| `frontend/src/index.css` | 修正 | バブルツールバーCSS追加 |

---

## 実装ステップ

### Step 1: npm パッケージインストール

```bash
cd frontend && npm install @tiptap/extension-color @tiptap/extension-text-style
```

### Step 2: Markdown 入力ルール無効化（MemoEditor.tsx）

StarterKit の Bold/Italic/Strike/Code を `false` で無効化し、代わりに `.extend()` で `addInputRules` を空配列にしたカスタム版を登録。キーボードショートカットは自動的に維持される。

```typescript
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';

const BoldNoInputRules = Bold.extend({ addInputRules() { return []; } });
const ItalicNoInputRules = Italic.extend({ addInputRules() { return []; } });
const StrikeNoInputRules = Strike.extend({ addInputRules() { return []; } });
const CodeNoInputRules = Code.extend({ addInputRules() { return []; } });
```

StarterKit 設定変更:
```typescript
StarterKit.configure({
  heading: { levels: [1, 2, 3] },
  bold: false,    // カスタム版で置換
  italic: false,
  strike: false,
  code: false,
  link: {
    openOnClick: false,  // エディタ内でリンククリック時にナビゲートしない
  },
}),
BoldNoInputRules,
ItalicNoInputRules,
StrikeNoInputRules,
CodeNoInputRules,
TextStyle,
Color,
```

### Step 3: BubbleToolbar コンポーネント作成

**ファイル**: `frontend/src/components/TaskDetail/BubbleToolbar.tsx`

**構成**:
- `BubbleMenu`（`@tiptap/react` から import）を使用
- ボタン: Bold | Italic | Strikethrough | Code | ── | Link | ── | Text Color
- 各ボタンに `title` 属性でキーボードショートカットをツールチップ表示
- `editor.isActive()` でアクティブ状態をハイライト

**表示条件** (`shouldShow`):
- テキスト選択がある場合のみ表示（`from !== to`）
- コードブロック内では非表示（`editor.isActive('codeBlock')` で判定）
- ノード選択（画像等）では非表示

**リンク挿入 UX**:
- Link ボタンクリックでツールバーがインラインURL入力に切り替わる
- 既にリンクの場合は URL をプリフィル + 「削除」ボタン表示
- Enter で適用、Escape でキャンセル
- `⌘+K` でもリンク入力をトグル

**テキスト色ピッカー UX**:
- カラーボタンクリックでドロップダウングリッド表示
- Notion 風のプリセットカラー10色:
  - Default（色解除）, Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red
- ダークテーマ対応: 各色を明るめに調整した variant を用意

### Step 4: MemoEditor に統合

```tsx
return (
  <div className="relative">
    <EditorContent editor={editor} />
    {editor && <BubbleToolbar editor={editor} />}
    {editor && <SlashCommandMenu editor={editor} />}
  </div>
);
```

MemoView からも同じ MemoEditor を使っているため、自動的に Memo 画面にもバブルツールバーが適用される。

### Step 5: CSS スタイリング（index.css）

既存のメモエディタスタイルの後に追加:

- `.bubble-toolbar` — flex, bg, border, rounded, shadow
- `.bubble-toolbar-btn` — 28x28px, hover/active 状態
- `.bubble-toolbar-divider` — 区切り線
- `.bubble-toolbar-link-input` — インラインURL入力
- `.bubble-toolbar-color-picker` — ドロップダウンカラーグリッド
- `.bubble-toolbar-color-swatch` — カラー選択ボタン
- `.memo-editor a` — リンクスタイル

テーマ対応は既存の CSS 変数（`--color-bg-primary`, `--color-border` 等）を使用。

---

## エッジケース対応

| ケース | 対応 |
|--------|------|
| コードブロック内の選択 | `shouldShow` でツールバー非表示 |
| ブロック跨ぎの選択 | BubbleMenu プラグインが自動でバウンディングレクト計算 |
| テーブル内の選択 | CellSelection も BubbleMenu が対応済み |
| リンク入力中のフォーカス移動 | BubbleMenu の `mousedownHandler` が `preventHide` を設定 |
| ノード選択（画像等） | `NodeSelection` チェックで非表示 |
| ダークテーマのテキスト色 | テーマ別カラーマッピング or 両テーマで視認性の良い色を選定 |

---

## 検証方法

1. `cd frontend && npm run dev` でフロントエンド起動
2. タスク詳細画面でテキスト入力 → テキスト選択 → バブルツールバーが表示されること
3. 各ボタン（Bold, Italic, Strikethrough, Code）が正常に動作し、アクティブ状態がハイライトされること
4. Link ボタン → URL入力 → Enter でリンク適用されること
5. テキスト色ボタン → カラーピッカー → 色選択で適用されること
6. `**太字**` などの Markdown 記法入力が**無効化**されていること
7. `⌘+B`, `⌘+I` などのキーボードショートカットは動作すること
8. ボタンホバーでショートカットキーがツールチップ表示されること
9. コードブロック内の選択でツールバーが非表示であること
10. Memo 画面でも同様に動作すること
11. ダーク/ライトテーマ切替で見た目が正しいこと
