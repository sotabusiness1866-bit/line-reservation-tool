# LINE予約ツール

LINEのリッチメニューから開いたLIFF画面でメニュー・日時を選ぶだけで予約が完結する、店舗向け予約ツール（MVP）。予約確定・前日リマインドはLINE公式アカウントから自動送信される。決済機能は対象外（`requirements.md` 参照）。

## 技術スタック

- Next.js 16（App Router, TypeScript）/ Tailwind CSS
- Supabase（Auth・Postgres。予約の二重登録防止はPostgresのEXCLUDE制約で保証）
- LINEミニアプリ（LIFF）+ LINE Messaging API（Push Message）
- Vercel Cron（前日リマインドの定期実行）

## セットアップ手順

### 1. Supabaseプロジェクトを作成

[supabase.com](https://supabase.com) で新規プロジェクトを作成し、**Project Settings → API** から以下を控える。

- Project URL
- `anon` `public` key
- `service_role` key（予約作成・空き枠計算・管理APIで使用するサーバー専用キー）

### 2. DBスキーマを適用

Supabaseダッシュボードの **SQL Editor** で `supabase/migrations/0001_init.sql` を実行する。
`menus` / `business_hours`（初期値：日曜定休、平日10-19時、土曜10-18時） / `closed_dates` / `reservations` テーブルとRLSポリシーが作成される。

### 3. Authのマジックリンク設定を確認（店舗管理画面用）

- **Authentication → Providers** でEmail（Magic Link）が有効になっていることを確認
- **Authentication → URL Configuration** の Redirect URLsに以下を追加
  - `http://localhost:3000/auth/callback`（開発用）
  - 本番URLの `https://<your-domain>/auth/callback`（デプロイ後）
- ログインは `shouldCreateUser: false` の招待制。**Authentication → Users → Add user** から店舗スタッフのメールアドレスを事前に作成しておく

### 4. LINE Developersでチャネルを作成

[LINE Developers Console](https://developers.line.biz/) で以下を作成する。

1. プロバイダーを作成し、**Messaging APIチャネル**を作成
   - チャネルアクセストークン（長期）を発行 → `LINE_CHANNEL_ACCESS_TOKEN`
2. 同じプロバイダー内に**LIFFアプリ**を追加
   - Endpoint URLに、デプロイ先のLIFF画面のURL（例：`https://your-app.vercel.app/liff`）を設定
   - Scopeは `profile` を有効化
   - 発行されたLIFF IDを `NEXT_PUBLIC_LIFF_ID` に設定
3. Messaging APIチャネルの「Messaging API設定」で、**リッチメニュー**を作成し、ボタンのリンク先をLIFFのURL（`https://liff.line.me/<LIFF ID>`）に設定する
4. 応答メッセージ・あいさつメッセージは任意でオフにしてよい（本ツールは自動応答Botではなく、予約確定・リマインドの通知のみ送信する）

### 5. 環境変数を設定

```bash
cp .env.example .env.local
```

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（クライアント公開可、RLSで保護） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key（サーバー専用） |
| `NEXT_PUBLIC_LIFF_ID` | LIFFアプリのID |
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging APIチャネルアクセストークン（サーバー専用） |
| `CRON_SECRET` | `/api/cron/reminder` を外部から呼べないようにする合言葉。Vercel Cronは環境変数名`CRON_SECRET`を自動でAuthorizationヘッダーに付与する |
| `NEXT_PUBLIC_SITE_URL` | マジックリンクのリダイレクト先構築に使用。本番デプロイ時はデプロイ先のURLに変更 |

### 6. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

- 顧客側（LIFF）: `http://localhost:3000/liff` （LINEアプリ内でLIFF URLを開かないとログインできないため、実際の予約動作確認はLINEアプリ経由で行う）
- 店舗管理画面: `http://localhost:3000/admin/login`

## 動作確認手順

1. `/admin/login` でメールアドレスを入力 → 受信メールのリンクからログイン
2. 「メニュー設定」でメニューを1件登録
3. 「空き枠設定」で営業時間を確認（初期値のままでも可）
4. LINEアプリでリッチメニューから予約画面を開く → メニュー選択 → 日時選択 → 氏名・電話番号入力 → 予約確定
5. LINEのトークに確定メッセージが届くことを確認
6. 管理画面の「予約管理」に予約が反映されていることを確認
7. 予約詳細から「予約をキャンセルする」→ LINEにキャンセル通知が届くことを確認

## 前日リマインドの動作確認

`vercel.json` でVercel Cronが毎日9:00 UTC（18:00 JST）に `/api/cron/reminder` を呼ぶよう設定済み。ローカルで手動確認する場合：

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminder
```

## 本番デプロイ（Vercel）

1. Vercelでプロジェクトを作成し、このリポジトリを接続
2. 上記の環境変数をVercelのProject Settings → Environment Variablesに登録
   - `NEXT_PUBLIC_SITE_URL` は本番ドメインに変更
3. SupabaseのRedirect URLs、LINE DevelopersのLIFF Endpoint URLを本番ドメインに更新
4. デプロイ（`vercel.json` のCron設定は自動で有効になる）

## スコープについて

本リポジトリはMVP（F-01〜F-11：メニュー選択・空き枠表示・予約確定・二重予約防止・LINE通知・店舗管理画面）のみを実装している。
スタッフ指名予約、顧客側での予約変更・キャンセル、顧客管理はv1.0、Googleカレンダー連携・複数店舗対応・レポートはv2.0のスコープ（`requirements.md` 参照）。決済機能は対象外。
