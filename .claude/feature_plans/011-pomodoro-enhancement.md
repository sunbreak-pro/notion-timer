# 010: ポモドーロタイマー強化

**Status**: PLANNED
**Created**: 2026-02-10
**Priority**: High

---

## 概要・背景

現在のポモドーロタイマーには以下の課題がある:

1. **自動遷移の問題**: WORKタイマーが0になると `advanceSession()` が即座にBREAK/LONG_BREAKへ遷移する。ユーザーが作業の区切りを意識する暇がない
2. **延長不可**: 集中状態を維持したい場面でもBREAKへ強制移行される
3. **タスク完了の手間**: タスクを「完了」にするにはTaskTreeで手動操作が必要。WorkScreen上で完了できない
4. **サウンド共通問題**: `shouldPlay = timer.isRunning && timer.sessionType === 'WORK'` により、RESTセッション中はサウンドが再生されない。作業音と休憩音を分けて設定する手段もない

### 解決方針

- R1: WORK完了時にモーダルでユーザー判断を挟む（延長 or 休憩）
- R2: WorkScreenにタスク完了ボタンを追加
- R3: Work/Rest別のサウンドミキサーを導入
- R4: 3パネルDnD UIでサウンドの割り当てを直感的に操作

---

## 要件

### R1: セッション完了モーダル

**WORKタイマー → 0 の場合:**
- `advanceSession()` でauto-transitionせず、`showCompletionModal: true` フラグをセット
- `SessionCompletionModal` を表示
- 選択肢:
  - 「延長する」→ DurationPicker（5/10/15/20/25/30分の選択式）→ WORKを延長
  - 「休憩する」→ 現行のBREAK/LONG_BREAK遷移ロジックを実行
- モーダル表示中はタイマー停止状態（`isRunning: false`）

**RESTタイマー → 0 の場合:**
- 現行通り自動でWORKへ遷移（モーダルなし）
- 通知は既存の `sendNotification('休憩終了！作業を再開しましょう')` を維持

**変更箇所:**
- `TimerContext.tsx:136-169` — `advanceSession()` のWORK完了分岐を変更
- `TimerContextValue.ts` — `showCompletionModal`, `extendWork(minutes)`, `startRest()` を追加

### R2: タスク完了ボタン

**動作:**
- WorkScreenに「完了」ボタンを追加（`activeTask` が存在する場合のみ表示）
- クリック時の処理:
  1. `toggleTaskStatus(activeTask.id)` でタスクをDONEに変更
  2. タイマーを停止（`pause()` + `reset()`）
  3. 完了モーダルが開いていれば閉じる
  4. `clearTask()` でactiveTaskをクリア

**実装パターン:**
- `toggleTaskStatus` は `useTaskTreeCRUD.ts:51` に既存
- `App.tsx` でブリッジコールバック `handleCompleteTask` を作成し、WorkScreenにpropsで渡す
- TaskTreeContextとTimerContextの間を `App.tsx` が仲介（直接のContext依存を避ける）

### R3: セッション別サウンド（Work/Rest独立ミキサー）

**データモデル変更:**
- 単一の `SoundMixerState` を `workMixer` + `restMixer` に分離
- localStorage: `sonic-flow-sound-mixer-work` / `sonic-flow-sound-mixer-rest`

**フロントエンド:**
- `useLocalSoundMixer` の `storageKey` をパラメータ化
- `AudioContext.tsx` で2つのミキサーインスタンスを管理:
  ```
  const workMixer = useLocalSoundMixer(customSoundIds, STORAGE_KEYS.SOUND_MIXER_WORK);
  const restMixer = useLocalSoundMixer(customSoundIds, STORAGE_KEYS.SOUND_MIXER_REST);
  ```
- `shouldPlay` ロジックの変更:
  - WORK時: `workMixer` のサウンドを再生
  - BREAK/LONG_BREAK時: `restMixer` のサウンドを再生
  - `isRunning === false` 時: 全サウンド停止

**バックエンド:**
- `SoundSettings.java` に `sessionCategory` カラム追加（`"WORK"` / `"REST"`、デフォルト `"WORK"`）
- `ddl-auto=update` により自動でカラム追加される
- 既存データは `sessionCategory = null` → マイグレーションで `"WORK"` に設定

