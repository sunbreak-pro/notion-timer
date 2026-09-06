# HISTORY archive 2026-09 (chat-main)

### 2026-09-01 - main の CI 赤（TagUsageCard の存在しない import）を PR #1430 で修正

#### 概要

cb445180 以降の main で `shared — build (tsc -b)` が TS2307 で落ちていた。`shared/src/components/Analytics/TagUsageCard.tsx:13` が `./EmptyState` を import していたが、Analytics サブバレルの空状態は `AnalyticsEmptyState` という名前で、`./EmptyState` は存在しない。import 名と JSX タグ名を揃える 2 行の rename で解消し、PR #1430 を open。

#### 変更点

- **原因**: `components/index.ts` が Analytics サブバレルを `export *` で再エクスポートするため、`components/EmptyState` との衝突を避けて意図的に `AnalyticsEmptyState` へ改名してある（`AnalyticsEmptyState.tsx:14-17` のコメントが根拠）。TagUsageCard だけが旧名で import していた（同じフォルダの `MobileAnalyticsView` / `ScheduleTab` / `TimeTab` は全て新名）
- **修正**: `TagUsageCard.tsx` の import 1 行 + JSX タグ 1 箇所を `AnalyticsEmptyState` へ。props（`icon` / `title` / `description`）は両者で完全一致のため振る舞いの変更なし
- **検証**: `shared` の build / typecheck:tests / lint、`tests/analyticsTagUsageCard.test.tsx`（3 passed）、`web` の build — すべて緑
- **経路**: main 直下では feature ブランチを切れないため、一時 worktree `hotfix-emptystate` から `claude/shared-fix-tagusage-emptystate-import` を切って push → PR #1430（open）→ worktree は即削除
- **衝突リスク**: 同じ修正の branch を `materials-refine`（`claude/shared-fix-main-red-20260901`）と `refactor-core`（`claude/shared-fix-analytics-emptystate-import`）が先に切っていた。いずれも未 commit / 未 push だが、両レーンへ「#1430 で着地するので降りてよい」と伝えないと三重作業になる

### 2026-09-01 - アプリ内 Note「Issue報告」を回収して Issue 9 本起票（#1399〜#1407）→ Note 削除

#### 概要

MCP 経由でアプリ内 Note「Issue報告」（Desktop 1 / Mobile 4 / 共通 4 の 9 項目）を回収し、重複チェックと実装箇所のあたり付けをしたうえで #1399〜#1407 として起票した。文が途切れていた 1 項目は起票前にユーザーへ確認して内容を確定。全 9 項目の起票完了後、指示どおり Note をソフトデリートした（「Issue報告のテンプレート」Note は対象外として温存）。

#### 変更点

- **起票 9 本**: #1399（Desktop leftSidebar ブランドヘッダーの縦ずれ・`[layout-standard]`）/ #1400（Mobile サイドバー幅をフォントサイズ非連動へ・`[mobile-refine]`）/ #1401（Mobile 月カレンダー刷新 — 横余白ゼロ・丸点→タイトルの縦リスト・省略記号なし。#1148 の後続）/ #1402（サイドバー swipe 判定を外側にも・#1050 の後続）/ #1403（Event 編集の終日トグルと日付フィールドの重なり・#940 の後続）/ #1404（materials スラッシュコマンドに画像・ファイル添付 — Supabase Storage 前提・🛑 バケット作成はユーザー手番と明記）/ #1405（Event→Todo の逆変換を編集パネルへ・#997 / #1043 参照・Materials 側は触らない）/ #1406（「本日のTodo」タブを「本日分 / その他」の 2 分類へ再編 + ホバー移動 + 移動時は日付のみ変更で時刻保持 — 途切れ項目を AskUser で確定）/ #1407（Materials 切替時のノート表示ロード）
- **Note 削除**: `note-b26afda4-…`（Issue報告）を `delete_note` でソフトデリート（Trash から復元可）
- **ルーティング**: schedule 4 本 = `section:schedule` / materials 2 本 = `section:materials` / shell 3 本 = `shared-fix`（`[layout-standard]` 1 + `[mobile-refine]` 2）。mobile 系 4 本は Epic #716 を参照に付けた

### 2026-09-01 - コード整理監査（Tauri 残骸 / 未使用コード / docs 整合）→ Issue 7 本起票（#1385〜#1391）

#### 概要

ユーザー依頼でコードベースと docs を 3 並列サブエージェント（Tauri 残骸 / 未使用コード / docs 整合）で監査し、file:line の spot check を通った findings を 7 本の Issue として起票した。ファイル・依存としての Tauri は完全に消えており、実装済み計画書の plans/ 残置も #1377 で既知の 1 本（claude-launcher）だけだった。

#### 変更点

- **起票 7 本**: #1385（未使用 `version` カラムのバンプ廃止 — PostgREST が `version = version + 1` を書けないため**全 mutation で version 取得専用 SELECT が 1 本余計に飛んでいる**。LWW cursor は `updated_at` で version は無関係・mcp-server は準拠済みで shared だけが残置）/ #1386（`migrateTodosToBackend` 削除 — 呼び出し元 0 を実測・4 箇所のみ）/ #1387（削除済み `frontend/` FROZEN 前提・撤去済み Provider の陳腐化コメント一掃 — `PRINCIPLES.md:190` は存在しない 3 Provider の Optional バリアントを指示する規範のまま）/ #1388（dead i18n 33 キー + dead CSS — kanban 名前空間は CalendarTab / TagColorControls が 6 キー借用中なので移設してから名前空間ごと削除）/ #1389（参照ゼロ export 5 型 + 使われないテストシーム + `EmptyState` 同名 2 実装の rename）/ #1390（#1293 Trash 移設の design docs 追随 — IA.md が registry に無い Trash をユーティリティ枠として列挙・_COMMON-CONTEXT は Version 3 のまま）/ #1391（add-ipc-channel スキルの「7 関数」が実装 9 と乖離ほか dead path・数値 drift の束）
- **起票しなかったもの**: claude-launcher 計画書の残置（#1377 で既知）/ `fetchAllPages` の shared↔mcp 重複（#677 の承認済み負債・コードコメントに明記あり）/ mapper の過剰 export 30+（公開 API サーフェス方針の判断が要るため #1389 の備考に留めた）/ REFERENCE 計画書の置き場不統一（A/B 裁定として #1391 内に記載）
- **監査の白判定**: Tauri ファイル・依存・IPC = 0 / ScreenLock・FileExplorer・Terminal 残骸 = 0 / import グラフ上の orphan ファイル = 0（src 400+ ファイル）/ plans 14 本の Status enum 逸脱 = 0 / d3・Connect グラフ残骸 = 0
- **運用メモ**: 未使用コード調査のサブエージェントが 600 秒ストール → SendMessage で再開させて完走（SSE バグの既知型）
