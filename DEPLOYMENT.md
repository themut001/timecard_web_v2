# 🚀 タイムカード管理システム - デプロイメントガイド

完全統合されたReact + Flask勤怠管理システムのデプロイメント手順

## 📋 システム概要

### アーキテクチャ
- **フロントエンド**: React 18 + TypeScript + Vite
- **バックエンド**: Flask + SQLAlchemy + SQLite
- **API**: RESTful API with セッション管理
- **UI/UX**: Liquid Glass デザイン（視認性最適化済み）
- **状態管理**: Redux Toolkit
- **認証**: セッション＋Cookie ベース

### 新機能・改良点
- ✅ **RESTful API**: 完全な API エンドポイント実装
- ✅ **TypeScript 型安全性**: 完全な型定義とエラーハンドリング
- ✅ **リアルタイム通知**: ブラウザ通知 + WebSocket 対応
- ✅ **エラーバウンダリー**: 堅牢なエラーハンドリング
- ✅ **ヘルスチェック**: 監視・運用対応
- ✅ **Docker対応**: コンテナ化による簡単デプロイ

## 🚀 クイックスタート

### 方法1: Docker Compose（推奨）

```bash
# リポジトリクローン
cd /mnt/c/Users/keikp/デスクトップ/claude-code-trial

# 環境変数設定
cp .env.example .env
# 必要に応じて .env を編集

# Docker でビルド・起動
docker-compose up --build

# アクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:5000/api
# ヘルスチェック: http://localhost:5000/api/health
```

### 方法2: 開発環境セットアップ

#### バックエンド起動
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
# http://localhost:5000 で起動
```

#### フロントエンド起動
```bash
cd frontend-react
npm install
npm run dev
# http://localhost:3000 で起動
```

## 🔐 デモアカウント

| 役割 | ユーザー名 | パスワード | 権限 |
|------|------------|------------|------|
| 管理者 | admin | admin123 | 全機能 |
| 一般ユーザー | yamada | yamada123 | 基本機能 |

## 📡 API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト  
- `GET /api/auth/me` - 現在のユーザー情報

### 勤怠管理
- `GET /api/attendance/today` - 今日の勤怠記録
- `POST /api/attendance/clock-in` - 出勤打刻
- `POST /api/attendance/clock-out` - 退勤打刻
- `POST /api/attendance/break/start` - 休憩開始
- `POST /api/attendance/break/end` - 休憩終了
- `GET /api/attendance/recent` - 最近の記録
- `GET /api/attendance/monthly` - 月間記録

### 管理者機能
- `GET /api/admin/employees` - 社員一覧
- `GET /api/admin/attendance/summary` - 出勤サマリー

### システム
- `GET /api/health` - ヘルスチェック
- `GET /api/status` - システム状態

## 🌐 本番環境デプロイ

### 1. 環境変数設定

```bash
# .env ファイル作成
SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
VITE_API_BASE_URL=https://your-domain.com/api

# オプション
NOTION_API_KEY=your-notion-key
NOTION_DATABASE_ID=your-database-id
```

### 2. Docker Production デプロイ

```bash
# 本番用ビルド
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# SSL対応（Nginx Proxy付き）
docker-compose --profile production up -d
```

### 3. Vercel + Railway デプロイ

#### フロントエンド（Vercel）
```bash
cd frontend-react
npm run build

# Vercel CLI
vercel --prod
```

#### バックエンド（Railway/Heroku）
```bash
cd backend
# Procfile 作成
echo "web: python app.py" > Procfile

# Railway デプロイ
railway login
railway deploy
```

### 4. AWS/Azure/GCP デプロイ

詳細な設定ファイルは `deployment/` ディレクトリを参照。

## 🔧 設定・カスタマイズ

### データベース変更
```python
# backend/database.py で設定変更
# SQLite → PostgreSQL/MySQL 対応済み
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///data/timecard.db')
```

### フロントエンド設定
```javascript
// frontend-react/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
```

### UI テーマカスタマイズ
```css
/* frontend-react/tailwind.config.js */
colors: {
  primary: { /* カスタムカラー */ },
  secondary: { /* カスタムカラー */ }
}
```

## 📊 監視・運用

### ヘルスチェック
```bash
# システム全体
curl http://localhost:5000/api/health

# データベース接続確認
curl http://localhost:5000/api/status
```

### ログ確認
```bash
# アプリケーションログ
tail -f backend/logs/app.log

# セキュリティログ  
tail -f backend/logs/security.log

# Docker ログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

### パフォーマンス監視
- **Sentry**: エラー監視
- **New Relic**: APM監視  
- **Prometheus + Grafana**: メトリクス監視

## 🔒 セキュリティ

### 本番環境チェックリスト
- [ ] SECRET_KEY を強力なものに変更
- [ ] HTTPS 必須設定
- [ ] CORS 設定の確認
- [ ] データベースアクセス制限
- [ ] ファイアウォール設定
- [ ] セッションタイムアウト設定
- [ ] ログローテーション設定

### セキュリティ機能
- CSRF 保護
- XSS 防止
- SQLインジェクション対策
- セッション管理
- 入力値検証
- アクセスログ記録

## 🧪 テスト

### バックエンドテスト
```bash
cd backend
python test_suite.py
```

### フロントエンドテスト
```bash
cd frontend-react
npm run test
npm run test:coverage
```

### E2Eテスト
```bash
npm run test:e2e
```

## 🔄 アップデート手順

### 1. バックアップ
```bash
# データベースバックアップ
cp backend/data/timecard.db backend/data/timecard_backup.db

# 設定ファイルバックアップ
cp .env .env.backup
```

### 2. アップデート
```bash
git pull origin main
docker-compose down
docker-compose up --build -d
```

### 3. 動作確認
```bash
curl http://localhost:5000/api/health
```

## 🆘 トラブルシューティング

### よくある問題

#### ❌ API接続エラー
```bash
# CORS設定確認
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/health

# ネットワーク確認
docker network ls
docker-compose ps
```

#### ❌ 認証エラー
```bash
# セッション設定確認
curl -v -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### ❌ データベースエラー
```bash
# データベース初期化
cd backend
python -c "from database import init_db; init_db()"
```

### サポート・連絡先
- 📧 Email: support@company.com
- 📖 Wiki: http://wiki.company.com/timecard
- 🐛 Issue: GitHub Issues

## 📈 パフォーマンス最適化

### フロントエンド最適化
- コード分割（React.lazy）
- バンドルサイズ最適化
- 画像最適化
- CDN配信

### バックエンド最適化
- データベースインデックス
- クエリ最適化
- キャッシュ機能
- レスポンス圧縮

## 📋 ライセンス・利用規約

このシステムは社内利用を想定して開発されています。
商用利用や再配布については、開発チームにお問い合わせください。

---

**🎉 デプロイ完了！美しく実用的な勤怠管理システムをお楽しみください。**