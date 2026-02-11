# 016 - タスクタグとノートタグの完全分離

**Status**: COMPLETED
**Date**: 2026-02-11

## 概要
統合tags テーブルを廃止し、task_tag_definitions / note_tag_definitions に分離。タスクタグとノートタグを完全に独立管理可能にする。

## DB Migration
- V6: task_tag_definitions + note_tag_definitions作成、データ移行、junction table再作成、tags削除

## 変更ファイル
### Backend
- `electron/database/migrations.ts` — migrateV6追加
- `electron/database/tagRepository.ts` — createTagRepository(db, type) ファクトリパターンに書換
- `electron/ipc/tagHandlers.ts` — db:taskTags:* / db:noteTags:* チャンネル
- `electron/ipc/noteHandlers.ts` — タグハンドラ削除（tagHandlersに移動）
- `electron/database/noteRepository.ts` — タグ関連コード削除
- `electron/ipc/registerAll.ts` — 2インスタンス作成
- `electron/preload.ts` — チャンネル更新
- `electron/ipc/dataIOHandlers.ts` — 新テーブル名でexport/import

### Frontend
- `frontend/src/services/DataService.ts` + `ElectronDataService.ts` — 新メソッド追加
- `frontend/src/hooks/useTags.ts` — type パラメータ化
- `frontend/src/context/TagContext.tsx` — { taskTags, noteTags } 分離
- `frontend/src/hooks/useTagContext.ts` — 型更新
- `frontend/src/components/Tags/TagEditor.tsx` — taskTags使用
- `frontend/src/components/Tags/TagFilter.tsx` — taskTags使用
- `frontend/src/components/Tags/TagManager.tsx` — 2セクション（Task/Note）
- `frontend/src/components/Memo/NoteTagBar.tsx` — noteTags使用
- `frontend/src/components/TaskTree/TaskTreeNode.tsx` — taskTags使用
- `frontend/src/components/Calendar/CalendarTaskItem.tsx` — taskTags使用
- `frontend/src/components/TaskTree/TaskTree.tsx` — taskTags使用
- `frontend/src/components/Memo/NoteList.tsx` — noteTags使用
- `frontend/src/hooks/useNotes.ts` — 新API使用
