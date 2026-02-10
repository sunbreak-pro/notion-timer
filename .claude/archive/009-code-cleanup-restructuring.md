# 009: コードクリーンアップ & ディレクトリ構造整理

> **作成日**: 2026-02-10
> **完了日**: 2026-02-10
> **ステータス**: COMPLETED

---

## Context

Sonic Flowアプリのコードベースを精読した結果、以下の問題が確認された:
- **ディレクトリ構造**: barrel files未整備、ファイル配置不整合、命名規約不統一
- **セキュリティ脆弱性**: SlashCommandMenuのXSS（画像URL未検証）、MIMEバリデーション不足
- **エラーハンドリング**: `.catch(() => {})` によるサイレントエラーが11箇所以上
- **バックエンド**: 循環参照によるStackOverflow、H2コンソール公開、型キャスト不安全

**方針**: 段階的に整理。各Phaseは独立コミット可能。将来的にBE廃止も視野に入れ、BE修正は最小限。

---

## Phase 1: ディレクトリ構造整理（barrel files + ファイル再配置）

### 1a. Barrel `index.ts` 追加（5ファイル新規作成）

各ディレクトリにre-export用のbarrel fileを追加し、importの簡潔化を可能にする。

| ディレクトリ | 新規ファイル | re-export対象 |
|---|---|---|
| `src/api/` | `index.ts` | aiClient, memoClient, soundClient, taskClient, timerClient |
| `src/context/` | `index.ts` | 全Provider + Context + 型 |
| `src/hooks/` | `index.ts` | 全publicフック（testファイル除外） |
| `src/types/` | `index.ts` | 全型定義 |
| `src/utils/` | `index.ts` | breadcrumb, duration, folderColor, folderTag |

### 1b. `ErrorBoundary.tsx` を `shared/` へ移動

- **移動元**: `frontend/src/components/ErrorBoundary.tsx`
- **移動先**: `frontend/src/components/shared/ErrorBoundary.tsx`
- **import更新**: `frontend/src/main.tsx`

### 1c. `navigation.ts` を `taskTree.ts` へ統合

`SectionId`型を `taskTree.ts` 先頭へ移動し、`navigation.ts` を削除。import 4箇所更新。

### コミット
```
refactor: ディレクトリ構造整理（barrel files追加、ErrorBoundary移動、navigation.ts統合）
```

---

## Phase 2: Context ファイル命名規約統一（camelCase → PascalCase）

### リネーム（4ファイル）

| 旧ファイル名 | 新ファイル名 |
|---|---|
| `context/audioContextValue.ts` | `context/AudioContextValue.ts` |
| `context/themeContextValue.ts` | `context/ThemeContextValue.ts` |
| `context/timerContextValue.ts` | `context/TimerContextValue.ts` |
| `context/taskTreeContextValue.ts` | `context/TaskTreeContextValue.ts` |

import 8箇所 + barrel file更新。

### コミット
```
style: Context Valueファイル名をPascalCaseに統一
```

---

## Phase 3: フロントエンド エラーハンドリング改善

### 3a. `.catch(() => {})` サイレントエラー → `console.warn` 追加

| ファイル | 箇所数 | タグ |
|---|---|---|
| `context/TimerContext.tsx` | 5 | `[Timer]` |
| `hooks/useLocalSoundMixer.ts` | 2 | `[Sound]` |
| `hooks/useMemos.ts` | 2 | `[Memo]` |
| `hooks/useTaskTreeAPI.ts` | 1 | `[TaskTree]` |

### 3b. JSON.parse 失敗時のログ追加

| ファイル | タグ |
|---|---|
| `hooks/useTaskTree.ts` | `[TaskTree]` |
| `hooks/useMemos.ts` | `[Memo]` |
| `hooks/useCustomSounds.ts` | `[CustomSounds]` |

### コミット
```
fix: サイレントエラーにconsole.warn追加（デバッグ性改善）
```

---

## Phase 4: セキュリティ脆弱性修正

### 4a. XSS脆弱性: SlashCommandMenu.tsx 画像URL検証

`window.prompt()`のURLを`new URL()`でパースし、`http:`/`https:`プロトコルのみ許可。`javascript:`や`data:`スキームをブロック。

### 4b. MIME検証強化: useCustomSounds.ts マジックバイトチェック

ファイル先頭12バイトで実際の形式を検証（MP3 ID3/sync, WAV RIFF+WAVE, OGG OggS）。

### コミット
```
fix: XSS脆弱性修正（画像URL検証）+ MIME検証強化
```

---

## Phase 5: バックエンド クラッシュ防止 & セキュリティ

### 5a. H2 Console を dev プロファイルのみに制限

`application.properties` で `spring.h2.console.enabled=false` に変更。
`application-dev.properties` を新規作成し、devプロファイルでのみ有効化。

### 5b. 循環参照防止: TaskService.java

`Set<String> visited` で訪問済みノードを追跡し、無限再帰を防止。

### 5c. 型キャスト安全化: TimerController.java

`instanceof`パターンマッチングで安全にキャスト。

### 5d. 日付パース安全化: MemoController.java

`parseDate()`ヘルパーメソッドで`DateTimeParseException` → `ResponseStatusException(400)` に変換。

### 5e. AIService.java: Jackson による安全なJSON解析

手動`indexOf`パースを`ObjectMapper.readTree()` に置換。

### コミット
```
fix: BE クラッシュ防止（循環参照、型キャスト、日付パース、H2制限）
```

---

## Phase 6: グローバル例外ハンドラー追加

`GlobalExceptionHandler.java` を `@ControllerAdvice` で新規作成。

- `IllegalArgumentException` → 400
- `DateTimeParseException` → 400
- `Exception` → 500（ログ出力、詳細は非公開）

### コミット
```
fix: グローバル例外ハンドラー追加（@ControllerAdvice）
```

---

## 変更ファイル一覧

| Phase | 新規 | 編集 | 移動/リネーム | 削除 | 合計 |
|-------|------|------|-------------|------|------|
| 1 | 5 | 5 | 1 | 1 | 12 |
| 2 | 0 | 8 | 4 | 0 | 12 |
| 3 | 0 | 6 | 0 | 0 | 6 |
| 4 | 0 | 2 | 0 | 0 | 2 |
| 5 | 1 | 5 | 0 | 0 | 6 |
| 6 | 1 | 0 | 0 | 0 | 1 |
| **合計** | **7** | **26** | **5** | **1** | **39** |

---

## コミット履歴

| コミット | メッセージ |
|---------|----------|
| `aae0c4c` | refactor: ディレクトリ構造整理（barrel files追加、ErrorBoundary移動、navigation.ts統合） |
| `2430562` | style: Context Valueファイル名をPascalCaseに統一 |
| `0415570` | fix: サイレントエラーにconsole.warn追加（デバッグ性改善） |
| `7987345` | fix: XSS脆弱性修正（画像URL検証）+ MIME検証強化 |
| `3484db9` | fix: BE クラッシュ防止（循環参照、型キャスト、日付パース、H2制限） |
| `316a599` | fix: グローバル例外ハンドラー追加（@ControllerAdvice） |
| `2132061` | docs: 009コードクリーンアップ完了記録（CHANGELOG, README） |
