# 001: Timer/Sound バックエンドAPI接続

> **Status**: `PENDING`
> **Origin**: `feature_plans/004-backend-reintegration.md` の残タスク
> **Goal**: Timer設定・セッション記録 と Sound設定 をバックエンドAPIに接続し、楽観的更新パターンで永続化する

---

## 概要

Phase 7 で TaskTree のバックエンド同期が完了した。本プランでは残りの Timer / Sound を同じ楽観的更新パターン（localStorage即時反映 → 500msデバウンスで非同期PUT）で接続する。

**原則**:
- バックエンドが利用可能なら同期、不可用ならlocalStorageフォールバック
- コンポーネントの公開インターフェースは変更しない（消費側の修正不要）
- `taskClient.ts` の `fetch` APIパターンに準拠（Axiosは使わない）

---

## Phase 0: Backend設定変更

### 目的
`ddl-auto=create-drop` のままだとバックエンド再起動のたびにDBデータが消失する。`update` に変更してデータを永続化する。

### 変更ファイル

| ファイル | 操作 |
|---------|------|
| `backend/src/main/resources/application.properties` | 修正 |

### 実装内容

```properties
# 変更前
spring.jpa.hibernate.ddl-auto=create-drop
# NOTE: Change to 'update' after initial schema creation with new String IDs

# 変更後
spring.jpa.hibernate.ddl-auto=update
```

コメント行も削除する。

### 検証
- バックエンド起動 → H2コンソールでテーブル存在確認
- データ投入 → バックエンド再起動 → データが残っていること

---

## Phase 1: 型修正 + localStorage キー追加

### 目的
バックエンドの String ID 体系に合わせて `timer.ts` の型を修正し、Timer設定に必要なlocalStorageキーを追加する。

### 変更ファイル

| ファイル | 操作 |
|---------|------|
| `frontend/src/types/timer.ts` | 修正 |
| `frontend/src/constants/storageKeys.ts` | 修正 |

### 実装内容

#### `types/timer.ts`

```typescript
export interface TimerSession {
  id: number;
  taskId: string | null;       // number → string | null に変更
  sessionType: SessionType;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  completed: boolean;
}
```

`TimerSettings` は変更なし（`id: number` のままで正しい — バックエンド側もLong）。

#### `constants/storageKeys.ts`

以下の3キーを追加:

```typescript
BREAK_DURATION: 'sonic-flow-break-duration',
LONG_BREAK_DURATION: 'sonic-flow-long-break-duration',
SESSIONS_BEFORE_LONG_BREAK: 'sonic-flow-sessions-before-long-break',
```

---

## Phase 2: APIクライアント作成

### 目的
Timer / Sound 用の fetch ラッパーを `taskClient.ts` と同じパターンで作成する。

### 変更ファイル

| ファイル | 操作 |
|---------|------|
| `frontend/src/api/timerClient.ts` | **新規作成** |
| `frontend/src/api/soundClient.ts` | **新規作成** |

### `timerClient.ts` の公開関数

```typescript
// Settings
fetchTimerSettings(): Promise<TimerSettings>
updateTimerSettings(settings: Partial<TimerSettings>): Promise<TimerSettings>

// Sessions
startTimerSession(sessionType: SessionType, taskId?: string): Promise<TimerSession>
endTimerSession(id: number, duration: number, completed: boolean): Promise<TimerSession>
fetchTimerSessions(): Promise<TimerSession[]>
fetchSessionsByTaskId(taskId: string): Promise<TimerSession[]>
```

**エンドポイント対応**:
| 関数 | Method | Endpoint |
|------|--------|----------|
| `fetchTimerSettings` | GET | `/api/timer-settings` |
| `updateTimerSettings` | PUT | `/api/timer-settings` |
| `startTimerSession` | POST | `/api/timer-sessions` |
| `endTimerSession` | PUT | `/api/timer-sessions/{id}` |
| `fetchTimerSessions` | GET | `/api/timer-sessions` |
| `fetchSessionsByTaskId` | GET | `/api/tasks/{taskId}/sessions` |

### `soundClient.ts` の公開関数

