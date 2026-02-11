# 017 - サウンドタグ + Session→Music画面リデザイン

**Status**: COMPLETED
**Date**: 2026-02-11

## 概要
サウンドにタグ・表示名カスタマイズ機能を追加。SessionセクションをMusicにリネームし、サウンド管理専用画面を新規作成。

## DB Migration
- V7: sound_tag_definitions, sound_tag_assignments, sound_display_meta テーブル作成

## 変更ファイル
### Backend
- `electron/database/migrations.ts` — migrateV7追加
- `electron/types.ts` — SoundTag, SoundDisplayMeta型追加
- `electron/database/soundRepository.ts` — サウンドタグCRUD、紐付け、表示名メソッド追加
- `electron/ipc/soundHandlers.ts` — 9新IPCハンドラ追加
- `electron/preload.ts` — 9チャンネル追加
- `electron/ipc/dataIOHandlers.ts` — sound tag tables export/import追加

### Frontend: サービス・型
- `frontend/src/types/sound.ts` — SoundTag, SoundDisplayMeta追加
- `frontend/src/services/DataService.ts` + `ElectronDataService.ts` — 9メソッド追加

### Frontend: セクション名変更
- `frontend/src/types/taskTree.ts` — SectionId 'session' → 'music'
- `frontend/src/components/Layout/LeftSidebar.tsx` — Music アイコン・ラベル
- `frontend/src/components/Layout/Sidebar.tsx` — 同上
- `frontend/src/App.tsx` — コマンドパレット、sectionMap、renderContent更新

### Frontend: 新コンポーネント
- `frontend/src/hooks/useSoundTags.ts` — サウンドタグstate管理フック
- `frontend/src/components/Music/MusicScreen.tsx` — 音楽管理画面
- `frontend/src/components/Music/MusicSoundItem.tsx` — サウンドカード
- `frontend/src/components/Music/SoundTagEditor.tsx` — サウンド別タグ割当
- `frontend/src/components/Music/SoundTagFilter.tsx` — タグフィルター
