# カレンダー & アナリティクス

## 概要

日々のタスク予定を可視化するカレンダー機能を追加する。月表示・週表示の切替、タスクの予定日時設定、完了/未完了フィルタリングにより、タスクの時間軸での管理を実現する。将来的にはアナリティクス（タスク完了統計など）への拡張を見据える。

## スコープ

### Frontend のみ（localStorage永続化）

- `TaskNode` に `scheduledAt` フィールドを追加
- カレンダーUI（月表示 / 週表示）
- Sidebar に `Calendar` / `Analytics` セクションを追加
- 完了/未完了タブによる表示フィルタリング
- バックエンド連携は `004-backend-reintegration` で対応

## 要件一覧

### P1: カレンダー基本UI
- 月表示カレンダー（現在月を中心に前後ナビゲーション）
- 週表示カレンダー（現在週を中心に前後ナビゲーション）
- 月/週表示の切替ボタン
- 日付セルにタスク名を表示（省略表示対応）
- 1日3件以上のタスクは「+N件」で折りたたみ表示

### P2: タスクへの日時フィールド追加
- `TaskNode.scheduledAt` フィールド追加（ISO 8601文字列）
- 新規タスク作成時に現在日時を自動設定
- TaskDetail上でDateTimePickerによる日時変更
- 既存タスクのマイグレーション（`scheduledAt` 未設定 → `createdAt` をフォールバック）

### P3: 完了/未完了フィルタリング
- カレンダー上部に「未完了」「完了」タブ
- タブ切替でカレンダー上のタスク表示をフィルタ
- デフォルトは「未完了」タブ

### P4: Analytics プレースホルダー
- Sidebar に Analytics セクション追加（将来実装用のスタブ画面）

## データモデル変更

### `TaskNode` 型の拡張（`types/taskTree.ts`）

```typescript
export interface TaskNode {
  // ... 既存フィールド
  scheduledAt?: string;  // ISO 8601 (e.g. "2025-01-15T09:00:00")
}
```

### マイグレーション

localStorageからの読み込み時に `scheduledAt` が未設定のタスクは `createdAt` をフォールバック値として使用する。明示的なデータ変換は行わず、表示時にフォールバックロジックで対応する。

## コンポーネント設計

```
components/Calendar/
├── CalendarView.tsx          # 月/週切替・フィルタタブ管理のルートコンポーネント
├── CalendarHeader.tsx        # 年月表示・前後ナビ・月/週切替ボタン
├── MonthlyView.tsx           # 月表示グリッド（6行 × 7列）
├── WeeklyView.tsx            # 週表示グリッド（1行 × 7列、時間軸あり）
├── DayCell.tsx               # 日付セル（タスクリスト表示、+N件）
├── CalendarTaskItem.tsx      # カレンダー上のタスク1件表示
└── DateTimePicker.tsx        # 日時選択UI（TaskDetailで使用）
```

### コンポーネント責務

| コンポーネント | 責務 |
|-------------|------|
| `CalendarView` | activeView (month/week) 状態、フィルタタブ状態、タスクデータのフィルタリング |
| `CalendarHeader` | 表示期間のナビゲーション（前月/次月、前週/次週）、月/週切替 |
| `MonthlyView` | 月の日付グリッド生成、各日へのタスク振り分け |
| `WeeklyView` | 週の日付グリッド生成、時間スロットへのタスク配置 |
| `DayCell` | 日付表示、タスクリスト（最大2件 + 「+N件」）、当日ハイライト |
| `CalendarTaskItem` | タスク名の省略表示、完了状態の視覚表現（取消線など） |
| `DateTimePicker` | 日付選択カレンダー + 時刻選択、自作コンポーネント（外部ライブラリ不使用） |

## ファイル一覧

### 新規作成（9ファイル）
| ファイル | 説明 |
|---------|------|
| `components/Calendar/CalendarView.tsx` | カレンダールートコンポーネント |
| `components/Calendar/CalendarHeader.tsx` | ナビゲーション・切替ヘッダー |
| `components/Calendar/MonthlyView.tsx` | 月表示 |
| `components/Calendar/WeeklyView.tsx` | 週表示 |
| `components/Calendar/DayCell.tsx` | 日付セル |
| `components/Calendar/CalendarTaskItem.tsx` | タスク表示アイテム |
| `components/Calendar/DateTimePicker.tsx` | 日時選択コンポーネント |
| `components/Analytics/AnalyticsView.tsx` | Analytics スタブ画面 |
| `hooks/useCalendar.ts` | カレンダー表示ロジック（日付計算、タスク振り分け） |

### 変更対象（7ファイル）
| ファイル | 変更内容 |
|---------|---------|
| `types/taskTree.ts` | `TaskNode` に `scheduledAt` 追加 |
| `types/navigation.ts` | `SectionId` に `'calendar'` / `'analytics'` 追加 |
| `components/Layout/Sidebar.tsx` | Calendar / Analytics メニュー項目追加 |
| `components/Layout/MainContent.tsx` | Calendar / Analytics セクションのルーティング追加 |
| `hooks/useTaskTree.ts` | `addNode` で `scheduledAt` デフォルト設定 |
| `components/TaskDetail/TaskDetail.tsx` | DateTimePicker の統合 |
| `App.tsx` | `activeSection` に calendar/analytics を追加（必要に応じて） |

## 実装フェーズ

### Phase 1: カレンダーUI骨格
- `SectionId` 拡張、Sidebar / MainContent にルーティング追加
- `CalendarView`, `CalendarHeader`, `MonthlyView` の基本レイアウト
- 月表示グリッドの描画（タスク表示なし）
- 週表示の基本レイアウト

### Phase 2: `scheduledAt` フィールド追加
- `TaskNode` 型に `scheduledAt` 追加
- `useTaskTree.addNode` でデフォルト値設定（`new Date().toISOString()`）
- `DateTimePicker` コンポーネント作成
- `TaskDetail` に DateTimePicker 統合

### Phase 3: カレンダーへのタスク表示
- `useCalendar` フック作成（日付範囲のタスク抽出・グループ化）
- `DayCell` にタスクリスト表示（最大2件 + 「+N件」）
- `CalendarTaskItem` の省略表示・完了状態スタイリング
- 週表示へのタスク配置

### Phase 4: フィルタリング + Analytics スタブ
- 完了/未完了タブの実装
- タブ切替によるフィルタロジック
- `AnalyticsView` スタブ画面作成

## 技術的考慮事項

### タイムゾーン
- すべての日時はローカルタイムゾーンで表示
- ISO 8601文字列で保存し、表示時に `new Date()` でパース
- タイムゾーン変換は現時点ではスコープ外

### DateTimePicker
- 外部ライブラリ（react-datepicker等）は使用せず自作
- Tailwind CSS でスタイリング（既存デザインとの一貫性）
- カレンダーUIはポップオーバーで表示

### パフォーマンス
- 月表示では対象月のタスクのみフィルタ（全タスクスキャンを毎レンダーで行わない）
- `useMemo` でタスクの日付グループ化をキャッシュ
- 大量タスク時は仮想化を検討（初期実装ではスキップ）

### 既存機能との整合性
- カレンダーからタスクをクリック → `selectedTaskId` 更新 → TaskDetail表示
- タスクの完了/未完了トグルはカレンダー上からも可能にする（将来検討）
- ドラッグ&ドロップによる日付変更は初期スコープ外
