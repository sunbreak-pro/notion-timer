# Sonic Flow

## 概要
Notionライクなタスク管理に「環境音ミキサー」と「ポモドーロタイマー」を組み合わせた、没入型個人タスク管理アプリケーション。

### 主な機能
- **タスク管理**: テキストベースのCRUD、フォーカスモード、履歴機能
- **ノイズミキサー**: 複数の環境音を同時再生・音量調整
- **集中タイマー**: 25分作業 + 5分休憩のポモドーロタイマー
- **AIコーチング**: タスクに対するアドバイス・励まし

### 技術スタック
- **Frontend**: React 18+ (TypeScript) + Vite + Tailwind CSS
- **Backend**: Spring Boot 3.x (Java 21) + H2 Database

---

## 開発ジャーナル

### 2025-02-06 - プロジェクト初期化

#### Completed
- プロジェクト仕様書の作成 (Application_Overview.md)
- 開発ドキュメント構成の策定
  - CLAUDE.md: 開発ガイド・作業指示
  - MEMORY.md: 技術仕様（API/データモデル）
  - README.md: 開発ジャーナル
  - TODO.md: 実装タスクリスト
  - ADR: アーキテクチャ決定記録

#### Learnings
- Claude Code用のドキュメント構成
  - CLAUDE.md: プロジェクトルートに配置、作業指示・コーディング規約
  - MEMORY.md: ~/.claude/projects/配下、セッション間で保持される技術仕様
- 日本語（概要）+ 英語（技術仕様）の二言語運用が効果的

#### Challenges
- 実装はまだ開始していない
- フロントエンド・バックエンドのスキャフォールディングが次のステップ

---

## セットアップ

### 前提条件
- Node.js 18+
- Java 21
- npm または yarn

### インストール
```bash
# フロントエンド
cd frontend
npm install

# バックエンド
cd backend
./gradlew build
```

### 起動
```bash
# バックエンド (port 8080)
cd backend && ./gradlew bootRun

# フロントエンド (port 5173)
cd frontend && npm run dev
```

---

## ドキュメント
- [開発ガイド](.claude/CLAUDE.md)
- [仕様書](.claude/docs/Application_Overview.md)
- [アーキテクチャ決定記録](.claude/docs/adr/)
- [TODO](TODO.md)