```typescript
// Settings
fetchSoundSettings(): Promise<SoundSettings[]>
updateSoundSetting(soundType: string, volume: number, enabled: boolean): Promise<SoundSettings>

// Presets（将来拡張用、Phase 4では未使用）
fetchSoundPresets(): Promise<SoundPreset[]>
createSoundPreset(name: string, settingsJson: string): Promise<SoundPreset>
deleteSoundPreset(id: number): Promise<void>
```

**エンドポイント対応**:
| 関数 | Method | Endpoint |
|------|--------|----------|
| `fetchSoundSettings` | GET | `/api/sound-settings` |
| `updateSoundSetting` | PUT | `/api/sound-settings` |
| `fetchSoundPresets` | GET | `/api/sound-presets` |
| `createSoundPreset` | POST | `/api/sound-presets` |
| `deleteSoundPreset` | DELETE | `/api/sound-presets/{id}` |

### 実装パターン（taskClient.ts準拠）

```typescript
const API_BASE = '/api/timer-settings';

export async function fetchTimerSettings(): Promise<TimerSettings> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch timer settings: ${res.status}`);
  return res.json();
}
```

- Viteプロキシ経由で相対パスアクセス
- エラー時は `throw` して呼び出し側で `try/catch`
- レスポンスの日付文字列は呼び出し側で `new Date()` 変換（必要に応じて）

---

## Phase 3: TimerContext にバックエンド同期追加

### 目的
TimerContextの設定値をバックエンドと同期し、セッション記録をAPIに保存する。

### 変更ファイル

| ファイル | 操作 |
|---------|------|
| `frontend/src/context/TimerContext.tsx` | 修正 |

### 実装内容

#### 3-A: Timer設定の同期

**現状**: `workDurationMinutes` のみ `useLocalStorage` で永続化。`breakDuration`(5分), `longBreakDuration`(15分), `sessionsBeforeLongBreak`(4) はハードコード。

**変更後**:
1. `breakDurationMinutes`, `longBreakDurationMinutes`, `sessionsBeforeLongBreak` を `useLocalStorage` で永続化
2. マウント時に `fetchTimerSettings()` → 成功時は4つの設定値をlocalStorage上書き
3. 設定変更時（`setWorkDuration` 等）にlocalStorage即時書込 → 500msデバウンスで `updateTimerSettings()` PUT

```typescript
// 新規追加する状態
const [breakDurationMinutes, setBreakDurationMinutes] = useLocalStorage(
  STORAGE_KEYS.BREAK_DURATION, 5
);
const [longBreakDurationMinutes, setLongBreakDurationMinutes] = useLocalStorage(
  STORAGE_KEYS.LONG_BREAK_DURATION, 15
);
const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useLocalStorage(
  STORAGE_KEYS.SESSIONS_BEFORE_LONG_BREAK, 4
);
```

**デバウンス同期**:
```typescript
const syncSettingsRef = useRef<ReturnType<typeof setTimeout>>();

const syncSettings = useCallback(() => {
  clearTimeout(syncSettingsRef.current);
  syncSettingsRef.current = setTimeout(async () => {
    try {
      await updateTimerSettings({
        workDuration: workDurationMinutes,
        breakDuration: breakDurationMinutes,
        longBreakDuration: longBreakDurationMinutes,
        sessionsBeforeLongBreak,
      });
    } catch {
      // バックエンド不可用 → localStorageに値は残っているので何もしない
    }
  }, 500);
}, [workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreak]);
```

#### 3-B: セッション記録

**現状**: セッション記録なし。

**変更後**:
1. `start()` 時に `startTimerSession(sessionType, activeTask?.id)` → 返却IDを `currentSessionId` refに保持
2. タイマー完了時（`remainingSeconds === 0`）に `endTimerSession(id, duration, true)` PUT
3. `pause()` / `reset()` 時に `endTimerSession(id, elapsed, false)` PUT

```typescript
const currentSessionIdRef = useRef<number | null>(null);

