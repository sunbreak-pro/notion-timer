# 006 - Calendar Enhancement

**Status**: COMPLETED
**Created**: 2026-02-09

## Overview
カレンダー機能の大幅拡張:
- フォルダカラーシステム（自動割当 + タスク継承）
- フォルダタグ表示（階層パス）
- カレンダーからの直接タスク作成
- Weekly表示をGoogle Calendar風の時間軸UIに刷新

## Phases

### Phase 1: フォルダカラーシステム
- TaskNode に `color?: string` 追加
- 10色のNotionライクパステルカラーパレット
- フォルダ作成時に自動カラー割当
- タスクは親フォルダのカラーを継承（resolveTaskColor）
- バックエンド: Task entity + DTO に color 追加

### Phase 2: フォルダタグ
- 親フォルダ階層パスをタグとして計算（getFolderTag）
- FolderTag コンポーネント（パステルカラーpill/badge）
- CalendarTaskItem, TaskDetailHeader に表示

### Phase 3: カレンダーからタスク作成
- DayCell に hover 時 + ボタン表示
- クリック → 無題タスク作成（scheduledAt=クリック日付）→ WorkScreen モーダル即時表示
- addNode の options 引数拡張

### Phase 4: Weekly表示 時間軸UI
- WeeklyTimeGrid コンポーネント（Google Calendar風）
- TimeGridTaskBlock コンポーネント
- 時刻ラベル + 水平グリッド線 + 現在時刻インジケーター
- タスクブロックの時間位置配置 + 重複処理

## Files

### New (7)
- `frontend/src/constants/folderColors.ts`
- `frontend/src/constants/timeGrid.ts`
- `frontend/src/utils/folderColor.ts`
- `frontend/src/utils/folderTag.ts`
- `frontend/src/components/shared/FolderTag.tsx`
- `frontend/src/components/Calendar/WeeklyTimeGrid.tsx`
- `frontend/src/components/Calendar/TimeGridTaskBlock.tsx`

### Modified (14)
- `frontend/src/types/taskTree.ts`
- `frontend/src/hooks/useTaskTreeCRUD.ts`
- `frontend/src/hooks/useTaskTreeAPI.ts`
- `frontend/src/context/taskTreeContextValue.ts`
- `frontend/src/api/taskClient.ts`
- `frontend/src/components/Calendar/DayCell.tsx`
- `frontend/src/components/Calendar/CalendarTaskItem.tsx`
- `frontend/src/components/Calendar/CalendarView.tsx`
- `frontend/src/components/Calendar/MonthlyView.tsx`
- `frontend/src/components/TaskDetail/TaskDetailHeader.tsx`
- `frontend/src/App.tsx`
- `backend/.../entity/Task.java`
- `backend/.../dto/TaskNodeDTO.java`
- `backend/.../service/TaskService.java`
