---
name: git-workflow
description: Sonic Flow の Git ワークフロー規約。Use when committing, branching, or preparing PRs. Triggers include commit, push, branch creation, PR preparation.
---

「git-workflowを起動します」と表示する。

## コミット形式

```
<type>: <subject>
```

| type       | 用途                               |
| ---------- | ---------------------------------- |
| `feat`     | 新機能追加                         |
| `fix`      | バグ修正                           |
| `docs`     | ドキュメントのみ                   |
| `style`    | フォーマット変更（動作に影響なし） |
| `refactor` | リファクタリング                   |
| `test`     | テスト追加・修正                   |
| `chore`    | ビルド・設定変更                   |

- scope は**付けない**（`feat(timer):` ではなく `feat: ...`）
- subject は英語、簡潔に

## プレコミットチェックリスト

1. `cd frontend && npm run lint` — ESLint通過
2. `cd frontend && npm run test` — テスト通過
3. IPC変更がある場合、以下3点が揃っているか確認:
   - `electron/preload.ts` (ALLOWED_CHANNELS)
   - `electron/ipc/*Handlers.ts`
   - `frontend/src/services/ElectronDataService.ts`

## コミット禁止ファイル

以下はステージングしない:

- `public/sounds/*` — 音源ファイル（.gitignore対象）
- `.env`, `*.db` — 秘密情報・データファイル
- `node_modules/`, `dist/`, `out/` — ビルド成果物

## README更新ルール

コード変更の作業完了時は**必ず**:

1. `README.md` の開発ジャーナルに日付付きエントリ追加（降順）
2. 機能追加・削除時は「主な機能」セクションも更新
3. アーキテクチャ変更時は「技術スタック」「セットアップ」も更新

## プラン管理

- 実装プラン: `.claude/feature_plans/` → 完了後 `.claude/archive/` へ移動
- 完了時: Status を `COMPLETED` に更新 → `CHANGELOG.md` に追記
