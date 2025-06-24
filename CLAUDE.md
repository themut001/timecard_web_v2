# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

タイムカード管理システム - Apple Liquid Glass UIデザインを採用したモダンなWebアプリケーション

### UI/UXの特徴
- **Apple Liquid Glass デザイン**: 透明感のあるガラス効果とぼかし
- **Tailwind CSS**: ユーティリティファーストのCSS フレームワーク
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **アクセシビリティ**: キーボードナビゲーション・スクリーンリーダー対応
- **アニメーション**: パフォーマンスを考慮したモーション効果

### セキュリティ機能
- **入力検証**: XSS・SQLインジェクション対策
- **レート制限**: 不正アクセス防止
- **セッション管理**: セキュアなセッション処理
- **CSRF保護**: クロスサイトリクエストフォージェリ対策

## コマンド

### 開発・実行
```bash
# アプリケーションの起動
cd backend
python app.py

# 構文チェック
python -m py_compile backend/app.py

# 依存関係のインストール
pip install -r requirements.txt

# 仮想環境の作成（推奨）
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 本番環境
```bash
# Gunicornを使用した本番起動
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## システムアーキテクチャ

### 全体構成
- **Flask** ベースのWebアプリケーション
- **SQLAlchemy** によるORM
- **SQLite** データベース（`data/timecard.db`）
- **フロントエンド**: Pure HTML/CSS/JavaScript
- **認証**: セッション管理（8時間有効）
- **外部連携**: Notion API（タグ同期）

### データベース設計
主要なモデル：
- `User`: ログイン認証用
- `Employee`: 従業員情報
- `TimeRecord`: 出退勤記録
- `DailyReport`: 日報
- `Tag`: Notionから同期されるタグ
- `TagWorkTime`: タグ別工数管理

### 認証・権限
- セッション管理による認証
- 管理者（`is_admin=True`）と一般ユーザーの分離
- ユーザーと従業員は1:1で関連付け

### 画面構成
1. ログイン画面（`/login`）
2. 打刻画面（`/`）- 出退勤記録
3. マイページ（`/mypage`）- 日報作成・勤怠確認
4. 管理者画面（`/admin`）- 従業員・ユーザー管理

### 重要な機能
- **二重打刻防止**: 勤務状態をリアルタイムで管理
- **写真付き打刻**: カメラ撮影（オプション）
- **Notion連携**: タグ同期とタグ別工数管理
- **CSV出力**: 勤怠データのエクスポート

## 環境変数
```bash
SECRET_KEY=your-secret-key
FLASK_ENV=production
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-database-id
```

## 開発ガイドライン
- コード変更時は必ず構文チェックを実行
- コミットメッセージは日本語で記述
- PRメッセージは変更内容と実行したテスト結果を日本語で記載
- 完全日本語対応のUI

## 初期データ
- 管理者: `admin` / `admin123`
- 一般ユーザー: `yamada` / `yamada123` など
- 初期従業員データは自動作成

## テスト実行

### 自動テスト
```bash
# バックエンドテストの実行
cd backend
python test_suite.py

# テストカバレッジの確認
pip install coverage
coverage run test_suite.py
coverage report
```

### 手動テスト
- 詳細なテスト手順は `TESTING.md` を参照
- 全ブラウザでの動作確認を推奨
- モバイルデバイスでのテストも必須

## 開発フェーズ履歴

### Phase 1: 基本機能実装
- ログイン・認証システム
- 打刻機能（出勤・退勤）
- 基本的なUI

### Phase 2: UI/UX改善
- Apple Liquid Glass デザインの導入
- Tailwind CSS への移行
- レスポンシブデザイン対応

### Phase 3: 機能拡張
- マイページ機能
- 日報作成・管理
- 管理者画面の強化

### Phase 4: 最適化・品質向上
- バックエンドAPI最適化
- セキュリティ強化
- アクセシビリティ対応
- アニメーション効果の最適化
- 総合テスト実装

## 重要なファイル

### フロントエンド
- `frontend/index.html`: メイン打刻画面
- `frontend/login.html`: ログイン画面
- `frontend/mypage.html`: マイページ
- `frontend/admin.html`: 管理者画面
- `frontend/js/accessibility.js`: アクセシビリティ機能
- `frontend/js/animations.js`: アニメーション管理

### バックエンド
- `backend/app.py`: メインアプリケーション
- `backend/models.py`: データベースモデル
- `backend/security.py`: セキュリティ機能
- `backend/utils_optimized.py`: 最適化ユーティリティ
- `backend/test_suite.py`: テストスイート

## 注意事項

### セキュリティ
- 本番環境では `SECRET_KEY` を適切に設定
- HTTPS の使用を強く推奨
- ログファイルの定期的な監視

### パフォーマンス
- 大量データ処理時のメモリ使用量に注意
- データベースインデックスの適切な設定
- 画像ファイルのサイズ制限

### アクセシビリティ
- キーボードナビゲーションの動作確認
- スクリーンリーダーでの読み上げテスト
- カラーコントラストの確認

## トラブルシューティング

### よくある問題
1. **カメラが動作しない**
   - ブラウザの権限設定を確認
   - HTTPS環境での実行を推奨

2. **セッションが切れる**
   - `SESSION_TIMEOUT` の設定を確認
   - ブラウザのクッキー設定を確認

3. **レスポンスが遅い**
   - データベースの最適化を実行
   - ログファイルのサイズを確認

### ログ確認
```bash
# セキュリティログの確認
tail -f backend/logs/security.log

# アプリケーションログの確認
tail -f backend/logs/app.log
```