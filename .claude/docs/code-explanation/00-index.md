# Sonic Flow コード説明ドキュメント

## 目的

このドキュメント群は、Sonic Flow のコードベース全体を**ユースケース起点**で説明する。
UI操作 → APIコール → DB処理の流れを1本の線として追跡できる構成になっている。

## 想定読者

- Sonic Flow に初めて触れる開発者
- アーキテクチャの全体像を把握したい人
- 特定機能の実装詳細を確認したい人

## 推奨読み順

1. **[01-architecture-overview.md](./01-architecture-overview.md)** — フルスタック全体図を把握
2. **[02-infrastructure.md](./02-infrastructure.md)** — エントリポイント・設定・共通基盤を理解
3. **興味のある機能フローへ** — 以下の一覧から選択

## ファイル一覧

### 基盤

| ファイル | 対象 | 概要 |
|---------|------|------|
| [01-architecture-overview.md](./01-architecture-overview.md) | 全体 | フルスタックアーキテクチャ全体図 |
| [02-infrastructure.md](./02-infrastructure.md) | 基盤 | エントリポイント・CORS・DB・Axiosクライアント |

### タスク管理（Phase 1: UI + API 実装済み）

| ファイル | 対象ユースケース | 概要 |
|---------|----------------|------|
| [10-task-create.md](./10-task-create.md) | タスク作成 | Enter押下 → POST → DB保存 |
| [11-task-edit-title.md](./11-task-edit-title.md) | タイトル編集 | クリック → インライン編集 → PUT |
| [12-task-toggle-status.md](./12-task-toggle-status.md) | ステータス切替 | チェックボックス → TODO/DONE切替 → completedAt管理 |
| [13-task-delete.md](./13-task-delete.md) | タスク削除 | ゴミ箱アイコン → DELETE → 即時削除 |
| [14-task-view-lists.md](./14-task-view-lists.md) | 一覧表示 | マウント時 → 並列fetch → フィルタ表示 |
| [15-task-focus-mode.md](./15-task-focus-mode.md) | フォーカスモード | フロントエンドのみのUI状態制御 |

### タイマー（Phase 2: Hook + API 実装済み / UI未実装）

| ファイル | 対象ユースケース | 概要 |
|---------|----------------|------|
| [20-timer-settings.md](./20-timer-settings.md) | 設定取得・更新 | シングルトンパターン + デフォルト自動生成 |
| [21-timer-start-session.md](./21-timer-start-session.md) | セッション開始 | startTimer → POST → setInterval開始 |
| [22-timer-countdown-and-stop.md](./22-timer-countdown-and-stop.md) | カウントダウン＋停止 | interval制御 + セッション遷移ロジック |
| [23-timer-session-history.md](./23-timer-session-history.md) | 履歴表示 | 全セッション + タスク別セッション取得 |

### サウンド（Phase 2: Hook + API 実装済み / UI未実装）

| ファイル | 対象ユースケース | 概要 |
|---------|----------------|------|
| [30-sound-settings.md](./30-sound-settings.md) | 設定取得・更新 | Upsertパターン + volumeクランプ |
| [31-sound-preset-crud.md](./31-sound-preset-crud.md) | プリセットCRUD | settingsJsonでミキサー状態を保存/復元 |

## Phase 実装状況マトリクス

| 機能領域 | フロントエンド UI | フロントエンド Hook/API | バックエンド API | DB |
|---------|:-:|:-:|:-:|:-:|
| タスク管理 | ✅ | ✅ | ✅ | ✅ |
| タイマー | ❌ プレースホルダー | ✅ | ✅ | ✅ |
| サウンド | ❌ プレースホルダー | ✅ | ✅ | ✅ |
| AI コーチ | ❌ | ❌ | ❌ | ❌ |
| 設定画面 | ❌ プレースホルダー | ❌ | ❌ | ❌ |

## 表記規約

- ファイルパスは `frontend/src/...` または `backend/src/main/java/com/sonicflow/...` の相対形式
- 行番号は `ファイルパス:行番号` 形式（例: `App.tsx:8`）
- シーケンス図はテキストベースの矢印表記
