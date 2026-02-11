# Feature Plans

実装プラン（起案〜進行中）を管理するディレクトリ。

## 命名規則

```
NNN-<slug>.md
```

- `NNN`: 3桁の連番（ディレクトリ内で独立採番）
- `<slug>`: ケバブケースの短い説明

## ステータスヘッダー

各ファイルの先頭に以下を記載:

```markdown
---
Status: PLANNED | IN_PROGRESS
Started: YYYY-MM-DD  # IN_PROGRESS 時に追加
---
```

- `PLANNED`: 起案済み・未着手
- `IN_PROGRESS`: 作業中

## TODO.md との関係

- `TODO.md` はロードマップ（概要 + リンク）
- このディレクトリが詳細仕様

## ファイル構成

各ファイルには以下を含める:
- 概要・背景
- 実装スコープ
- 主要タスク
- 技術的な考慮事項

## ライフサイクル

```
feature_plans/ (PLANNED → IN_PROGRESS) → archive/ (COMPLETED)
```

- 作業開始時にステータスを `IN_PROGRESS` に変更し `Started` 日付を追加
- 完了時に `Completed: YYYY-MM-DD` を追加して `archive/` へ移動