// start() 内
try {
  const session = await startTimerSession(sessionType, activeTask?.id);
  currentSessionIdRef.current = session.id;
} catch {
  // バックエンド不可用 → セッション記録はスキップ
}
```

**セッション完了時の同期**:
```typescript
// tick内で remainingSeconds === 0 の分岐
if (currentSessionIdRef.current) {
  endTimerSession(currentSessionIdRef.current, totalDuration, true).catch(() => {});
  currentSessionIdRef.current = null;
}
```

#### 3-C: Context Value 拡張

`TimerContextType` に公開する新規プロパティ:

```typescript
breakDurationMinutes: number;
longBreakDurationMinutes: number;
sessionsBeforeLongBreak: number;
setBreakDuration: (minutes: number) => void;
setLongBreakDuration: (minutes: number) => void;
setSessionsBeforeLongBreak: (count: number) => void;
```

Settings画面からこれらの値を変更できるようになる。

---

## Phase 4: useLocalSoundMixer にバックエンド同期追加

### 目的
Sound Mixer の状態をバックエンドと同期する。hookの公開インターフェースは変更しない。

### 変更ファイル

| ファイル | 操作 |
|---------|------|
| `frontend/src/hooks/useLocalSoundMixer.ts` | 修正 |

### 実装内容

#### 4-A: マウント時の設定取得

```typescript
useEffect(() => {
  fetchSoundSettings()
    .then((settings) => {
      // バックエンドの設定でlocalStorage上書き
      const newMixer: SoundMixerState = { ...getDefaultMixer() };
      settings.forEach((s) => {
        if (newMixer[s.soundType]) {
          newMixer[s.soundType] = { enabled: s.enabled, volume: s.volume };
        }
      });
      setMixer(newMixer);
    })
    .catch(() => {
      // バックエンド不可用 → localStorageの値をそのまま使用
    });
}, []);
```

#### 4-B: 変更時のデバウンス同期

`toggleSound` / `setVolume` の処理:
1. localStorage即時書込（既存の `setMixer` で自動）
2. 500msデバウンスで `updateSoundSetting(soundType, volume, enabled)` PUT

```typescript
const syncTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

const syncSoundSetting = useCallback((soundType: string, volume: number, enabled: boolean) => {
  clearTimeout(syncTimeoutRef.current[soundType]);
  syncTimeoutRef.current[soundType] = setTimeout(async () => {
    try {
      await updateSoundSetting(soundType, volume, enabled);
    } catch {
      // バックエンド不可用 → スキップ
    }
  }, 500);
}, []);
```

#### 4-C: 公開インターフェース

変更なし: `{ mixer, toggleSound, setVolume }`

→ `NoiseMixer` コンポーネント等の消費側は修正不要。

---

## 変更ファイル一覧（全フェーズ）

| Phase | ファイル | 操作 |
|-------|---------|------|
| 0 | `backend/src/main/resources/application.properties` | 修正 |
| 1 | `frontend/src/types/timer.ts` | 修正 |
| 1 | `frontend/src/constants/storageKeys.ts` | 修正 |
| 2 | `frontend/src/api/timerClient.ts` | **新規** |
| 2 | `frontend/src/api/soundClient.ts` | **新規** |
| 3 | `frontend/src/context/TimerContext.tsx` | 修正 |
| 4 | `frontend/src/hooks/useLocalSoundMixer.ts` | 修正 |

---

## 検証手順

### Phase 0
- [ ] バックエンド起動 → H2コンソールでテーブル確認
- [ ] バックエンド再起動 → データが消失していないこと

### Phase 1
- [ ] `npm run build` が型エラーなく通ること

### Phase 2
- [ ] APIクライアントの関数がインポート可能なこと（ビルド確認）

### Phase 3
- [ ] Timer設定変更 → Network タブで PUT `/api/timer-settings` 確認
- [ ] リロード後に設定値が復元されること
- [ ] Timer開始 → POST `/api/timer-sessions` 確認
- [ ] Timer停止/完了 → PUT `/api/timer-sessions/{id}` 確認
- [ ] バックエンド停止状態でもタイマー動作すること（localStorageフォールバック）

### Phase 4
- [ ] Sound toggle → Network タブで PUT `/api/sound-settings` 確認
- [ ] Volume変更 → PUT 確認（500msデバウンス後）
- [ ] リロード後にSound設定が復元されること
- [ ] バックエンド停止状態でもSound操作可能なこと

---

## リスク・注意事項

- **ddl-auto=update 移行**: 既存のカラム名変更は自動マイグレーションできない。現在のスキーマが正しいことを確認してから変更する。
- **セッション記録の信頼性**: ブラウザ閉じ/クラッシュ時にセッション記録が不完全になる可能性あり。v1では許容する。
- **Sound Presets**: Phase 4 では Preset 機能は API クライアントのみ作成し、UI実装はスコープ外。
