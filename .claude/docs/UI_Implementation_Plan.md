# Sonic Flow - UI-First Implementation Plan

## Context

Phase 1（タスクCRUD + Notion風レイアウト）は完了済み。Phase 2として、UI-Firstアプローチで全画面を構築し、その後バックエンドを統合する。現在のフラットなタスクリストを階層構造に刷新し、タイマー+環境音ミキサーを統合した「作業画面」を新設する。

---

## 確定要件

| 項目 | 決定内容 |
|------|----------|
| サイドバー | **Tasks / Session / Settings** の3項目のみ |
| タスク構造 | **3階層**: フォルダ → サブフォルダ → タスク（VSCode風ツリー） |
| ドラッグ&ドロップ | フォルダ間移動・並び替え対応 |
| 作業画面 | **オーバーレイ表示**（Play押下で起動） |
| 作業画面の内容 | タイマー中央 + 環境音BGMバー下部（YouTube風） |
| Focus Mode | **廃止** → 作業画面に統合 |
| ダークモード | **最初から対応** |
| 環境音 | 自然音6種（Rain, Thunder, Wind, Ocean, Birds, Fire） |
| ミキサーUI | **カードグリッド** |
| Settings | ダークモード / フォントサイズ(S/M/L) / ゴミ箱復元 |
| Trash | サイドバーから**削除**、Settings内で復元 |

---

## サイドバー各セクションの仕様

### Tasks セクション
**メインコンテンツに表示される内容:**
- VSCode風の階層ツリービュー
  - フォルダ（ルートレベルのみ）: 展開/折りたたみ、配下にサブフォルダまたはタスクを持つ
  - サブフォルダ（フォルダ内のみ）: 展開/折りたたみ、配下にタスクを持つ
  - タスク（フォルダまたはサブフォルダ内）: チェックボックス、インライン編集、Playボタン、削除
- ドラッグ&ドロップで並び替え・移動
- 「+ New Folder」ボタン（ルートレベルにフォルダ追加）
- 完了済みタスクの折りたたみセクション

**タスクのPlayボタン:**
- クリックすると**作業画面オーバーレイ**が起動
- オーバーレイにはタスク名が表示される

### Session セクション
**メインコンテンツに表示される内容:**
- タイマー＋環境音ミキサーを**メインコンテンツ内**に表示（タスク非紐付けのフリーセッション）
- Playボタンからの起動とは異なり、特定タスクに紐付かない独立した作業セッション
- レイアウトは作業画面オーバーレイと同一構成（タイマー中央 + BGMバー下部）

### Settings セクション
**メインコンテンツに表示される内容:**
- **外観**: ダークモード切替トグル
- **外観**: フォントサイズ選択（Small / Medium / Large）
- **ゴミ箱**: 削除済みアイテム一覧 + 復元ボタン

---

## 作業画面（Work Screen）の詳細仕様

### 起動方法
1. **タスクのPlayボタン** → オーバーレイモード（タスク名表示、`fixed inset-0 z-50`）
2. **Session サイドバー** → メインコンテンツモード（タスク非紐付け）

### レイアウト構成
```
┌─────────────────────────────────────┐
│ [タスク名 or "Free Session"]    [✕] │  ← ヘッダー
├─────────────────────────────────────┤
│                                     │
│              WORK                   │  ← セッションタイプ
│             25:00                   │  ← タイマー（大きく中央）
│         [▶] [⏹] [↻]               │  ← コントロール
│        Session 1 of 4              │  ← セッションカウンター
│                                     │
│  ═══════════════════════════════    │  ← プログレスバー（YouTube風）
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Rain │ │Thunder│ │ Wind │       │  ← サウンドカードグリッド
│  │  🌧  │ │  ⚡  │ │  💨  │       │    （3x2グリッド）
│  │ ━━━  │ │ ━━━  │ │ ━━━  │       │    各カード: アイコン+スライダー
│  └──────┘ └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Ocean │ │Birds │ │ Fire │       │
│  │  🌊  │ │  🐦  │ │  🔥  │       │
│  │ ━━━  │ │ ━━━  │ │ ━━━  │       │
│  └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
```

### タイマー仕様
- 25分作業 → 5分休憩 → ... → 4セッション後に15分長休憩
- Start / Pause / Reset コントロール
- セッションタイプ表示: WORK / BREAK / LONG_BREAK
- プログレスバー: 経過時間を%で表示（4px高さ、アクセントカラー）

