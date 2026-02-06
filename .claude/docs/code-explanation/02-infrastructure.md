# インフラストラクチャ（基盤コード）

## 概要

アプリケーション全体を支える基盤コード: フロントエンドのエントリポイント、APIクライアント、レイアウトシステム、バックエンドの起動設定、CORS、データベース接続を解説する。

## フロントエンド基盤

### エントリポイント: main.tsx

**ファイル**: `frontend/src/main.tsx`

```
main.tsx:6-10
  createRoot(document.getElementById('root')!)
    .render(<StrictMode><App /></StrictMode>)
```

- `StrictMode` で開発時の問題検出を有効化
- `#root` DOM要素にReactツリーをマウント

### スタイル基盤: index.css

Tailwind CSS を使用。カスタムカラーは `notion-*` プレフィックスで定義:
- `notion-bg`, `notion-bg-secondary` — 背景色
- `notion-text`, `notion-text-secondary` — テキスト色
- `notion-border`, `notion-hover` — ボーダー・ホバー色
- `notion-accent`, `notion-danger` — アクセント・危険色

### APIクライアント: client.ts

**ファイル**: `frontend/src/api/client.ts`

```typescript
// client.ts:3-10
const API_BASE_URL = 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

- 全APIモジュール（tasks, timerSettings, soundSettings）が共有する単一の Axios インスタンス
- `baseURL` は固定値（環境変数化は未対応）
- インターセプター、認証ヘッダーは未設定

### レスポンスマッピングパターン

各APIモジュールは同一のパターンで JSON → ドメイン型変換を行う:

```
XxxResponse (interface)     — JSON の形状を定義（日付は string）
    │
mapXxxResponse (function)   — string → Date 変換
    │
Xxx (type)                  — アプリ内で使用するドメイン型（日付は Date）
```

**例: tasks.ts**

| レイヤー | 型 | `createdAt` の型 |
|---------|---|-----------------|
| JSON (API応答) | `TaskResponse` (`tasks.ts:4-10`) | `string` |
| マッピング関数 | `mapTaskResponse` (`tasks.ts:12-20`) | `string` → `Date` 変換 |
| ドメイン型 | `Task` (`types/task.ts:3-9`) | `Date` |

同様のパターンが `timerSettings.ts` (2つ: Settings + Session) と `soundSettings.ts` (2つ: Settings + Preset) にも存在する。

### レイアウトシステム

**Layout.tsx** (`components/Layout/Layout.tsx:11-18`)

```
<div className="flex min-h-screen">
  <Sidebar activeSection={...} onSectionChange={...} />
  <MainContent>{children}</MainContent>
</div>
```

**Sidebar.tsx** (`components/Layout/Sidebar.tsx:8-43`)

- 4つのメニュー項目を `menuItems` 配列で定義 (`Sidebar.tsx:9-14`)
- `activeSection` と一致するアイテムにアクティブスタイル適用
- `onSectionChange` コールバックで App.tsx の `activeSection` を更新

| メニュー | id | アイコン |
|---------|-----|---------|
| Tasks | `"tasks"` | `CheckSquare` |
| Sounds | `"sounds"` | `Music` |
| Timer | `"timer"` | `Clock` |
| Settings | `"settings"` | `Clock` |

**MainContent.tsx** (`components/Layout/MainContent.tsx:7-15`)

```
<main className="flex-1 h-screen overflow-auto bg-notion-bg">
  <div className="max-w-3xl mx-auto px-12 py-8">
    {children}
  </div>
</main>
```

- `max-w-3xl`: コンテンツ幅を768pxに制限（Notionライク）
- `overflow-auto`: メインエリアのみスクロール

### Layout barrel export

`components/Layout/index.ts`:
```typescript
export { Layout } from './Layout';
export { Sidebar } from './Sidebar';
export { MainContent } from './MainContent';
```

`components/TaskList/index.ts`:
```typescript
export { TaskList } from './TaskList';
export { TaskItem } from './TaskItem';
export { TaskInput } from './TaskInput';
```

## バックエンド基盤

### エントリポイント: SonicFlowApplication.java

**ファイル**: `backend/src/main/java/com/sonicflow/SonicFlowApplication.java`

```java
// SonicFlowApplication.java:6-12
@SpringBootApplication
public class SonicFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(SonicFlowApplication.class, args);
    }
}
```

- `@SpringBootApplication` でコンポーネントスキャン、オートコンフィグレーション、設定を一括有効化
- パッケージ `com.sonicflow` 配下が自動スキャン対象

### CORS設定: WebConfig.java

**ファイル**: `backend/src/main/java/com/sonicflow/config/WebConfig.java`

```java
// WebConfig.java:7-18
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

| 設定 | 値 | 説明 |
|-----|---|------|
| パスパターン | `/api/**` | 全APIエンドポイント |
| 許可オリジン | `http://localhost:5173` | Vite開発サーバー |
| 許可メソッド | GET, POST, PUT, DELETE, OPTIONS | CRUD + preflight |
| 許可ヘッダー | `*` | 全ヘッダー許可 |
| 認証情報 | `true` | Cookie等を許可 |

### データベース設定: application.properties

**ファイル**: `backend/src/main/resources/application.properties`

```properties
# Server
server.port=8080

# H2 Database (file-based persistence)
spring.datasource.url=jdbc:h2:file:./data/sonicflow
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# H2 Console (for debugging)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

| 設定 | 意味 |
|-----|------|
| `jdbc:h2:file:./data/sonicflow` | ファイルベースH2（`data/sonicflow.mv.db`に保存） |
| `ddl-auto=update` | Entity定義からスキーマを自動生成・更新 |
| `show-sql=false` | SQLログを無効化 |
| `h2.console.enabled=true` | `/h2-console` でWebコンソールにアクセス可能 |

### 型定義ファイル一覧

**フロントエンド** (`frontend/src/types/`)

| ファイル | 定義 |
|---------|------|
| `task.ts` | `TaskStatus` (union), `Task` (interface) |
| `timer.ts` | `SessionType` (union), `TimerSettings`, `TimerSession`, `TimerState` (interfaces) |
| `sound.ts` | `SoundSettings`, `SoundPreset`, `SoundSettingsMap` (interfaces) |

**バックエンド** (`backend/src/main/java/com/sonicflow/entity/`)

| ファイル | 定義 |
|---------|------|
| `Task.java` | `@Entity` tasks テーブル |
| `TaskStatus.java` | `enum` TODO, DONE |
| `TimerSettings.java` | `@Entity` timer_settings テーブル |
| `TimerSession.java` | `@Entity` timer_sessions テーブル |
| `SessionType.java` | `enum` WORK, BREAK, LONG_BREAK |
| `SoundSettings.java` | `@Entity` sound_settings テーブル |
| `SoundPreset.java` | `@Entity` sound_presets テーブル |
