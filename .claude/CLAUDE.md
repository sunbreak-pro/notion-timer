# Sonic Flow 開発ガイド

## プロジェクト概要
Notionライクなタスク管理 + 環境音ミキサー + ポモドーロタイマーを組み合わせた没入型個人タスク管理アプリ

---

## ディレクトリ構成
```
notion-timer/
├── frontend/               # React (TypeScript + Vite)
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── context/        # React Context
│   │   ├── api/            # API通信
│   │   └── types/          # 型定義
│   └── public/
│       └── sounds/         # 環境音ファイル（.gitignore対象）
├── backend/                # Spring Boot (Java 23)
│   └── src/main/java/
│       ├── controller/     # REST API
│       ├── service/        # ビジネスロジック
│       ├── repository/     # データアクセス
│       └── entity/         # エンティティ
├── .claude/
│   └── docs/
│       ├── Application_Overview.md  # 仕様書
│       └── adr/                     # アーキテクチャ決定記録
├── README.md               # 開発ジャーナル
└── TODO.md                 # 実装タスク
```

---

## 開発コマンド

### Frontend (React)
```bash
cd frontend
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動 (port 5173)
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run test         # テスト実行
```

### Backend (Spring Boot)
```bash
cd backend
./gradlew bootRun    # 開発サーバー起動 (port 8080)
./gradlew build      # ビルド
./gradlew test       # テスト実行
```

### 同時起動
```bash
# ターミナル1: Backend
cd backend && ./gradlew bootRun

# ターミナル2: Frontend
cd frontend && npm run dev
```

---

## コーディング規約

### 命名規則
| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TaskList.tsx` |
| フック | camelCase + use接頭辞 | `useTasks.ts` |
| 変数・関数 | camelCase | `taskList`, `fetchTasks` |
| 定数 | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Java クラス | PascalCase | `TaskController.java` |
| Java パッケージ | lowercase | `com.sonicflow.controller` |

### コード規約
- **Frontend**: ESLint + Prettier設定に従う
- **Backend**: Google Java Style Guide準拠
- コメントは必要最小限（コードで説明できる場合は不要）

---

## ブランチ戦略

### ブランチ構成
- `main` - 安定版（本番相当）
- `develop` - 開発統合ブランチ
- `feature/*` - 機能開発
- `fix/*` - バグ修正

### コミットメッセージ
```
<type>: <subject>

[optional body]
```

**Type一覧:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

**例:**
```
feat: タスク一覧のフィルター機能を追加

- ステータスでのフィルタリング
- 日付範囲での絞り込み
```

---

## 作業時の注意点

### 必須: CORS設定
フロントエンド(5173)とバックエンド(8080)のポートが異なるため、**最初にCORS設定を行うこと**。

### 音源ファイル
- リポジトリにコミット禁止
- `public/sounds/` に配置、または外部URL参照
- `.gitignore` に `public/sounds/` を追加

### API通信
- 非同期処理には必ず `async/await` を使用
- ローディング状態とエラーハンドリングを実装

### データベース
- H2 Database（ファイルモード）で永続化
- 開発時は `jdbc:h2:file:./data/sonicflow` 推奨

### AIキー管理
- API Keyは環境変数または `application.properties` で管理
- フロントエンドに直接記載禁止（必ずバックエンド経由）

---

## 設計方針

### アーキテクチャ目標
- **将来のアプリケーション化**（Electron/Tauri）を見据えた設計
- **デバイス間連携**を実現するため、すべてのユーザーデータはバックエンドで永続化

### データ永続化の原則
1. ユーザー設定・履歴は**すべてバックエンド（H2 DB）に保存**
2. フロントエンドのlocalStorageは**一時的なUI状態のみ**に使用
3. オフラインモードは未対応（常にバックエンド接続が必要）

### フロントエンドの責務
- UI/UXの状態管理（フォーカスモード、編集中状態など）
- 音声再生制御（Web Audio API）
- タイマーのカウントダウン表示
- API通信とエラーハンドリング

### バックエンドの責務
- すべてのデータ永続化
- ビジネスロジック（タイムスタンプ自動設定など）
- 外部API通信（AIコーチング）
- バリデーション

---

## 関連ドキュメント
- [仕様書](.claude/docs/Application_Overview.md)
- [ADR](.claude/docs/adr/)
- [TODO](TODO.md)