### サウンドカード仕様
- 6枚のカード: Rain, Thunder, Wind, Ocean, Birds, Fire
- 各カード: Lucideアイコン + 名前 + ON/OFFトグル + 音量スライダー(0-100)
- 3列 x 2行のグリッドレイアウト
- UI-First段階ではオーディオ再生なし（状態管理のみ）

---

## 実装フェーズ

### Phase 2-1: ダークモード基盤
**目的**: CSS変数でテーマ切替の基盤を構築

**修正ファイル:**
- `src/index.css` — `:root`にライト変数、`[data-theme="dark"]`にダーク変数を定義し、`@theme`からCSS変数を参照

**新規ファイル:**
- `src/context/ThemeContext.tsx` — テーマ状態 + フォントサイズ状態、localStorage永続化
- `src/hooks/useTheme.ts` — ThemeContext便利フック

**修正ファイル:**
- `src/main.tsx` — `<ThemeProvider>`でラップ

**ダークモード カラーパレット:**
| トークン | Light | Dark |
|----------|-------|------|
| bg-primary | #FFFFFF | #191919 |
| bg-secondary | #F7F6F3 | #202020 |
| text-primary | #37352F | #E8E8E3 |
| text-secondary | #787774 | #9B9A97 |
| border | #E9E9E7 | #2F2F2F |
| accent | #2EAADC | #529CCA |
| hover | #EFEFEF | #2F2F2F |
| success | #0F7B6C | #4DAB9A |
| danger | #E03E3E | #E06666 |

**フォントサイズ:**
- Small: 14px / Medium: 16px（デフォルト） / Large: 18px
- `--font-size-base` CSS変数で制御、bodyに適用

---

### Phase 2-2: サイドバー再構成
**目的**: 5項目 → 3項目（Tasks / Session / Settings）

**修正ファイル:**
- `src/components/Layout/Sidebar.tsx` — menuItems変更、Headphones(or Music)アイコン追加
- `src/App.tsx` — renderContent内の`case 'sounds'`, `case 'timer'`削除、`case 'session'`追加

**新規ファイル:**
- `src/types/navigation.ts` — `type SectionId = 'tasks' | 'session' | 'settings'`

---

### Phase 2-3: 階層タスクツリー
**目的**: フラットなタスクリストを3階層ツリーに刷新

**新規依存パッケージ:**
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

**新規ファイル:**
- `src/types/taskTree.ts` — TaskNode型（id, type, title, parentId, order, status等）
- `src/hooks/useTaskTree.ts` — ローカルState + localStorage永続化（API呼び出しなし）
- `src/mocks/taskTree.ts` — 初期モックデータ
- `src/context/TaskTreeContext.tsx` — TaskTree状態をContext化（Settings TrashBinと共有のため）
- `src/components/TaskTree/TaskTree.tsx` — ルートコンテナ
- `src/components/TaskTree/TaskTreeNode.tsx` — 再帰的ツリーノード
- `src/components/TaskTree/TaskTreeInput.tsx` — インライン追加入力
- `src/components/TaskTree/index.ts` — バレルエクスポート

**修正ファイル:**
- `src/App.tsx` — useTasks → useTaskTreeContext、FocusMode状態削除、TaskList → TaskTree
- `src/main.tsx` — `<TaskTreeProvider>`でラップ

**非推奨化（インポート停止）:**
- `src/components/TaskList/*` — TaskTreeに置換
- `src/hooks/useTasks.ts` — useTaskTreeに置換
- `src/api/tasks.ts`, `src/api/client.ts` — UI-First段階では不要

**ドラッグ&ドロップ制約:**
- フォルダはルートレベルのみ
- サブフォルダはフォルダ内のみ
- タスクはフォルダまたはサブフォルダ内のみ
- 自身の子孫へのドロップ禁止

---

### Phase 2-4: 作業画面（Work Screen）
**目的**: タイマー + 環境音ミキサーのオーバーレイ/メインコンテンツ画面

**新規ファイル:**
- `src/constants/sounds.ts` — SOUND_TYPES定義（6種のtype, label, icon）
- `src/hooks/useLocalTimer.ts` — ローカルタイマーフック（setInterval、API呼び出しなし）
- `src/hooks/useLocalSoundMixer.ts` — ローカル環境音状態フック（localStorage永続化）
- `src/components/WorkScreen/WorkScreen.tsx` — オーバーレイコンテナ
- `src/components/WorkScreen/TimerDisplay.tsx` — 大型タイマー + コントロール
- `src/components/WorkScreen/TimerProgressBar.tsx` — YouTube風プログレスバー
- `src/components/WorkScreen/SoundMixer.tsx` — カードグリッドコンテナ
- `src/components/WorkScreen/SoundCard.tsx` — 個別サウンドカード
- `src/components/WorkScreen/index.ts` — バレルエクスポート

