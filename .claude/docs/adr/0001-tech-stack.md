# ADR-0001: Technology Stack Selection

## Status
Accepted (Updated: 2026-02-08)

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
- **Language**: Java 23
- **Framework**: Spring Boot 3.4.2
- **Build Tool**: Gradle (Groovy DSL)
- **Database**: H2 Database (ファイルベースモード)

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **HTTP Client**: native fetch (Axios削除済み)
- **Icons**: Lucide React
- **Rich Text**: TipTap (@tiptap/react)
- **Drag & Drop**: @dnd-kit

## Rationale

### Java 23 + Spring Boot 3.4.2
- 最新Java機能（virtual threads、pattern matching等）を活用
- Spring Bootのエコシステムが成熟
- OpenAI/Gemini APIとの連携が容易
- RESTful API開発のベストプラクティスが確立
- ※LTS (21) から23に変更: 個人プロジェクトのため最新機能を優先

### H2 Database
- 別途DBサーバー不要（開発容易性優先）
- ファイルモードで永続化可能
- 本番移行時はPostgreSQL等への切り替えが容易

### React 19 + TypeScript + Vite 7
- 型安全性による開発効率向上
- Viteによる高速なHMR
- React 19の最新機能

### Tailwind CSS v4
- Notionライクなミニマルデザインに適合
- ユーティリティファーストで迅速な開発
- v4のCSS-first configuration

### native fetch (Axios廃止)
- 追加依存なしでHTTP通信
- 現在はlocalStorageのみで動作するため、API clientの必要性が低下
- Backend再統合時もnative fetchで十分

## Consequences

### Positive
- 開発環境のセットアップが単純（H2により外部DB不要）
- TypeScriptによる型安全性
- Spring BootとReactの組み合わせは情報が豊富
- localStorage移行により開発速度が大幅向上

### Negative
- CORS設定が必須（フロントエンド: 5173, バックエンド: 8080）
- H2は本番環境には不向き（将来的な移行が必要）
- Java + Reactの2つのランタイムが必要
- Java 23は非LTS（セキュリティパッチ期間が短い）

### Risks
- H2からPostgreSQL等への移行時にSQL方言の差異に注意
- フロントエンドとバックエンドの非同期通信におけるエラーハンドリング
- localStorageの容量制限（5-10MB）に注意

## References
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
