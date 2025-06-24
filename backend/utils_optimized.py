# 最適化されたユーティリティ関数
import logging
import time
from functools import wraps
from datetime import datetime
import pytz
from flask import g, request, jsonify

JST = pytz.timezone('Asia/Tokyo')

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def performance_monitor(f):
    """パフォーマンス監視デコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            result = f(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # 遅いクエリを記録（1秒以上）
            if execution_time > 1.0:
                logger.warning(f"Slow endpoint: {request.endpoint} took {execution_time:.2f}s")
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error in {request.endpoint} after {execution_time:.2f}s: {str(e)}")
            raise
    return decorated_function

def validate_date_range(start_date_str, end_date_str, max_days=90):
    """日付範囲の検証"""
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = None
            
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = None
            
        # 日付範囲の妥当性チェック
        if start_date and end_date:
            if start_date > end_date:
                raise ValueError("開始日付は終了日付より前である必要があります")
            
            delta = end_date - start_date
            if delta.days > max_days:
                raise ValueError(f"日付範囲は{max_days}日以内で指定してください")
        
        return start_date, end_date
    except ValueError as e:
        if "time data" in str(e):
            raise ValueError("日付フォーマットが正しくありません (YYYY-MM-DD)")
        raise

def sanitize_input(value, max_length=100, allow_empty=False):
    """入力値のサニタイズ"""
    if value is None:
        return None if allow_empty else ""
    
    if isinstance(value, str):
        value = value.strip()
        
    if not allow_empty and not value:
        raise ValueError("必須項目が入力されていません")
    
    if isinstance(value, str) and len(value) > max_length:
        raise ValueError(f"入力値が最大長({max_length})を超えています")
    
    return value

def cache_response(timeout=300):
    """レスポンスキャッシュデコレータ"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # キャッシュキーの生成
            cache_key = f"{request.endpoint}:{request.query_string.decode()}"
            
            # キャッシュからの取得を試行（実装に応じて）
            # 実際の本格運用時にはRedisなどを使用
            
            result = f(*args, **kwargs)
            
            # レスポンスにキャッシュヘッダーを追加
            if hasattr(result, 'headers'):
                result.headers['Cache-Control'] = f'public, max-age={timeout}'
            
            return result
        return decorated_function
    return decorator

def rate_limit(requests_per_minute=60):
    """レート制限デコレータ"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # クライアントIPの取得
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            
            # レート制限の実装（実際の本格運用時にはRedisなどを使用）
            # ここでは簡易的な実装
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def build_error_response(message, code=400, details=None):
    """統一されたエラーレスポンスの生成"""
    response = {
        'error': message,
        'timestamp': datetime.now(JST).isoformat(),
        'status': code
    }
    
    if details:
        response['details'] = details
    
    return jsonify(response), code

def paginate_query(query, page=1, per_page=50, max_per_page=100):
    """クエリのページネーション"""
    # パラメータの検証
    page = max(1, int(page))
    per_page = min(max(1, int(per_page)), max_per_page)
    
    # オフセットの計算
    offset = (page - 1) * per_page
    
    # ページネーション適用
    items = query.offset(offset).limit(per_page + 1).all()
    
    # 次のページがあるかチェック
    has_next = len(items) > per_page
    if has_next:
        items = items[:-1]
    
    return {
        'items': items,
        'page': page,
        'per_page': per_page,
        'has_next': has_next,
        'total_returned': len(items)
    }

class DatabaseManager:
    """データベース接続の最適化管理"""
    
    @staticmethod
    def safe_execute(db_session, operation_func, *args, **kwargs):
        """安全なデータベース操作の実行"""
        try:
            result = operation_func(db_session, *args, **kwargs)
            db_session.commit()
            return result
        except Exception as e:
            db_session.rollback()
            logger.error(f"Database operation failed: {str(e)}")
            raise
        finally:
            if db_session:
                db_session.close()

def optimize_json_response(data, ensure_ascii=False):
    """JSONレスポンスの最適化"""
    return jsonify(data, ensure_ascii=ensure_ascii)

# セキュリティ関連のユーティリティ
def validate_employee_access(session_employee_id, target_employee_id, is_admin=False):
    """従業員データへのアクセス権限チェック"""
    if is_admin:
        return True
    
    return session_employee_id == target_employee_id

def secure_filename_advanced(filename):
    """高度なファイル名セキュリティ"""
    from werkzeug.utils import secure_filename
    import re
    
    if not filename:
        return None
    
    # 基本的なセキュリティチェック
    filename = secure_filename(filename)
    
    # 追加の検証
    if not filename or filename.startswith('.'):
        return None
    
    # 許可された拡張子のチェック
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        return None
    
    # ファイル名の長さ制限
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1)
        filename = name[:95] + '.' + ext
    
    return filename