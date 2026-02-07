# Backend再統合

## 概要

Phase 2でlocalStorage中心に移行したデータ永続化を、Spring Boot + H2 Databaseバックエンドに再接続する。デバイス間連携を見据えた設計方針に回帰する。

## スコープ

### Backend Entity更新
- Task Entity に `parentId`, `type`, `order`, `isDeleted`, `content`, `workDurationMinutes` 追加
- ツリー構造対応のCRUD API
- タイマーセッション永続化

### Frontend API接続
- localStorageフックをAPIフックに置換
- Axiosクライアントの再導入
- ローディング/エラー状態の実装
- オプティミスティック更新の検討

### データマイグレーション
- localStorage → Backend への初回データ移行

## 現状

- Backend側: 基本的なCRUD API実装済み（Phase 1のフラットTask構造）
- Frontend側: 全てlocalStorage依存（`useTaskTree.ts`, `TimerContext.tsx`, `useLocalSoundMixer.ts`）
- CORS設定: 実装済み

## 主要タスク

- [ ] Task Entityのツリー構造対応
- [ ] Backend APIの更新（階層CRUD）
- [ ] Axiosクライアント再導入
- [ ] useTaskTree → API版フックへの置換
- [ ] TimerContext → API版への置換
- [ ] SoundMixer → API版への置換
- [ ] データマイグレーション機能

## 技術的考慮事項

- code-integrity-report で指摘済み: Frontend-Backend データモデル不整合
- オフラインフォールバックの要否
- APIレスポンス形式（ツリー構造の一括取得 vs 個別取得）
- チャンクサイズ最適化（現在500kB超の警告あり）
