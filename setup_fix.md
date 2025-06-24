# Python 3.13 + SQLAlchemy 互換性問題の解決方法

## 問題の原因
Python 3.13とSQLAlchemy 1.4の間に互換性問題があります。SQLAlchemy 2.0以降でPython 3.13がサポートされています。

## 解決手順

### 方法1: 仮想環境の再作成（推奨）

```bash
# 1. 現在の仮想環境を削除
rmdir /s venv

# 2. Python 3.12を使用して新しい仮想環境を作成
# （システムにPython 3.12がインストールされている場合）
py -3.12 -m venv venv

# または、現在のPython（3.13）でも新しいSQLAlchemyで動作します
python -m venv venv

# 3. 仮想環境をアクティベート
venv\Scripts\activate

# 4. pipを最新版にアップグレード
python -m pip install --upgrade pip

# 5. 依存関係をインストール
pip install -r requirements.txt
```

### 方法2: 現在の仮想環境でアップグレード

```bash
# 仮想環境をアクティベート
venv\Scripts\activate

# SQLAlchemyを最新版にアップグレード
pip install --upgrade SQLAlchemy==2.0.23

# 他の依存関係も最新版にアップグレード
pip install --upgrade Flask==3.0.0 Werkzeug==3.0.1

# または一括アップグレード
pip install -r requirements.txt --upgrade
```

### 方法3: 互換性のあるバージョンを使用

```bash
# 仮想環境をアクティベート
venv\Scripts\activate

# Python 3.13対応のバージョンをインストール
pip install SQLAlchemy>=2.0.0
pip install Flask>=3.0.0
```

## アプリケーション起動

```bash
# 仮想環境をアクティベート
venv\Scripts\activate

# バックエンドディレクトリに移動
cd backend

# アプリケーション起動
python app.py
```

## トラブルシューティング

### エラーが続く場合

1. **完全なクリーンインストール**
   ```bash
   # 仮想環境を完全削除
   rmdir /s venv
   
   # 新しい仮想環境を作成
   python -m venv venv
   venv\Scripts\activate
   
   # 最小限のパッケージからインストール
   pip install Flask==3.0.0
   pip install SQLAlchemy==2.0.23
   pip install Flask-CORS==4.0.0
   pip install pytz==2023.3
   pip install requests==2.31.0
   ```

2. **Python 3.12の使用**
   - Python 3.12がシステムにインストールされている場合
   ```bash
   py -3.12 -m venv venv
   ```

3. **開発モードでの実行**
   ```bash
   # デバッグモードで詳細なエラー情報を確認
   set FLASK_DEBUG=1
   python app.py
   ```

## バージョン確認コマンド

```bash
# Python バージョン確認
python --version

# インストール済みパッケージの確認
pip list

# 特定パッケージのバージョン確認
pip show SQLAlchemy
pip show Flask
```

## 推奨アクション

**最も確実な解決方法**: 方法1の仮想環境再作成を推奨します。これにより、すべての依存関係が最新の互換性のあるバージョンでインストールされます。