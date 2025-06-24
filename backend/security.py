# セキュリティ強化とエラーハンドリング

import os
import re
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, session, g
import pytz

# ログディレクトリの作成
os.makedirs('logs', exist_ok=True)

# セキュリティログの設定
security_logger = logging.getLogger('security')
security_handler = logging.FileHandler('logs/security.log')
security_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
security_logger.addHandler(security_handler)
security_logger.setLevel(logging.INFO)

JST = pytz.timezone('Asia/Tokyo')

class SecurityManager:
    def __init__(self):
        self.failed_attempts = {}
        self.blocked_ips = set()
        self.rate_limits = {}
        
    def validate_input(self, data, validation_rules):
        """入力データの検証"""
        errors = []
        
        for field, rules in validation_rules.items():
            value = data.get(field)
            
            # 必須チェック
            if rules.get('required', False) and not value:
                errors.append(f'{field}は必須項目です')
                continue
            
            if value is None:
                continue
                
            # 型チェック
            expected_type = rules.get('type')
            if expected_type and not isinstance(value, expected_type):
                errors.append(f'{field}の型が正しくありません')
                continue
            
            # 文字列の場合の追加検証
            if isinstance(value, str):
                # 長さチェック
                min_length = rules.get('min_length', 0)
                max_length = rules.get('max_length', float('inf'))
                if not (min_length <= len(value) <= max_length):
                    errors.append(f'{field}は{min_length}文字以上{max_length}文字以下で入力してください')
                
                # パターンチェック
                pattern = rules.get('pattern')
                if pattern and not re.match(pattern, value):
                    errors.append(f'{field}の形式が正しくありません')
                
                # 危険な文字列のチェック
                if self.contains_malicious_content(value):
                    errors.append(f'{field}に不正な文字列が含まれています')
            
            # 数値の場合の追加検証
            if isinstance(value, (int, float)):
                min_val = rules.get('min_value', float('-inf'))
                max_val = rules.get('max_value', float('inf'))
                if not (min_val <= value <= max_val):
                    errors.append(f'{field}は{min_val}以上{max_val}以下で入力してください')
        
        return errors
    
    def contains_malicious_content(self, content):
        """悪意のあるコンテンツの検出"""
        malicious_patterns = [
            r'<script.*?>.*?</script>',  # XSS
            r'javascript:',
            r'on\w+\s*=',  # イベントハンドラ
            r'union\s+select',  # SQL Injection
            r'drop\s+table',
            r'insert\s+into',
            r'delete\s+from',
            r'update\s+.*\s+set',
            r'exec\s*\(',
            r'eval\s*\(',
            r'system\s*\(',
            r'\.\./',  # Path traversal
            r'%2e%2e%2f',
            r'%252e%252e%252f'
        ]
        
        content_lower = content.lower()
        for pattern in malicious_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        return False
    
    def sanitize_string(self, value, max_length=1000):
        """文字列のサニタイズ"""
        if not isinstance(value, str):
            return value
        
        # HTMLエスケープ
        value = (value.replace('&', '&amp;')
                     .replace('<', '&lt;')
                     .replace('>', '&gt;')
                     .replace('"', '&quot;')
                     .replace("'", '&#x27;'))
        
        # 長さ制限
        if len(value) > max_length:
            value = value[:max_length]
        
        # 制御文字の除去
        value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
        
        return value.strip()
    
    def check_rate_limit(self, identifier, max_requests=60, window_minutes=1):
        """レート制限のチェック"""
        now = datetime.now(JST)
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.rate_limits:
            self.rate_limits[identifier] = []
        
        # 古いリクエストを削除
        self.rate_limits[identifier] = [
            timestamp for timestamp in self.rate_limits[identifier]
            if timestamp > window_start
        ]
        
        # 制限チェック
        if len(self.rate_limits[identifier]) >= max_requests:
            return False
        
        # 現在のリクエストを記録
        self.rate_limits[identifier].append(now)
        return True
    
    def log_security_event(self, event_type, details, severity='INFO'):
        """セキュリティイベントのログ記録"""
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', 'Unknown')
        user_id = session.get('user_id', 'Anonymous')
        
        log_entry = {
            'timestamp': datetime.now(JST).isoformat(),
            'event_type': event_type,
            'severity': severity,
            'client_ip': client_ip,
            'user_agent': user_agent,
            'user_id': user_id,
            'details': details
        }
        
        security_logger.log(
            getattr(logging, severity),
            f"Security Event: {event_type} | IP: {client_ip} | User: {user_id} | Details: {details}"
        )
        
        return log_entry
    
    def check_failed_login_attempts(self, identifier, max_attempts=5, lockout_minutes=15):
        """ログイン失敗回数のチェック"""
        now = datetime.now(JST)
        
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = []
        
        # 古い試行を削除
        cutoff_time = now - timedelta(minutes=lockout_minutes)
        self.failed_attempts[identifier] = [
            timestamp for timestamp in self.failed_attempts[identifier]
            if timestamp > cutoff_time
        ]
        
        return len(self.failed_attempts[identifier]) < max_attempts
    
    def record_failed_login(self, identifier):
        """ログイン失敗の記録"""
        now = datetime.now(JST)
        
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = []
        
        self.failed_attempts[identifier].append(now)
        
        self.log_security_event(
            'FAILED_LOGIN_ATTEMPT',
            f'Identifier: {identifier}',
            'WARNING'
        )
    
    def validate_session(self):
        """セッションの妥当性チェック"""
        if 'user_id' not in session:
            return False
        
        # セッションハイジャック対策
        current_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        session_ip = session.get('ip_address')
        
        if session_ip and session_ip != current_ip:
            self.log_security_event(
                'SESSION_IP_MISMATCH',
                f'Session IP: {session_ip}, Current IP: {current_ip}',
                'ERROR'
            )
            return False
        
        # セッション期限チェック
        last_activity = session.get('last_activity')
        if last_activity:
            last_activity_time = datetime.fromisoformat(last_activity)
            if datetime.now(JST) - last_activity_time > timedelta(hours=8):
                return False
        
        return True
    
    def generate_csrf_token(self):
        """CSRFトークンの生成"""
        token = secrets.token_urlsafe(32)
        session['csrf_token'] = token
        return token
    
    def validate_csrf_token(self, token):
        """CSRFトークンの検証"""
        session_token = session.get('csrf_token')
        return session_token and secrets.compare_digest(session_token, token)

