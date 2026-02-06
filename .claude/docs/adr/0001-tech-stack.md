# ADR-0001: Technology Stack Selection

## Status
Accepted

## Date
2025-02-06

## Context
Sonic Flowは「Notionライクなタスク管理」+「環境音ミキサー」+「ポモドーロタイマー」を組み合わせた個人向け没入型タスク管理アプリケーションである。

以下の要件を満たす技術スタックを選定する必要がある：
- モダンで保守性の高いフロントエンド
- 堅牢で拡張性のあるバックエンドAPI
- 開発環境のセットアップが容易
- AIサービスとの連携が可能

## Decision

### Backend
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.x
- **Build Tool**: Gradle (Groovy DSL)
- **Database**: H2 Database (ファイルベースモード)

### Frontend
- **Framework**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API または Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Rationale

### Java 21 + Spring Boot 3.x
- LTSバージョンで長期サポート
- Spring Bootのエコシステムが成熟
- OpenAI/Gemini APIとの連携が容易
- RESTful API開発のベストプラクティスが確立

### H2 Database
- 別途DBサーバー不要（開発容易性優先）
- ファイルモードで永続化可能
- 本番移行時はPostgreSQL等への切り替えが容易

### React + TypeScript + Vite
- 型安全性による開発効率向上
- Viteによる高速なHMR
- 豊富なエコシステム

### Tailwind CSS
- Notionライクなミニマルデザインに適合
- ユーティリティファーストで迅速な開発
- カスタマイズ性が高い

## Consequences

### Positive
- 開発環境のセットアップが単純（H2により外部DB不要）
- TypeScriptによる型安全性
- Spring BootとReactの組み合わせは情報が豊富
- 両技術ともにアクティブなコミュニティ

### Negative
- CORS設定が必須（フロントエンド: 5173, バックエンド: 8080）
- H2は本番環境には不向き（将来的な移行が必要）
- Java + Reactの2つのランタイムが必要

### Risks
- H2からPostgreSQL等への移行時にSQL方言の差異に注意
- フロントエンドとバックエンドの非同期通信におけるエラーハンドリング

## References
- [Spring Boot 3.x Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [React 18 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
