# AI Coaching (Feature D)

## 概要

タスク内容や完了報告を元に、AIが励ましの言葉やタスク細分化のアドバイスを返す機能。APIキー漏洩防止のため、必ずバックエンド経由で通信する。

## スコープ

### Backend
- `AIService` — OpenAI API / Gemini API との通信ロジック
- `POST /api/ai/advice` エンドポイント
- API Key管理（環境変数 or `application.properties`）

### Frontend
- `AICoach` コンポーネント — アドバイス表示UI
- アドバイスリクエスト用のフック
- ローディング/エラー状態の管理

## 主要タスク

- [ ] AIService (Backend)
- [ ] POST /api/ai/advice エンドポイント
- [ ] AICoach コンポーネント (Frontend)
- [ ] アドバイス表示UI

## 技術的考慮事項

- API Keyはフロントエンドに直接記載禁止（必ずバックエンド経由）
- レスポンスのストリーミング対応を検討
- レート制限の実装
- Application_Overview.md の Feature D 仕様を参照