**マイグレーション方針:**
- 既存の `sonic-flow-sound-mixer` データを `sonic-flow-sound-mixer-work` にコピー
- `sonic-flow-sound-mixer-rest` は空のデフォルト状態で初期化
- `STORAGE_KEYS.MIGRATION_DONE` のバージョン管理で一度だけ実行

### R4: サウンドDnD UI（3パネル構成）

**レイアウト:**
```
┌─────────────┬──────────────────┬──────────────┐
│ Work Sounds │ Available Sounds │ Rest Sounds  │
│             │                  │              │
│ [Rain  ≡]  │ [Ocean  ≡]      │ [Fire  ≡]   │
│ [Wind  ≡]  │ [Birds  ≡]      │              │
│             │ [Custom ≡]      │              │
└─────────────┴──────────────────┴──────────────┘
```

**操作:**
- 中央パネル（Available）からWork/Restパネルへドラッグ&ドロップ
- Work/RestパネルからAvailableへ戻すことも可能
- 各サウンドカードに `GripVertical` ドラッグハンドル追加（TaskTreeNodeパターン踏襲）
- `@dnd-kit` を使用（既にTaskTreeで導入済み）

**WorkScreen内の配置:**
- 既存のSoundMixerセクションを `WorkScreenSoundSection` に置換
- タイマー表示の下に配置

---

## データモデル変更

### フロントエンド

**新規型:**
```typescript
// types/sound.ts に追加
export type SessionCategory = 'WORK' | 'REST';

export interface SessionSoundState {
  workMixer: SoundMixerState;
  restMixer: SoundMixerState;
}
```

**TimerContextValue 拡張:**
```typescript
// 追加フィールド
showCompletionModal: boolean;
extendWork: (minutes: number) => void;
startRest: () => void;
dismissCompletionModal: () => void;
```

**AudioContextValue 拡張:**
```typescript
// 変更後
workMixer: SoundMixerState;
restMixer: SoundMixerState;
toggleWorkSound: (id: string) => void;
toggleRestSound: (id: string) => void;
setWorkVolume: (id: string, volume: number) => void;
setRestVolume: (id: string, volume: number) => void;
// 既存のmixer/toggleSound/setVolumeはアクティブセッション用ラッパーとして維持
mixer: SoundMixerState;
toggleSound: (id: string) => void;
setVolume: (id: string, volume: number) => void;
```

**localStorage キー追加:**
```typescript
SOUND_MIXER_WORK: 'sonic-flow-sound-mixer-work',
SOUND_MIXER_REST: 'sonic-flow-sound-mixer-rest',
```

### バックエンド

**SoundSettings エンティティ:**
```java
// 追加フィールド
@Column(nullable = true)
private String sessionCategory;  // "WORK" or "REST", default "WORK"
```

**SoundSettingsRepository:**
```java
// 追加メソッド
Optional<SoundSettings> findBySoundTypeAndSessionCategory(String soundType, String sessionCategory);
List<SoundSettings> findBySessionCategory(String sessionCategory);
```

---

## コンポーネント変更

### 新規ファイル (4)

| ファイル | 目的 | 主要依存 |
|---------|------|---------|
| `components/WorkScreen/SessionCompletionModal.tsx` | WORK完了モーダル（延長/休憩選択） | TimerContext |
| `components/WorkScreen/SessionSoundPanel.tsx` | Work/Rest別サウンドパネル | AudioContext, @dnd-kit |
| `components/WorkScreen/AvailableSoundsPanel.tsx` | 割り当て可能サウンド一覧 | AudioContext, @dnd-kit |
| `components/WorkScreen/WorkScreenSoundSection.tsx` | 3パネルDnDレイアウト | @dnd-kit/core |

### 変更ファイル — フロントエンド (11)

