# Noise Mixer - 音声再生

## 概要

現在UIのみ実装済みのNoise Mixerに、実際の音声再生機能を追加する。Web Audio APIを使用して複数音源の同時再生を実現する。

## スコープ

- Web Audio API による複数音源同時再生
- `useAudio` フック作成
- 音源ファイルの読み込み・管理
- 音量コントロールのリアルタイム反映

## 現状

- NoiseMixer UIコンポーネント実装済み（6種: Rain, Thunder, Wind, Ocean, Birds, Fire）
- 音量スライダー（0-100%）実装済み
- `useLocalSoundMixer` フックで状態管理済み（localStorage永続化）
- 音声再生は未実装（状態管理のみ）

## 主要タスク

- [ ] `useAudio` フック作成（Web Audio API ラッパー）
- [ ] 複数音源の同時再生対応
- [ ] 音量変更のリアルタイム反映
- [ ] 音源ファイルの配置・読み込み設計
- [ ] フェードイン/フェードアウト処理

## 技術的考慮事項

- 音源ファイルはリポジトリにコミット禁止（`public/sounds/` or 外部URL）
- サポートフォーマット: MP3, WAV, OGG
- ブラウザの自動再生ポリシー対応（ユーザーインタラクション必須）
- メモリ管理（AudioContextの適切な破棄）
