# Music Library (Playlist) 実装プラン

**Status: COMPLETED**
**Date: 2026-02-14**

## 概要

Sonic Flow の Music 画面にプレイリスト（ライブラリ）機能を追加。環境音ミキサーと排他で、楽曲を1曲ずつシーケンシャル再生する方式。

## 実装内容

### Phase 1: データ層

- DB V15 マイグレーション（playlists, playlist_items）
- playlistRepository（CRUD + items管理）
- playlistHandlers（9 IPCチャンネル）
- preload + registerAll 更新
- DataService + ElectronDataService 拡張
- playlist.ts 型定義

### Phase 2: フック層

- usePlaylistData（プレイリストCRUD + 楽観的更新）
- usePlaylistEngine（シーケンシャル再生エンジン）
- usePlaylistPlayer（高レベル状態管理）

### Phase 3: AudioProvider 統合

- audioMode（mixer/playlist）排他制御
- AudioContextValue 型拡張
- shouldPlay フラグによるエンジン切替

### Phase 4: UI コンポーネント

- AudioModeSwitch（Mixer/Playlist切替タブ）
- PlaylistPlayerBar（再生コントロール）
- PlaylistManager（一覧管理）
- PlaylistDetail（トラック一覧 + DnD）
- WorkScreen / MusicScreen 修正

### Phase 5: 仕上げ

- i18n（en/ja 20キー）
- README / CHANGELOG 更新
