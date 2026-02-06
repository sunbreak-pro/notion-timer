
# Project Name: Sonic Flow
## 概要
「Notionライクなタスク管理」に「環境音ミキサー」と「ポモドーロタイマー」を組み合わせた、没入型個人タスク管理アプリケーションを作成したい。
フロントエンドにReact、バックエンドにJava (Spring Boot) を使用したSPA構成とする。

## 1. 技術スタック要件

### Backend (API Server)
* **Language:** Java 21 (LTS)
* **Framework:** Spring Boot 3.x
* **Build Tool:** Gradle (Groovy DSL)
* **Database:** H2 Database (ファイルベースモードで永続化)
    * 開発の容易さを優先し、別途DBサーバーを立てずにアプリケーション起動で動作するようにする。
* **AI Integration:** OpenAI API (または Gemini API) と通信するService層を作成。
    * API Keyは環境変数または `application.properties` から読み込む。

### Frontend (UI/UX)
* **Framework:** React 18+ (TypeScript)
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (NotionライクなシンプルでモダンなUI構築のため)
* **State Management:** React Context API または Zustand (オーディオ設定とタスク状態の管理)
* **Icons:** Lucide React
* **HTTP Client:** Axios
* **Audio:** Web Audio API または `use-sound` (またはHTML5 Audio)

## 2. アプリケーション機能要件

### Feature A: タスク管理 (CRUD)
* テキストベースのタスク追加、編集、削除。
* タスクのステータス管理（TODO / DONE）。
* **フォーカスモード:** 選択した1つのタスク以外をUIから隠す、または薄くする機能。
* **履歴機能:** `DONE` ステータスのタスク一覧を表示する画面。

### Feature B: ノイズミキサー (Frontend主導)
* 複数の環境音（例: Rain, Fire, Cafe）を同時に再生可能にする。
* 各環境音の音量を個別にスライダーで調整できる（0% - 100%）。
* *※開発時はダミーのオーディオファイルまたはプレースホルダーを使用する想定でコードを生成すること。*

### Feature C: 集中タイマー
* 25分（作業）+ 5分（休憩）の基本カウントダウン機能。
* 視覚的に邪魔にならないプログレスバー表示。

### Feature D: AIコーチング (Backend Proxy)
* フロントエンドから「タスク内容」や「完了報告」を送信。
* バックエンドがAI APIを叩き、励ましの言葉や、タスク細分化のアドバイスを返す。
* APIキーの漏洩を防ぐため、必ずバックエンドを経由させること。

## 3. API 定義 (RESTful)

### Tasks
* `GET /api/tasks`: 未完了タスク一覧取得
* `GET /api/tasks/history`: 完了済みタスク一覧取得
* `POST /api/tasks`: 新規タスク作成
* `PUT /api/tasks/{id}`: タスク更新（完了フラグ含む）
* `DELETE /api/tasks/{id}`: タスク削除

### AI
* `POST /api/ai/advice`: 現在のタスク内容を元にアドバイスを取得

## 4. データモデル (Schemaイメージ)

### Task Entity
* `id`: Long (Auto Increment)
* `title`: String (Notionライクなプレーンテキスト)
* `status`: Enum (TODO, DONE)
* `createdAt`: LocalDateTime
* `completedAt`: LocalDateTime

## 5. 開発の進め方と制約事項
1.  **CORS設定:** フロントエンド(通常 port 5173)からバックエンド(通常 port 8080)へのアクセスを許可する `WebMvcConfigurer` 設定を最初に行うこと。
2.  **ディレクトリ構成:** フロントエンドとバックエンドは別々のルートディレクトリで管理する前提だが、統合して開発しやすい構造を提案すること。
3.  **著作権配慮:** 音源ファイルはリポジトリに含めず、ユーザーがローカルの `public/sounds/` フォルダに配置する設計、またはフリー素材のURLを参照する設計にすること。

## 依頼事項
上記の仕様に基づき、以下のステップを実行するためのコードとファイル構成を生成してください。
1.  Spring Bootプロジェクトの `build.gradle` と主要なEntity, Controller, Repository, Serviceのコード。
2.  Reactプロジェクトの `package.json` 構成案と、メインとなるAppコンポーネント、API通信部分のフック。
3.  特に「環境音ミキサー」のReactコンポーネントの実装例。



---

### 今後のアドバイス（Java + React 連携の壁）

この設計書で開発を始めると、最初に以下の壁にぶつかる可能性があります。ここさえクリアすればスムーズに進みます。

1. **CORS (Cross-Origin Resource Sharing) エラー:**
* ブラウザ（React: `localhost:5173`）とサーバー（Java: `localhost:8080`）のポート番号が違うため、セキュリティ機能で通信がブロックされます。
* **対策:** Spring Boot側で「`localhost:5173` からのアクセスはOKだよ」と許可する設定クラスを書く必要があります（プロンプトに指示を入れていますが、エラーが出たらここを疑ってください）。


2. **API通信の非同期処理:**
* Javaはデータが来るまで待ってくれますが、JavaScript (React) は待たずに次へ進んでしまい、「データがない！」とエラーになることがあります。
* **対策:** React側で `async/await` 構文をしっかり使い、データのロード中（Loading状態）を画面に表示する処理を入れることが大切です。
