# Current Plans

進行中の実装プランを管理するディレクトリ。

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
Status: IN_PROGRESS
Started: YYYY-MM-DD
---
```

## ライフサイクル

```
feature_plans/ (PLANNED) → current_plans/ (IN_PROGRESS) → archive/ (COMPLETED)
```

- 作業開始時に `feature_plans/` から移動
- 完了時に `Completed: YYYY-MM-DD` を追加して `archive/` へ移動
- 番号は各ディレクトリで独立（`feature_plans/001` → `current_plans/001` 可）
