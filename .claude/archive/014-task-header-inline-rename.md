# 014 - タスクヘッダーのインライン名前変更

**Status**: COMPLETED
**Date**: 2026-02-11

## 概要
TaskDetail画面のh1タイトルをクリックしてインライン編集可能にする。

## 変更ファイル
- `frontend/src/components/TaskDetail/TaskDetailHeader.tsx` — isEditingTitle state追加、クリックでinput表示、Enter/Blur保存、Escapeキャンセル
- `frontend/src/components/TaskDetail/TaskDetail.tsx` — onTitleChange prop転送
- `frontend/src/App.tsx` — handleTitleChange コールバック追加

## 技術メモ
- バックエンド変更なし（既存のupdateNodeを使用）
- 既存のTaskNodeEditorパターンを踏襲
