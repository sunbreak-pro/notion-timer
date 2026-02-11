# 015 - タスク期限（dueDate）トグル付き

**Status**: COMPLETED
**Date**: 2026-02-11

## 概要
タスクにdueDate（期限）フィールドを追加。Flagアイコンでトグル、DateTimePickerで日時選択。

## DB Migration
- V5: `ALTER TABLE tasks ADD COLUMN due_date TEXT`

## 変更ファイル
### Backend
- `electron/database/migrations.ts` — migrateV5追加
- `electron/types.ts` — TaskNodeにdueDate追加
- `electron/database/taskRepository.ts` — due_dateカラム対応（row変換、SQL文更新）
- `electron/ipc/dataIOHandlers.ts` — import/exportにdue_date追加

### Frontend
- `frontend/src/types/taskTree.ts` — dueDate追加
- `frontend/src/components/Calendar/DateTimePicker.tsx` — icon/label/activeColor props追加
- `frontend/src/components/TaskDetail/TaskDetailHeader.tsx` — Flagアイコン+DateTimePicker追加
- `frontend/src/components/TaskDetail/TaskDetail.tsx` — onDueDateChange prop転送
- `frontend/src/App.tsx` — handleDueDateChange追加