| ファイル | 変更内容 |
|---------|---------|
| `context/TimerContext.tsx` | `advanceSession()` WORK完了時にモーダルフラグセット。`extendWork(min)`, `startRest()`, `dismissCompletionModal()` 追加 |
| `context/TimerContextValue.ts` | `showCompletionModal`, `extendWork`, `startRest`, `dismissCompletionModal` 型追加 |
| `context/AudioContext.tsx` | `useLocalSoundMixer` を2インスタンス化。sessionTypeに応じてアクティブミキサー切替。`shouldPlay` ロジック変更（REST中もrestMixer再生） |
| `context/AudioContextValue.ts` | `workMixer`, `restMixer`, `toggleWorkSound`, `toggleRestSound`, `setWorkVolume`, `setRestVolume` 追加 |
| `hooks/useLocalSoundMixer.ts` | 第2引数に `storageKey: string` を追加。デフォルトは `STORAGE_KEYS.SOUND_MIXER_WORK`。バックエンドAPI呼び出しに `sessionCategory` パラメータ追加 |
| `components/WorkScreen/WorkScreen.tsx` | 完了ボタン追加（`onCompleteTask` prop）。SoundMixerを `WorkScreenSoundSection` に置換。`SessionCompletionModal` 配置 |
| `components/WorkScreen/SoundCard.tsx` | `GripVertical` ドラッグハンドル追加。`draggable` prop 追加 |
| `constants/storageKeys.ts` | `SOUND_MIXER_WORK`, `SOUND_MIXER_REST` 追加 |
| `api/soundClient.ts` | `fetchSoundSettings(sessionCategory?)`, `updateSoundSetting(soundType, volume, enabled, sessionCategory)` に `sessionCategory` パラメータ追加 |
| `types/sound.ts` | `SessionCategory` 型、`SoundSettings.sessionCategory` フィールド追加 |
| `App.tsx` | `handleCompleteTask` コールバック作成。WorkScreenに `onCompleteTask` prop渡し。TaskTreeContextとTimerContextのブリッジ |

### 変更ファイル — バックエンド (4)

| ファイル | 変更内容 |
|---------|---------|
| `entity/SoundSettings.java` | `sessionCategory` フィールド追加（`@Column(nullable = true)`） |
| `repository/SoundSettingsRepository.java` | `findBySoundTypeAndSessionCategory()`, `findBySessionCategory()` 追加 |
| `service/SoundService.java` | `getAllSettings(sessionCategory)`, `updateSettings(soundType, volume, enabled, sessionCategory)` に対応 |
| `controller/SoundController.java` | GET/PUTに `sessionCategory` クエリパラメータ追加。既存APIとの後方互換性維持 |

---

## Context間の連携

### Provider順序（変更なし）
```
ErrorBoundary → ThemeProvider → TaskTreeProvider → MemoProvider → TimerProvider → AudioProvider → App
```

### ブリッジパターン（App.tsx）

```
TaskTreeContext ←─── App.tsx ───→ TimerContext
      │                                │
      │ toggleTaskStatus()             │ pause() + reset() + clearTask()
      │                                │ showCompletionModal
      │                                │ extendWork() / startRest()
      └────── handleCompleteTask ──────┘
                      │
                      ▼
              WorkScreen (props)
```

- `App.tsx` が `handleCompleteTask` を定義
- 内部で `toggleTaskStatus` + `pause` + `reset` + `clearTask` を順次実行
- WorkScreenには `onCompleteTask` propで渡す

### Audio ↔ Timer連携

```
TimerContext.sessionType ──→ AudioContext
                              │
                  ┌───────────┴───────────┐
                  │                       │
            WORK → workMixer        BREAK/LONG_BREAK → restMixer
                  │                       │
                  └───────┬───────────────┘
                          ▼
                    useAudioEngine(activeMixer, soundSources, shouldPlay)
```

- `shouldPlay` を `timer.isRunning` に変更（`sessionType === 'WORK'` 条件を削除）
- アクティブミキサーは `sessionType` で動的に切替

---

## 実装フェーズ

### Phase 1: セッション完了モーダル (R1)
**対象ファイル:** TimerContext.tsx, TimerContextValue.ts, SessionCompletionModal.tsx, WorkScreen.tsx

1. `TimerContextValue` に型追加
2. `TimerContext.advanceSession()` を変更 — WORK完了時にモーダルフラグ
3. `extendWork(minutes)`, `startRest()`, `dismissCompletionModal()` 実装
4. `SessionCompletionModal` コンポーネント作成
5. `WorkScreen` にモーダル配置

### Phase 2: タスク完了ボタン (R2)
**対象ファイル:** App.tsx, WorkScreen.tsx

