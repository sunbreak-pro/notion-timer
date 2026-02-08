---
Status: COMPLETED
Started: 2026-02-07
Completed: 2026-02-08
---

# Documentation Update Plan

Phase 2 UI実装完了後、ドキュメントが実際のコードと乖離している箇所の分析と更新方針

---

## 1. Application_Overview.md

### 更新が必要な箇所

| 項目 | 現在の記述 | 実際 | 優先度 |
|------|-----------|------|--------|
| Java Version | Java 21 (LTS) | Java 23 | **High** |
| Phase実装状況 | タイマー/サウンド: Hook+API実装済み/UI未実装 | タイマーUI実装済み、サウンドUI実装済み | **High** |
| フロントエンド構成 | `api/` ディレクトリ記載 | Phase 2で`api/`削除済み（localStorage移行） | **High** |
| データモデル | フラットTask (id, title, status) | ツリー構造TaskNode (parentId, order, content, workDurationMinutes等) | **High** |
| コンポーネント一覧 | TaskList, NoiseMixer, FocusTimer, AICoach | TaskTree, TaskDetail, WorkScreen, Settings, NoiseMixer | **Medium** |
| データ永続化 | バックエンド(H2)で永続化 | Phase 2はlocalStorage使用 | **Medium** |

---

## 2. ADR 0001: Tech Stack

### 更新が必要な箇所

| 項目 | 現在の記述 | 実際 | 優先度 |
|------|-----------|------|--------|
| Java Version | Java 21 (LTS) | Java 23 | **High** |
| 決定理由 | LTS版の安定性 | 非LTS版への変更理由を追記すべき | **Medium** |

---

## 3. code-explanation/ (15ファイル) 乖離分析

### 基盤ドキュメント

#### 00-index.md
| 現在の記述 | 実際のコード | 優先度 |
|-----------|------------|--------|
| Phase実装マトリクス: タイマーUI ❌、サウンドUI ❌ | 両方とも実装済み | **High** |
| タスク管理: 「Phase 1: UI + API 実装済み」 | Phase 2でツリー構造に全面改修 | **High** |
| タイマー: 「Phase 2: Hook + API 実装済み / UI未実装」 | UI実装済み、API接続は削除 | **High** |

**更新方針**: Phase実装マトリクスの全面更新。Phase 2完了状態を反映

#### 01-architecture-overview.md
| 現在の記述 | 実際のコード | 優先度 |
|-----------|------------|--------|
| フルスタック構成（Frontend → Backend API → DB） | Phase 2はフロントエンドのみ（localStorage） | **High** |
| Axiosクライアント経由のAPI通信 | api/ディレクトリ削除済み | **High** |
| コンポーネント構成図 | TaskList → TaskTree に変更 | **High** |

**更新方針**: Phase 2アーキテクチャ図を追加。localStorage依存の現状を明記

#### 02-infrastructure.md
| 現在の記述 | 実際のコード | 優先度 |
|-----------|------------|--------|
| Axiosクライアント (`api/client.ts`) の説明 | ファイル削除済み | **High** |
| エントリポイント構成 | Provider構成が変更（TimerProvider, TaskTreeProvider追加） | **Medium** |

**更新方針**: Axiosセクションを削除またはアーカイブ。Provider構成の説明を追加

### タスク管理ドキュメント (10-15)

#### 10-task-create.md
**更新方針**: 全面書き直し。ローカル状態管理のフローに更新

#### 11-task-edit-title.md
**更新方針**: 全面書き直し

#### 12-task-toggle-status.md
**更新方針**: 全面書き直し

#### 13-task-delete.md
**更新方針**: 全面書き直し。ソフトデリートパターンの説明を追加

#### 14-task-view-lists.md
**更新方針**: 全面書き直し。ツリー構造の表示ロジックに更新

#### 15-task-focus-mode.md
**更新方針**: WorkScreenの機能説明に更新

### タイマードキュメント (20-23)

#### 20-timer-settings.md
**更新方針**: 全面書き直し。TimerContext.tsxベースの説明に

#### 21-timer-start-session.md
**更新方針**: 全面書き直し

#### 22-timer-countdown-and-stop.md
**更新方針**: コード参照先の更新。ロジック説明はある程度流用可能

#### 23-timer-session-history.md
**更新方針**: 「未実装」として凍結。将来Backend再接続時に復活

### サウンドドキュメント (30-31)

#### 30-sound-settings.md
**更新方針**: 全面書き直し

#### 31-sound-preset-crud.md
**更新方針**: API部分を削除し、localStorage実装に更新

---

## 4. README.md / TODO.md

| ドキュメント | 更新内容 | 優先度 |
|------------|---------|--------|
| README.md | Phase 2完了状態の反映。開発ジャーナルの更新 | **Medium** |
| TODO.md | 完了タスクのチェック。Phase 3タスクの追加 | **Medium** |

---

## 5. 更新優先度サマリー

### High (即座に更新すべき)
1. `00-index.md` — Phase実装マトリクスが完全に陳腐化
2. `01-architecture-overview.md` — アーキテクチャ図がPhase 1のまま
3. `Application_Overview.md` — Java 21→23、データモデル不整合
4. `02-infrastructure.md` — Axiosクライアント記述の削除
5. タスク管理ドキュメント (10-14) — 全てAPI前提の記述で全面書き直し必要
6. タイマードキュメント (20-21) — API前提の記述で全面書き直し必要
7. `30-sound-settings.md` — API前提の記述

### Medium (次のフェーズ開始前に更新)
8. `ADR 0001` — Java 23への変更理由追記
9. `15-task-focus-mode.md` — WorkScreen実装の反映
10. `22-timer-countdown-and-stop.md` — コード参照先更新
11. `31-sound-preset-crud.md` — localStorage実装への更新
12. `README.md` / `TODO.md` — Phase 2完了反映

### Low (時間がある時に更新)
13. `23-timer-session-history.md` — 未実装機能として凍結

---

## 6. 推奨アプローチ

1. **Phase実装マトリクスの即時更新** — 開発者が最初に見る箇所
2. **アーキテクチャ図の更新** — Phase 2の「localStorage中心」構成を明記
3. **各機能ドキュメントはコード変更時に逐次更新** — 一括書き直しは工数大
4. **Phase 1 API記述は「アーカイブ」セクションに移動** — 将来のBackend再接続時に参照