# グローバルインスタンス
security_manager = SecurityManager()

def secure_endpoint(max_requests=60, window_minutes=1):
    """セキュアエンドポイントデコレータ"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            
            # IPブロックチェック
            if client_ip in security_manager.blocked_ips:
                security_manager.log_security_event(
                    'BLOCKED_IP_ACCESS',
                    f'Blocked IP attempted access: {client_ip}',
                    'ERROR'
                )
                return jsonify({'error': 'アクセスが拒否されました'}), 403
            
            # レート制限チェック
            if not security_manager.check_rate_limit(client_ip, max_requests, window_minutes):
                security_manager.log_security_event(
                    'RATE_LIMIT_EXCEEDED',
                    f'Rate limit exceeded for IP: {client_ip}',
                    'WARNING'
                )
                return jsonify({'error': 'リクエストが多すぎます。しばらく待ってから再試行してください'}), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_input_data(validation_rules):
    """入力データ検証デコレータ"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # JSONデータの検証
            if request.is_json:
                data = request.get_json() or {}
            else:
                data = request.form.to_dict()
            
            errors = security_manager.validate_input(data, validation_rules)
            
            if errors:
                security_manager.log_security_event(
                    'INPUT_VALIDATION_FAILED',
                    f'Validation errors: {errors}',
                    'WARNING'
                )
                return jsonify({'error': 'Validation failed', 'details': errors}), 400
            
            # サニタイズされたデータをリクエストに追加
            sanitized_data = {}
            for key, value in data.items():
                if isinstance(value, str):
                    sanitized_data[key] = security_manager.sanitize_string(value)
                else:
                    sanitized_data[key] = value
            
            g.validated_data = sanitized_data
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_csrf_token(f):
    """CSRFトークン必須デコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'DELETE']:
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
            
            if not token or not security_manager.validate_csrf_token(token):
                security_manager.log_security_event(
                    'CSRF_TOKEN_VALIDATION_FAILED',
                    'Invalid or missing CSRF token',
                    'ERROR'
                )
                return jsonify({'error': 'Invalid CSRF token'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

class ErrorHandler:
    """統一エラーハンドリング"""
    
    @staticmethod
    def handle_validation_error(error):
        """バリデーションエラーの処理"""
        return jsonify({
            'error': 'Validation Error',
            'message': 'リクエストデータに問題があります',
            'details': str(error)
        }), 400
    
    @staticmethod
    def handle_authentication_error():
        """認証エラーの処理"""
        return jsonify({
            'error': 'Authentication Error',
            'message': '認証が必要です',
            'authenticated': False
        }), 401
    
    @staticmethod
    def handle_authorization_error():
        """認可エラーの処理"""
        return jsonify({
            'error': 'Authorization Error',
            'message': '権限が不足しています',
            'authorized': False
        }), 403
    
    @staticmethod
    def handle_not_found_error(resource='リソース'):
        """Not Foundエラーの処理"""
        return jsonify({
            'error': 'Not Found',
            'message': f'{resource}が見つかりません'
        }), 404
    
    @staticmethod
    def handle_server_error(error):
        """サーバーエラーの処理"""
        security_manager.log_security_event(
            'SERVER_ERROR',
            f'Internal server error: {str(error)}',
            'ERROR'
        )
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'サーバー内部でエラーが発生しました'
        }), 500
    
    @staticmethod
    def handle_database_error(error):
        """データベースエラーの処理"""
        security_manager.log_security_event(
            'DATABASE_ERROR',
            f'Database error: {str(error)}',
            'ERROR'
        )
        
        return jsonify({
            'error': 'Database Error',
            'message': 'データベース操作でエラーが発生しました'
        }), 500

# パスワード強度チェック
def validate_password_strength(password):
    """パスワード強度の検証"""
    errors = []
    
    if len(password) < 8:
        errors.append('パスワードは8文字以上である必要があります')
    
    if not re.search(r'[A-Z]', password):
        errors.append('大文字を含む必要があります')
    
    if not re.search(r'[a-z]', password):
        errors.append('小文字を含む必要があります')
    
    if not re.search(r'\d', password):
        errors.append('数字を含む必要があります')
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append('特殊文字を含む必要があります')
    
    # 一般的なパスワードのチェック
    common_passwords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'root', '12345678', '1234567890'
    ]
    
    if password.lower() in common_passwords:
        errors.append('より複雑なパスワードを設定してください')
    
    return errors

# ファイルアップロードセキュリティ
def validate_file_upload(file):
    """ファイルアップロードのセキュリティ検証"""
    errors = []
    
    if not file or not file.filename:
        errors.append('ファイルが選択されていません')
        return errors
    
    # ファイル名の検証
    filename = file.filename
    if '..' in filename or '/' in filename or '\\' in filename:
        errors.append('不正なファイル名です')
    
    # 拡張子の検証
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'}
    file_ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    if file_ext not in allowed_extensions:
        errors.append('許可されていないファイル形式です')
    
    # ファイルサイズの検証
    file.seek(0, 2)  # ファイル末尾に移動
    file_size = file.tell()
    file.seek(0)  # ファイル先頭に戻す
    
    if file_size > 16 * 1024 * 1024:  # 16MB
        errors.append('ファイルサイズが大きすぎます（16MB以下）')
    
    if file_size == 0:
        errors.append('空のファイルです')
    
    return errors

# セキュリティヘッダーの設定
def set_security_headers(response):
    """セキュリティヘッダーの設定"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "img-src 'self' data: blob:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "media-src 'self'"
    )
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response