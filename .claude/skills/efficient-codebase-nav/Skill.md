---
name: efficient-codebase-nav
description: Sonic Flow コードベース探索ガイド。Use when exploring the codebase, after /clear, or when locating domain-specific code. Triggers include codebase navigation, file discovery, architecture understanding.
---

「efficient-codebase-navを起動します」と表示する。

## Entry Points

| レイヤー     | ファイル                | 役割                                    |
| ------------ | ----------------------- | --------------------------------------- |
| Main Process | `electron/main.ts`      | BrowserWindow作成、dev/prod分岐         |
| Preload      | `electron/preload.ts`   | contextBridge、チャンネルホワイトリスト |
| Renderer     | `frontend/src/main.tsx` | Provider stack、React root              |

## ディレクトリマップ

### Electron (メインプロセス)

```
electron/
├── main.ts, preload.ts
├── database/
│   ├── db.ts              # SQLite singleton
│   ├── migrations.ts      # V1-V13
│   └── *Repository.ts     # データアクセス (10個)
├── ipc/
│   ├── registerAll.ts     # 全ハンドラ一括登録
│   └── *Handlers.ts       # ドメイン別 (14個)
└── services/
    ├── aiService.ts        # Gemini API
    └── safeStorageService.ts
```

### Frontend (レンダラー)

```
frontend/src/
├── main.tsx, App.tsx
├── components/            # UIコンポーネント
├── context/               # Context + Provider (7個)
├── hooks/                 # カスタムフック
├── services/              # DataService抽象化
│   ├── DataService.ts     # インターフェース
│   ├── ElectronDataService.ts  # IPC実装
│   └── dataServiceFactory.ts
├── types/                 # 型定義
├── constants/             # 定数
├── i18n/locales/          # en.json, ja.json
└── test/                  # テストユーティリティ
```

## ドメイン対応表

| ドメイン  | Context         | Hook               | Repository           | IPC prefix       |
| --------- | --------------- | ------------------ | -------------------- | ---------------- |
| Tasks     | TaskTreeContext | useTaskTreeAPI     | taskRepository       | `db:tasks:*`     |
| Timer     | TimerContext    | useTimerContext    | timerRepository      | `db:timer:*`     |
| Sound     | AudioContext    | useLocalSoundMixer | soundRepository      | `db:sound:*`     |
| Memo      | MemoContext     | useMemoContext     | memoRepository       | `db:memo:*`      |
| Note      | NoteContext     | useNoteContext     | noteRepository       | `db:notes:*`     |
| Calendar  | CalendarContext | useCalendars       | calendarRepository   | `db:calendars:*` |
| AI        | —               | —                  | aiSettingsRepository | `ai:*`           |
| Templates | —               | —                  | templateRepository   | `db:templates:*` |

## DataService フロー

```
Component → Context/Hook → getDataService() → ElectronDataService
  → window.electronAPI.invoke(channel) → preload(whitelist check)
  → ipcMain.handle → Repository → SQLite
```

## 探索手順

1. **ドメイン特定**: 上の対応表でドメインを特定
2. **Context/Hook確認**: `frontend/src/context/` と `frontend/src/hooks/`
3. **IPC追跡**: `ElectronDataService.ts` → `preload.ts` → `*Handlers.ts` → `*Repository.ts`
4. **型確認**: `frontend/src/types/`
5. **UI確認**: `frontend/src/components/` でGlob

## /clear 後の回復

1. `.claude/CLAUDE.md` を読む（アーキテクチャ全体）
2. 作業中のドメインのContext → Hook → Repository を読む
3. 必要に応じて `git log --oneline -10` で最近の変更を確認
