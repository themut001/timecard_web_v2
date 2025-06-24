# 🚀 モダンタイムカード管理システム

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-000000?logo=flask)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

**Apple Liquid Glass デザイン** を採用した次世代勤怠管理・日報システム。従来のHTML版から **React + TypeScript** 完全移行により、モダンで美しいUI/UXを実現。

![Timecard System Demo](docs/images/demo.png)

## ✨ 主要機能

### 🎨 UI/UX の特徴
- **Apple Liquid Glass デザイン**: 透明感のあるガラス効果とぼかし
- **視認性最適化**: 背景アニメーション削除で文字が読みやすく
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ完全対応
- **アクセシビリティ**: キーボードナビゲーション・スクリーンリーダー対応
- **スムーズアニメーション**: パフォーマンスを考慮したマイクロインタラクション

### 🔧 技術的革新点
- **React 18**: 最新のReact機能とパフォーマンス最適化
- **TypeScript**: 完全な型安全性とエラーハンドリング
- **Redux Toolkit**: 効率的な状態管理
- **RESTful API**: バックエンドとの完全統合
- **WebSocket**: リアルタイム通知システム
- **Docker**: 簡単デプロイとコンテナ化

### 📋 機能一覧

#### 基本機能
- 📸 **写真付き打刻**: 出退勤時の自動写真撮影（オプション）
- ⏰ **リアルタイム時計**: 大型デジタル表示
- 🚫 **二重打刻防止**: 勤務状態に基づく制御
- 📊 **勤怠履歴**: カレンダー・テーブル表示
- 📈 **統計分析**: 月間勤務時間・日数の自動計算

#### 管理機能
- 👥 **従業員管理**: CRUD操作・部署管理
- 🔐 **ユーザー管理**: 権限・認証管理
- 📊 **出勤レポート**: リアルタイム出勤状況
- 📝 **日報管理**: 全従業員の業務報告確認
- 📥 **データエクスポート**: CSV・PDF出力

#### セキュリティ
- 🔒 **セッション管理**: 8時間有効期限
- 🛡️ **CSRF保護**: クロスサイトリクエストフォージェリ防止
- 🔐 **入力検証**: XSS・SQLインジェクション対策
- 📝 **監査ログ**: セキュリティイベント記録

## 🏗️ システムアーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Flask API     │◄──►│   SQLite DB     │
│  (Frontend)     │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │Tailwind │             │SQLAlchemy│             │ Models  │
    │   CSS   │             │   ORM    │             │  Data   │
    └─────────┘             └─────────┘             └─────────┘
```

### フロントエンド (React App)
```
frontend-react/
├── src/
│   ├── components/       # 再利用可能なUIコンポーネント
│   │   ├── ui/          # 基本UIパーツ (LiquidCard, Button等)
│   │   ├── layout/      # レイアウトコンポーネント
│   │   └── common/      # 共通コンポーネント
│   ├── pages/           # ページコンポーネント
│   │   ├── Dashboard.tsx    # ダッシュボード画面
│   │   ├── Clock.tsx        # タイムクロック画面
│   │   ├── Attendance.tsx   # 勤怠履歴画面
│   │   ├── Requests.tsx     # 申請管理画面
│   │   └── admin/           # 管理者専用画面
│   ├── services/        # API通信・外部サービス
│   ├── store/           # Redux store設定
│   ├── hooks/           # カスタムReact hooks
│   └── types/           # TypeScript型定義
```

### バックエンド (Flask API)
```
backend/
├── app.py               # メインアプリケーション
├── api_routes.py        # RESTful APIエンドポイント
├── models.py            # SQLAlchemyモデル
├── database.py          # DB接続・初期化
├── security.py          # セキュリティ機能
├── utils_optimized.py   # 最適化済みユーティリティ
└── test_suite.py        # テストスイート
```

## 🚀 クイックスタート

### Docker Compose（推奨）

```bash
# リポジトリクローン
git clone <repository-url>
cd claude-code-trial

# 環境変数設定
cp .env.example .env
# 必要に応じて .env を編集

# Docker でビルド・起動
docker-compose up --build

# アクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:5000/api
```

### 開発環境セットアップ

#### バックエンド起動
```bash
cd backend
python -m venv venv

# Windows
venv\\Scripts\\activate
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
| 管理者 | admin | admin123 | 全機能アクセス |
| 一般ユーザー | yamada | yamada123 | 基本機能のみ |

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

### 環境変数設定
```bash
# .env ファイル作成
SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
VITE_API_BASE_URL=https://your-domain.com/api

# オプション
NOTION_API_KEY=your-notion-key
NOTION_DATABASE_ID=your-database-id
```

### Docker Production デプロイ
```bash
# 本番用ビルド
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# SSL対応（Nginx Proxy付き）
docker-compose --profile production up -d
```

### クラウドデプロイ（推奨）

#### フロントエンド（Vercel）
```bash
cd frontend-react
npm run build
vercel --prod
```

#### バックエンド（Railway/Heroku）
```bash
cd backend
echo "web: python app.py" > Procfile
railway login
railway deploy
```

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

## 📊 監視・運用

### ヘルスチェック
```bash
# システム全体の健全性確認
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

## 🔒 セキュリティ

### 本番環境チェックリスト
- [ ] SECRET_KEY を強力なものに変更
- [ ] HTTPS 必須設定
- [ ] CORS 設定の確認
- [ ] データベースアクセス制限
- [ ] ファイアウォール設定
- [ ] セッションタイムアウト設定

### セキュリティ機能
- CSRF 保護
- XSS 防止
- SQLインジェクション対策
- セッション管理
- 入力値検証
- アクセスログ記録

## 🔧 カスタマイズ

### UI テーマ変更
```javascript
// frontend-react/tailwind.config.js
colors: {
  primary: { /* カスタムプライマリカラー */ },
  secondary: { /* カスタムセカンダリカラー */ }
}
```

### API設定変更
```javascript
// frontend-react/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
```

### データベース変更
```python
# backend/database.py
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///data/timecard.db')
# PostgreSQL/MySQL 対応済み
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
curl -v -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'
```

#### ❌ ビルドエラー
```bash
# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Docker キャッシュクリア
docker-compose down
docker system prune -a
```

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

## 🛣️ ロードマップ

### Phase 5: 拡張機能
- [ ] Progressive Web App (PWA) 対応
- [ ] リアルタイム通知強化
- [ ] 顔認証・指紋認証
- [ ] Slack/Teams 連携

### Phase 6: AI機能
- [ ] 勤怠パターン分析
- [ ] 異常検知アラート
- [ ] 自動レポート生成
- [ ] チャットボット サポート

## 📋 ライセンス・サポート

このシステムは社内利用を想定して開発されています。
商用利用や再配布については、開発チームにお問い合わせください。

### サポート連絡先
- 📧 Email: support@company.com
- 📖 Wiki: [Documentation](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/timecard-system/issues)

---

**🎉 美しく実用的な次世代勤怠管理システムをお楽しみください！**

Made with ❤️ by Development Team