1. `App.tsx` に `handleCompleteTask` コールバック作成
2. WorkScreenの props に `onCompleteTask` 追加
3. WorkScreen内にCompleteボタンUI実装
4. モーダルとの連携（モーダル内にも完了ボタン配置）

### Phase 3: セッション別サウンド (R3)
**対象ファイル:** useLocalSoundMixer.ts, AudioContext.tsx, AudioContextValue.ts, soundClient.ts, types/sound.ts, storageKeys.ts, SoundSettings.java, SoundSettingsRepository.java, SoundService.java, SoundController.java

1. バックエンド: `sessionCategory` カラム追加 + API変更
2. フロントエンド: `useLocalSoundMixer` パラメータ化
3. `AudioContext` で2ミキサーインスタンス管理
4. `shouldPlay` ロジック変更
5. マイグレーションロジック（既存データ → WORK）

### Phase 4: サウンドDnD UI (R4)
**対象ファイル:** SessionSoundPanel.tsx, AvailableSoundsPanel.tsx, WorkScreenSoundSection.tsx, SoundCard.tsx, WorkScreen.tsx

1. `SoundCard` にドラッグハンドル追加
2. 3パネルコンポーネント作成
3. `@dnd-kit` DnDロジック実装
4. WorkScreenのSoundMixerセクション置換

---

## 技術的考慮事項

### 後方互換性
- バックエンドAPI: `sessionCategory` パラメータはオプショナル。未指定時はデフォルト `"WORK"` として処理
- localStorage: 既存の `sonic-flow-sound-mixer` データをマイグレーション。マイグレーション完了後も旧キーは保持（フォールバック用）
- `AudioContextValue` の `mixer`, `toggleSound`, `setVolume` はアクティブセッション用ラッパーとして維持（既存の消費コンポーネントへの影響を最小化）

### パフォーマンス
- `useAudioEngine` は1インスタンスのまま維持。アクティブミキサーの切替時にフェードイン/アウトで滑らかに遷移
- セッション切替時のサウンド切替は200msフェードで自然に

### DnD実装
- `@dnd-kit/core` + `@dnd-kit/sortable` を使用（TaskTreeで導入済み）
- ドラッグ中のオーバーレイにはサウンドカードのプレビューを表示
- `DndContext` のスコープをWorkScreenSoundSection内に限定（TaskTreeのDnDと干渉させない）

### エッジケース
- 延長中にタスク完了 → タイマー停止 + タスクDONE + モーダル閉じ
- モーダル表示中にオーバーレイを閉じた場合 → モーダルは次回WorkScreen表示時に復帰
- REST中にactiveTaskを変更した場合 → サウンドは継続（ミキサーはsessionType依存、task依存ではない）
- カスタムサウンドのWork/Rest間移動 → ミキサー状態のみ変更、IndexedDB/blobは共有

---

## 検証方法

### R1: セッション完了モーダル
- [ ] WORKタイマー → 0: モーダルが表示される
- [ ] 「延長する」→ 5分刻みで選択 → WORKが延長される
- [ ] 「休憩する」→ BREAK/LONG_BREAKに正しく遷移
- [ ] RESTタイマー → 0: モーダルなしで自動WORK遷移
- [ ] モーダル表示中にタイマーは停止状態

### R2: タスク完了ボタン
- [ ] activeTask存在時のみ完了ボタン表示
- [ ] クリック → タスクがDONEになる（TaskTree側に反映）
- [ ] クリック → タイマーが停止・リセットされる
- [ ] activeTaskがクリアされる

### R3: セッション別サウンド
- [ ] Work/Restで別々のサウンド設定が保存される
- [ ] WORKセッション中はworkMixerのサウンドが再生
- [ ] BREAKセッション中はrestMixerのサウンドが再生
- [ ] セッション切替時にフェードイン/アウトで滑らかに遷移
- [ ] バックエンドに `sessionCategory` 付きで正しく同期
- [ ] 既存データのマイグレーションが正しく動作

### R4: サウンドDnD UI
- [ ] 3パネルが正しくレンダリングされる
- [ ] Available → Work/Rest へのドラッグ&ドロップが動作
- [ ] Work/Rest → Available への戻しが動作
- [ ] ドラッグ中のプレビュー表示
- [ ] カスタムサウンドもDnD対象に含まれる
- [ ] TaskTreeのDnDと干渉しない