**修正ファイル:**
- `src/App.tsx` — workScreenTask状態追加、オーバーレイ条件付きレンダリング、Session表示

**Lucideアイコンマッピング:**
- Rain: `CloudRain`, Thunder: `CloudLightning`, Wind: `Wind`
- Ocean: `Waves`, Birds: `Bird`, Fire: `Flame`

**非推奨化:**
- `src/hooks/useTimer.ts` → useLocalTimerに置換
- `src/hooks/useSoundSettings.ts` → useLocalSoundMixerに置換
- `src/api/timerSettings.ts`, `src/api/soundSettings.ts` — UI-First段階では不要

---

### Phase 2-5: Settings画面
**目的**: ダークモード切替 + フォントサイズ + ゴミ箱復元

**新規ファイル:**
- `src/components/Settings/Settings.tsx` — 設定ページコンテナ
- `src/components/Settings/AppearanceSettings.tsx` — テーマトグル + フォントサイズ選択
- `src/components/Settings/TrashBin.tsx` — 削除済みアイテム一覧 + 復元
- `src/components/Settings/index.ts` — バレルエクスポート

**修正ファイル:**
- `src/App.tsx` — `case 'settings'`でSettingsコンポーネントをレンダリング

---

### Phase 3（将来）: バックエンド統合
- Spring Boot + H2 Databaseセットアップ
- Task Entityに`parentId`, `type`, `order`, `isDeleted`追加
- ローカルフックをAPIフックに置換
- 音声ファイル再生（Web Audio API）
- タイマーセッション永続化

---

## 新規ファイル一覧

| ファイル | Phase | 説明 |
|----------|-------|------|
| `src/context/ThemeContext.tsx` | 2-1 | ダークモード + フォントサイズContext |
| `src/hooks/useTheme.ts` | 2-1 | テーマ便利フック |
| `src/types/navigation.ts` | 2-2 | SectionId型定義 |
| `src/types/taskTree.ts` | 2-3 | TaskNode型定義 |
| `src/hooks/useTaskTree.ts` | 2-3 | ローカルタスクツリー管理 |
| `src/mocks/taskTree.ts` | 2-3 | モックデータ |
| `src/context/TaskTreeContext.tsx` | 2-3 | TaskTreeコンテキスト |
| `src/components/TaskTree/*.tsx` | 2-3 | ツリーUIコンポーネント群 |
| `src/constants/sounds.ts` | 2-4 | サウンド定数定義 |
| `src/hooks/useLocalTimer.ts` | 2-4 | ローカルタイマーフック |
| `src/hooks/useLocalSoundMixer.ts` | 2-4 | ローカルサウンドフック |
| `src/components/WorkScreen/*.tsx` | 2-4 | 作業画面コンポーネント群 |
| `src/components/Settings/*.tsx` | 2-5 | 設定画面コンポーネント群 |

## 修正ファイル一覧

| ファイル | Phase | 変更内容 |
|----------|-------|----------|
| `src/index.css` | 2-1 | CSS変数でライト/ダークテーマ定義 |
| `src/main.tsx` | 2-1, 2-3 | ThemeProvider, TaskTreeProviderでラップ |
| `src/components/Layout/Sidebar.tsx` | 2-2 | 3項目に変更 |
| `src/App.tsx` | 2-2〜2-5 | 全フェーズで段階的に修正 |

## 新規依存パッケージ

| パッケージ | 用途 | Phase |
|------------|------|-------|
| `@dnd-kit/core` | D&D基盤 | 2-3 |
| `@dnd-kit/sortable` | ソート対応 | 2-3 |
| `@dnd-kit/utilities` | CSSユーティリティ | 2-3 |

---

## 検証方法

各フェーズ完了時に以下を確認:
1. **Phase 2-1**: ダーク/ライト切替で全コンポーネントが正常表示、リロード後も保持
2. **Phase 2-2**: サイドバー3項目のみ、タブ切替正常動作
3. **Phase 2-3**: フォルダ作成、タスク追加、D&D移動、インライン編集、localStorage永続化
4. **Phase 2-4**: Play押下でオーバーレイ表示、タイマー動作、サウンドカードUI動作
5. **Phase 2-5**: ダークモード切替、フォントサイズ変更、削除アイテム復元

全フェーズ通して `npm run dev` で動作確認（バックエンド不要）。
