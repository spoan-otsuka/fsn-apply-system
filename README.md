# fun sport nexus 2026.12 申込システム

「fun sport nexus」12月開催の参加申込システム。

公開URL（予定）：**https://apply.funsportnexus.org/**

## アーキテクチャ

```
[ユーザー]
    ↓
[Cloudflare Pages]
    ├ 静的サイト（HTML / CSS / JS）── public/
    └ Pages Functions ────────────── functions/
         ├ /api/slots         スロット一覧＋残席
         ├ /api/apply         申込受付
         └ /api/admin/*       管理API（Cloudflare Access保護）
              ↓
    [Cloudflare D1（SQLite）]
         ├ slots         プログラム枠
         ├ entries       申込
         └ entry_slots   申込×枠（中間）
              ↓
    [Resend API]         自動メール送信
```

## 主な機能

- 各プログラム枠を選択して申込（複数選択可）
- リアルタイム残席表示
- **時間重複NG**：同じ時間帯に2つ以上のプログラムを選択するとエラー
- **同種目複数回NG**：例：Legitダンス①②③を全部選択するとエラー
- **定員到達時の自動ブロック**：満席スロットはチェック不可
- 申込完了で自動メール2系統送信（事務局／申込者）
- 管理画面：申込一覧／残席ダッシュボード／定員調整／CSVエクスポート

## ディレクトリ構成

```
/
├ public/                    静的ファイル
│  ├ index.html              申込フォーム TOP
│  ├ admin/                  管理画面
│  │  └ index.html
│  └ assets/
│     ├ css/main.css
│     └ js/apply.js
├ functions/                 Cloudflare Pages Functions
│  ├ api/
│  │  ├ slots.js             GET スロット一覧
│  │  ├ apply.js             POST 申込受付
│  │  └ admin/
│  │     ├ entries.js        GET 申込一覧
│  │     ├ slots.js          PATCH スロット定員調整
│  │     └ export.js         GET CSVエクスポート
├ db/
│  ├ schema.sql              D1 スキーマ
│  └ seed.sql                初期データ（全プログラム枠）
├ wrangler.toml              Cloudflare 設定
└ README.md
```

## セットアップ手順（大塚さん側）

### 1. Cloudflare D1 データベース作成

1. Cloudflare ダッシュボード → 左メニュー「Workers と Pages」→ 上タブ「D1」
2. 「データベースを作成」→ 名前：`fsn-apply-db`
3. 表示される **Database ID** をコピーして `wrangler.toml` の `database_id` に設定
4. 「コンソール」タブで `db/schema.sql` の内容を貼り付け実行
5. 続けて `db/seed.sql` の内容を貼り付け実行

### 2. Cloudflare Pages プロジェクト作成

1. Cloudflare ダッシュボード → 「Workers と Pages」→ 「Pages」→ 「Git連携」
2. GitHub リポジトリ `spoan-otsuka/fsn-apply-system` を選択
3. ビルド設定：
   - Framework preset: None
   - Build command: （空）
   - Build output directory: `public`
4. デプロイ実行

### 3. D1 バインディング設定

1. Pages プロジェクトの「設定」→「Functions」→「D1 データベース バインディング」
2. 変数名：`DB`、データベース：`fsn-apply-db` を選択

### 4. Resend セットアップ

1. https://resend.com で無料アカウント作成
2. ドメイン認証：`funsportnexus.org` のDNS（Cloudflare）に SPF/DKIM レコード追加
3. API キー取得
4. Cloudflare Pages の「設定」→「環境変数」に追加：
   - `RESEND_API_KEY`：API キー
   - `ADMIN_EMAIL`：`funsportnexus@spoan.or.jp`
   - `FROM_EMAIL`：`info@funsportnexus.org`
   - `FROM_NAME`：`fun sport nexus 運営事務局`

### 5. カスタムドメイン設定

1. Pages プロジェクト → 「カスタムドメイン」
2. `apply.funsportnexus.org` を追加
3. Cloudflare DNS で CNAME 自動設定（プロキシON）

### 6. Cloudflare Access（管理画面保護）

1. Zero Trust ダッシュボード → 「Access」→「Applications」
2. アプリ追加：`apply.funsportnexus.org/admin/*`
3. ポリシー：許可メールアドレスのみ（funsportnexus@spoan.or.jp）

### 7. WordPress に iframe 埋め込み

`/dec2026/apply/` ページの本文（page-content/dec2026-apply.html）に：

```html
<iframe
  src="https://apply.funsportnexus.org/"
  width="100%"
  height="2000"
  frameborder="0"
  style="border: 0; max-width: 100%;">
</iframe>
```

iFrame Resizer で高さ自動調整も検討。

## ローカル開発

```bash
npm install -g wrangler
wrangler login
wrangler pages dev public --d1 DB=fsn-apply-db
```

## ライセンス

© 公益財団法人 スポーツ安全協会
