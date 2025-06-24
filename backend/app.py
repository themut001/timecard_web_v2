from flask import Flask, request, jsonify, send_file, send_from_directory, session, redirect, url_for
from flask_cors import CORS
from datetime import datetime, timedelta, date
import pytz
import os
import csv
import io
import requests
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
from sqlalchemy import and_, func
from models import TimeRecord, Employee, User, DailyReport, WorkStatus, Notification, Tag, TagWorkTime
from database import init_db, get_db_session
from utils import allowed_file, generate_csv
from security import security_manager, secure_endpoint, validate_input_data, ErrorHandler, set_security_headers
from api_routes import api_bp

# Flaskアプリケーションの初期化
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads/photos'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8)  # セッション有効期限
app.config['JSON_AS_ASCII'] = False  # JSON日本語対応
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False  # JSON最適化

# CORSの設定（セキュリティ強化）
CORS(app, 
     supports_credentials=True,
     origins=['http://localhost:3000', 'http://localhost:5000'],  # 許可するオリジン
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'])

# 必要なディレクトリの作成
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('data', exist_ok=True)
os.makedirs('logs', exist_ok=True)

# データベースの初期化
init_db()

# Register API blueprint
app.register_blueprint(api_bp)

# 日本のタイムゾーン
JST = pytz.timezone('Asia/Tokyo')

# ログディレクトリの作成
os.makedirs('logs', exist_ok=True)

# Notion API設定
NOTION_API_KEY = os.environ.get('NOTION_API_KEY')
NOTION_DATABASE_ID = os.environ.get('NOTION_DATABASE_ID')


# ログイン必須デコレータ（セキュリティ強化）
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'ログインが必要です', 'authenticated': False}), 401
        
        # セッションの有効性をチェック
        if session.permanent and session.get('last_activity'):
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.now(JST) - last_activity > app.config['PERMANENT_SESSION_LIFETIME']:
                session.clear()
                return jsonify({'error': 'セッションが期限切れです', 'authenticated': False}), 401
        
        # アクティビティ時刻を更新
        session['last_activity'] = datetime.now(JST).isoformat()
        return f(*args, **kwargs)
    return decorated_function


# 管理者権限必須デコレータ（セキュリティ強化）
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'ログインが必要です', 'authenticated': False}), 401
        
        # セッションの有効性をチェック
        if session.permanent and session.get('last_activity'):
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.now(JST) - last_activity > app.config['PERMANENT_SESSION_LIFETIME']:
                session.clear()
                return jsonify({'error': 'セッションが期限切れです', 'authenticated': False}), 401
        
        if not session.get('is_admin', False):
            return jsonify({'error': '管理者権限が必要です', 'admin_required': True}), 403
        
        # アクティビティ時刻を更新
        session['last_activity'] = datetime.now(JST).isoformat()
        return f(*args, **kwargs)
    return decorated_function


def fetch_notion_tags():
    """Notionから物件名をタグとして取得（空のレコードをスキップ）"""
    if not NOTION_API_KEY:
        print("ERROR: NOTION_API_KEY is not set")
        return []
    if not NOTION_DATABASE_ID:
        print("ERROR: NOTION_DATABASE_ID is not set")
        return []

    print(f"DEBUG: Using Notion API Key: {NOTION_API_KEY[:10]}...")
    print(f"DEBUG: Using Database ID: {NOTION_DATABASE_ID}")

    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }

    all_tags = []
    seen_names = set()
    has_more = True
    start_cursor = None
    total_records = 0
    empty_records = 0
    
    try:
        while has_more:
            # ページネーションを使用してすべてのレコードを取得
            body = {"page_size": 100}  # 一度に100件取得
            if start_cursor:
                body["start_cursor"] = start_cursor
            
            print(f"DEBUG: Fetching page... (cursor: {start_cursor})")
            resp = requests.post(url, headers=headers, json=body)
            
            if resp.status_code != 200:
                print(f"ERROR: Notion API error: {resp.text}")
                break
                
            data = resp.json()
            results = data.get('results', [])
            total_records += len(results)
            
            print(f"DEBUG: Got {len(results)} records in this page")
            
            # 各レコードを処理
            for r in results:
                notion_id = r.get('id')
                properties = r.get('properties', {})
                
                if '物件名' in properties:
                    prop = properties['物件名']
                    name = None
                    
                    # タイトルフィールドから値を取得
                    if prop.get('type') == 'title' and prop.get('title'):
                        title_array = prop.get('title', [])
                        if title_array and len(title_array) > 0:
                            content = title_array[0].get('text', {}).get('content', '')
                            if content and content.strip():
                                name = content.strip()
                    
                    # タイトルが空の場合はスキップ
                    if not name:
                        empty_records += 1
                        continue
                    
                    # 重複チェック
                    if name not in seen_names:
                        seen_names.add(name)
                        all_tags.append({'name': name, 'notion_id': notion_id})
                        # 最初の10個のタグのみログ出力
                        if len(all_tags) <= 10:
                            print(f"DEBUG: Added tag #{len(all_tags)}: '{name}'")
            
            # 次のページがあるかチェック
            has_more = data.get('has_more', False)
            start_cursor = data.get('next_cursor')
            
            # 安全のため、最大1000件まで
            if total_records >= 1000:
                print("WARNING: Reached 1000 records limit")
                break
        
        print(f"\n=== SUMMARY ===")
        print(f"Total records scanned: {total_records}")
        print(f"Empty records skipped: {empty_records}")
        print(f"Unique tags found: {len(all_tags)}")
        
        if all_tags:
            # タグをアルファベット順にソート
            all_tags.sort(key=lambda x: x['name'])
            
            # 最初と最後のタグを表示
            print(f"\nFirst 5 tags: {[tag['name'] for tag in all_tags[:5]]}")
            if len(all_tags) > 5:
                print(f"Last 5 tags: {[tag['name'] for tag in all_tags[-5:]]}")
        else:
            print("\nWARNING: No tags found! Possible causes:")
            print("1. All records have empty '物件名' field")
            print("2. Database has no records")
            print("3. Permission issues")
            
            # デバッグ用：最初の数レコードの物件名フィールドを詳しく表示
            print("\nDEBUG: Checking first 5 records in detail...")
            body = {"page_size": 5}
            resp = requests.post(url, headers=headers, json=body)
            if resp.status_code == 200:
                data = resp.json()
                for i, r in enumerate(data.get('results', [])):
                    properties = r.get('properties', {})
                    if '物件名' in properties:
                        prop = properties['物件名']
                        print(f"\nRecord {i+1}:")
                        print(f"  Type: {prop.get('type')}")
                        print(f"  Title array: {prop.get('title')}")
                        if prop.get('title'):
                            for j, title_item in enumerate(prop.get('title', [])):
                                print(f"    Item {j+1}: {title_item}")
        
        return all_tags
        
    except Exception as e:
        print(f"ERROR: Notion fetch error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return []

def sync_tags():
    """Notionからタグを同期（詳細なレスポンス付き）"""
    print("INFO: Starting tag sync...")
    tags = fetch_notion_tags()
    
    if not tags:
        return jsonify({
            'error': 'Notionからタグを取得できませんでした。環境変数とデータベース権限を確認してください。',
            'debug': {
                'api_key_set': bool(NOTION_API_KEY),
                'database_id_set': bool(NOTION_DATABASE_ID)
            }
        }), 400
    
    db_session = get_db_session()
    try:
        synced_count = 0
        updated_count = 0
        
        for tag in tags:
            existing = db_session.query(Tag).filter_by(notion_id=tag['notion_id']).first()
            if existing:
                existing.name = tag['name']
                updated_count += 1
            else:
                db_session.add(Tag(name=tag['name'], notion_id=tag['notion_id']))
                synced_count += 1
                
        db_session.commit()
        
        return jsonify({
            'message': f'タグを同期しました（新規: {synced_count}件、更新: {updated_count}件）',
            'synced': synced_count,
            'updated': updated_count,
            'total': len(tags)
        }), 200
        
    except Exception as e:
        db_session.rollback()
        print(f"ERROR: Database error during sync: {e}")
        return jsonify({'error': f'データベースエラー: {str(e)}'}), 500
    finally:
        db_session.close()


@app.route('/')
def index():
    """メインページを表示"""
    if 'user_id' not in session:
        return redirect('/login')
    return send_from_directory('../frontend', 'index.html')


@app.route('/login')
def login_page():
    """ログインページを表示"""
    return send_from_directory('../frontend', 'login.html')


@app.route('/admin')
@admin_required
def admin():
    """管理者ページを表示"""
    return send_from_directory('../frontend', 'admin.html')


@app.route('/mypage')
@login_required
def mypage():
    """マイページを表示"""
    return send_from_directory('../frontend', 'mypage.html')


@app.route('/css/<path:path>')
def send_css(path):
    """CSSファイルを配信"""
    return send_from_directory('../frontend/css', path)


@app.route('/js/<path:path>')
def send_js(path):
    """JSファイルを配信"""
    return send_from_directory('../frontend/js', path)


@app.route('/api/login', methods=['POST'])
@secure_endpoint(max_requests=10, window_minutes=5)
@validate_input_data({
    'username': {'required': True, 'type': str, 'max_length': 50},
    'password': {'required': True, 'type': str, 'max_length': 100}
})
def login():
    """ログイン処理"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'ユーザー名とパスワードを入力してください'}), 400
    
    db_session = get_db_session()
    try:
        # ログイン試行回数チェック
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        if not security_manager.check_failed_login_attempts(f"{username}:{client_ip}"):
            security_manager.log_security_event(
                'LOGIN_LOCKED',
                f'Account locked for username: {username}',
                'WARNING'
            )
            return jsonify({'error': '一時的にアカウントがロックされています'}), 429
        
        user = db_session.query(User).filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            # ログイン時刻を更新
            user.last_login = datetime.now(JST)
            db_session.commit()
            
            # セッション設定強化
            session.permanent = True
            session['user_id'] = user.id
            session['username'] = user.username
            session['is_admin'] = user.is_admin
            session['employee_id'] = user.employee_id
            session['login_time'] = datetime.now(JST).isoformat()
            session['last_activity'] = datetime.now(JST).isoformat()
            
            return jsonify({
                'message': 'ログインしました',
                'user': {
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'employee_id': user.employee_id
                }
            }), 200
        else:
            # ログイン失敗を記録
            security_manager.record_failed_login(f"{username}:{client_ip}")
            return jsonify({'error': 'ユーザー名またはパスワードが正しくありません'}), 401
    except Exception as e:
        return ErrorHandler.handle_server_error(e)
    finally:
        if 'db_session' in locals():
            db_session.close()


@app.route('/api/users/<username>', methods=['DELETE'])
@admin_required
def delete_user(username):
    """ユーザーアカウントを削除"""
    db_session = get_db_session()
    try:
        user = db_session.query(User).filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404

        db_session.delete(user)
        db_session.commit()
        return jsonify({'message': 'ユーザーを削除しました'}), 200
    finally:
        db_session.close()


@app.route('/api/users/me', methods=['PUT'])
@login_required
def update_my_account():
    """自分のアカウント情報を更新"""
    data = request.json or {}
    db_session = get_db_session()
    try:
        user = db_session.query(User).filter_by(id=session['user_id']).first()
        if not user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404

        username = data.get('username')
        password = data.get('password')

        if username:
            if username != user.username and db_session.query(User).filter_by(username=username).first():
                return jsonify({'error': 'このユーザー名は既に使用されています'}), 400
            user.username = username

        if password:
            if len(password) < 8:
                return jsonify({'error': 'パスワードは8文字以上で入力してください'}), 400
            user.password_hash = generate_password_hash(password)

        db_session.commit()
        session['username'] = user.username
        return jsonify({'message': 'アカウント情報を更新しました'}), 200
    finally:
        db_session.close()


@app.route('/api/employees/me', methods=['PUT'])
@login_required
def update_my_employee():
    """自分の従業員情報を更新"""
    data = request.json or {}
    db_session = get_db_session()
    try:
        employee = db_session.query(Employee).filter_by(employee_id=session['employee_id']).first()
        if not employee:
            return jsonify({'error': '従業員が見つかりません'}), 404

        if 'email' in data:
            employee.email = data['email']

        db_session.commit()
        return jsonify({'message': 'プロフィールを更新しました'}), 200
    finally:
        db_session.close()


@app.route('/api/logout', methods=['POST'])
def logout():
    """ログアウト処理"""
    session.clear()
    return jsonify({'message': 'ログアウトしました'}), 200


@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """認証状態の確認"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'username': session.get('username'),
                'is_admin': session.get('is_admin', False),
                'employee_id': session.get('employee_id')
            }
        }), 200
    else:
        return jsonify({'authenticated': False}), 401


@app.route('/api/work-status/<employee_id>', methods=['GET'])
@login_required
def get_work_status(employee_id):
    """勤務状態を取得"""
    db_session = get_db_session()
    try:
        status = db_session.query(WorkStatus).filter_by(employee_id=employee_id).first()
        if not status:
            # 初回は作成
            status = WorkStatus(employee_id=employee_id, is_working=False)
            db_session.add(status)
            db_session.commit()
        
        return jsonify({
            'is_working': status.is_working,
            'last_check_in': status.last_check_in.strftime('%Y-%m-%d %H:%M:%S') if status.last_check_in else None,
            'last_check_out': status.last_check_out.strftime('%Y-%m-%d %H:%M:%S') if status.last_check_out else None
        })
    finally:
        db_session.close()


@app.route('/api/employees', methods=['GET'])
@login_required
def get_employees():
    """従業員リストを取得（ユーザー情報を含む）"""
    db_session = get_db_session()
    try:
        employees = db_session.query(Employee).all()
        return jsonify([
            {
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': emp.name,
                'email': emp.email,
                'department': emp.department,
                'position': emp.position,
                'created_at': emp.created_at.isoformat() if emp.created_at else None,
                'username': emp.user.username if emp.user else None,
                'is_admin': emp.user.is_admin if emp.user else False,
                'last_login': emp.user.last_login.isoformat() if emp.user and emp.user.last_login else None,
            }
            for emp in employees
        ])
    finally:
        db_session.close()


@app.route('/api/employees', methods=['POST'])
@admin_required
def create_employee():
    """従業員を登録"""
    data = request.json
    db_session = get_db_session()
    try:
        employee = Employee(
            employee_id=data['employee_id'],
            name=data['name'],
            email=data.get('email'),
            department=data.get('department'),
            position=data.get('position')
        )
        db_session.add(employee)

        # ユーザーアカウント情報があれば作成
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        if username or password:
            if not username or not password:
                db_session.rollback()
                return jsonify({'error': 'ユーザー名とパスワードを入力してください'}), 400
            if len(password) < 8:
                db_session.rollback()
                return jsonify({'error': 'パスワードは8文字以上で入力してください'}), 400
            if db_session.query(User).filter_by(username=username).first():
                db_session.rollback()
                return jsonify({'error': 'このユーザー名は既に使用されています'}), 400
            if db_session.query(User).filter_by(employee_id=data['employee_id']).first():
                db_session.rollback()
                return jsonify({'error': 'この従業員IDには既にユーザーが登録されています'}), 400

            user = User(
                username=username,
                password_hash=generate_password_hash(password),
                employee_id=data['employee_id'],
                is_admin=is_admin
            )
            db_session.add(user)

        db_session.commit()
        return jsonify({'message': '従業員を登録しました'}), 201
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db_session.close()


@app.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    """ユーザーアカウントを作成"""
    data = request.json

    # 必須項目チェック
    required = ['username', 'password', 'employee_id']
    if not all(data.get(k) for k in required):
        return jsonify({'error': 'ユーザー名、パスワード、従業員IDは必須です'}), 400

    if len(data['password']) < 8:
        return jsonify({'error': 'パスワードは8文字以上で入力してください'}), 400

    db_session = get_db_session()
    try:
        # 従業員の存在確認
        employee = db_session.query(Employee).filter_by(employee_id=data['employee_id']).first()
        if not employee:
            return jsonify({'error': '指定された従業員が存在しません'}), 404

        # 既存ユーザーチェック（ユーザー名）
        if db_session.query(User).filter_by(username=data['username']).first():
            return jsonify({'error': 'このユーザー名は既に使用されています'}), 400

        # 既存ユーザーチェック（従業員ID）
        if db_session.query(User).filter_by(employee_id=data['employee_id']).first():
            return jsonify({'error': 'この従業員IDには既にユーザーが登録されています'}), 400

        user = User(
            username=data['username'],
            password_hash=generate_password_hash(data['password']),
            employee_id=data['employee_id'],
            is_admin=data.get('is_admin', False)
        )
        db_session.add(user)
        db_session.commit()

        return jsonify({'message': 'ユーザーアカウントを作成しました'}), 201
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db_session.close()


@app.route('/api/users', methods=['GET'])
@admin_required
def list_users():
    """ユーザーアカウント一覧を取得"""
    db_session = get_db_session()
    try:
        users = (
            db_session.query(User, Employee)
            .join(Employee, User.employee_id == Employee.employee_id)
            .all()
        )

        result = []
        for user, employee in users:
            result.append({
                'username': user.username,
                'employee_id': user.employee_id,
                'employee_name': employee.name,
                'is_admin': user.is_admin,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            })
        return jsonify(result)
    finally:
        db_session.close()


@app.route('/api/time-record', methods=['POST'])
@login_required
def record_time():
    """打刻を記録（二重打刻防止・パフォーマンス強化）"""
    session_db = get_db_session()
    try:
        # フォームデータとファイルを取得・検証
        employee_id = request.form.get('employee_id', '').strip()
        record_type = request.form.get('type', '').strip()
        photo = request.files.get('photo')
        
        # 入力検証強化
        if not employee_id or not record_type:
            return jsonify({'error': '必須パラメータが不足です'}), 400
        
        if record_type not in ['check_in', 'check_out']:
            return jsonify({'error': '無効な打刻タイプです'}), 400
        
        # 従業員の存在確認
        employee = session_db.query(Employee).filter_by(employee_id=employee_id).first()
        if not employee:
            return jsonify({'error': '従業員が見つかりません'}), 404
        
        # 勤務状態の確認
        work_status = session_db.query(WorkStatus).filter_by(employee_id=employee_id).first()
        if not work_status:
            work_status = WorkStatus(employee_id=employee_id, is_working=False)
            session_db.add(work_status)
        
        # 二重打刻チェック
        if record_type == 'check_in' and work_status.is_working:
            return jsonify({'error': '既に出勤しています。退勤してから出勤してください。'}), 400
        elif record_type == 'check_out' and not work_status.is_working:
            return jsonify({'error': 'まだ出勤していません。先に出勤してください。'}), 400
        
        # 写真の保存（オプション）
        photo_path = None
        photo_warning = None
        
        if photo and photo.filename and allowed_file(photo.filename):
            try:
                timestamp = datetime.now(JST).strftime('%Y%m%d_%H%M%S')
                filename = f"{employee_id}_{timestamp}_{secure_filename(photo.filename)}"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                photo.save(photo_path)
            except Exception as e:
                photo_warning = '写真の保存に失敗しましたが、打刻は記録されます'
                print(f"写真保存エラー: {e}")
        elif not photo or not photo.filename:
            photo_warning = '写真が撮影されていませんが、打刻は記録されます'
        
        # 打刻記録の作成（トランザクション最適化）
        now = datetime.now(JST)
        
        # バッチ処理でパフォーマンス向上
        record = TimeRecord(
            employee_id=employee_id,
            timestamp=now,
            record_type=record_type,
            photo_path=photo_path
        )
        session_db.add(record)
        
        # 勤務状態の更新
        if record_type == 'check_in':
            work_status.is_working = True
            work_status.last_check_in = now
        else:
            work_status.is_working = False
            work_status.last_check_out = now
        
        # 一度にコミットしてパフォーマンス向上
        session_db.commit()
        
        response_data = {
            'message': f'{record_type}を記録しました',
            'timestamp': record.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        if photo_warning:
            response_data['warning'] = photo_warning
        
        return jsonify(response_data), 201
        
    except Exception as e:
        session_db.rollback()
        app.logger.error(f"Time record error: {str(e)}")
        return jsonify({'error': '打刻処理中にエラーが発生しました'}), 500
    finally:
        session_db.close()


@app.route('/api/daily-report', methods=['POST'])
@login_required
def create_daily_report():
    """日報を作成・更新"""
    data = request.json
    user_id = session['user_id']
    employee_id = session['employee_id']
    
    db_session = get_db_session()
    try:
        report_date = datetime.strptime(data['report_date'], '%Y-%m-%d').date()
        
        # 既存の日報をチェック
        existing_report = db_session.query(DailyReport).filter(
            and_(
                DailyReport.user_id == user_id,
                DailyReport.report_date == report_date
            )
        ).first()
        
        if existing_report:
            # 更新
            existing_report.work_content = data['work_content']
            existing_report.achievements = data.get('achievements')
            existing_report.issues = data.get('issues')
            existing_report.tomorrow_plan = data.get('tomorrow_plan')
            existing_report.remarks = data.get('remarks')
            existing_report.updated_at = datetime.now(JST)
            message = '日報を更新しました'
        else:
            # 新規作成
            report = DailyReport(
                user_id=user_id,
                employee_id=employee_id,
                report_date=report_date,
                work_content=data['work_content'],
                achievements=data.get('achievements'),
                issues=data.get('issues'),
                tomorrow_plan=data.get('tomorrow_plan'),
                remarks=data.get('remarks')
            )
            db_session.add(report)
            message = '日報を作成しました'
        
        db_session.commit()
        return jsonify({'message': message}), 201
        
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db_session.close()


@app.route('/api/daily-reports', methods=['GET'])
@login_required
def get_daily_reports():
    """日報一覧を取得"""
    user_id = session['user_id']
    is_admin = session.get('is_admin', False)
    
    db_session = get_db_session()
    try:
        query = db_session.query(DailyReport).join(Employee).join(User)
        
        # 管理者でない場合は自分の日報のみ
        if not is_admin:
            query = query.filter(DailyReport.user_id == user_id)
        
        # 日付でフィルタ
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        if start_date:
            query = query.filter(DailyReport.report_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(DailyReport.report_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        
        reports = query.order_by(DailyReport.report_date.desc()).all()
        
        return jsonify([{
            'id': report.id,
            'report_date': report.report_date.strftime('%Y-%m-%d'),
            'employee_name': report.employee.name,
            'work_content': report.work_content,
            'achievements': report.achievements,
            'issues': report.issues,
            'tomorrow_plan': report.tomorrow_plan,
            'remarks': report.remarks,
            'created_at': report.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': report.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } for report in reports])
        
    finally:
        db_session.close()


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    """通知を取得"""
    user_id = session['user_id']
    
    db_session = get_db_session()
    try:
        notifications = db_session.query(Notification).filter_by(
            user_id=user_id
        ).order_by(Notification.created_at.desc()).limit(10).all()
        
        return jsonify([{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for n in notifications])
        
    finally:
        db_session.close()


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    """通知を既読にする"""
    user_id = session['user_id']
    
    db_session = get_db_session()
    try:
        notification = db_session.query(Notification).filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db_session.commit()
            return jsonify({'message': '既読にしました'}), 200
        else:
            return jsonify({'error': '通知が見つかりません'}), 404
            
    finally:
        db_session.close()


@app.route('/api/my-stats', methods=['GET'])
@login_required
def get_my_stats():
    """自分の統計情報を取得"""
    employee_id = session.get('employee_id')
    if not employee_id:
        return jsonify({'error': '従業員情報が見つかりません'}), 404
    
    db_session = get_db_session()
    try:
        # 今月の勤務日数
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        
        work_days = db_session.query(func.count(func.distinct(func.date(TimeRecord.timestamp)))).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                TimeRecord.record_type == 'check_in',
                func.date(TimeRecord.timestamp) >= start_of_month
            )
        ).scalar()
        
        # 今日の勤務時間
        today_records = db_session.query(TimeRecord).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                func.date(TimeRecord.timestamp) == today
            )
        ).order_by(TimeRecord.timestamp).all()
        
        work_time = None
        if len(today_records) >= 2:
            check_in = next((r for r in today_records if r.record_type == 'check_in'), None)
            check_out = next((r for r in today_records if r.record_type == 'check_out'), None)
            if check_in and check_out:
                delta = check_out.timestamp - check_in.timestamp
                work_time = str(delta).split('.')[0]  # 秒以下を削除
        
        # 未読通知数
        unread_notifications = db_session.query(func.count(Notification.id)).filter(
            and_(
                Notification.user_id == session['user_id'],
                Notification.is_read == False
            )
        ).scalar()
        
        return jsonify({
            'work_days_this_month': work_days or 0,
            'work_time_today': work_time,
            'unread_notifications': unread_notifications or 0
        })
        
    finally:
        db_session.close()


@app.route('/api/time-records', methods=['GET'])
@login_required
def get_time_records():
    """打刻記録を取得"""
    db_session = get_db_session()
    try:
        # クエリパラメータの取得
        employee_id = request.args.get('employee_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 基本クエリ
        query = db_session.query(TimeRecord).join(Employee)
        
        # フィルタリング
        if employee_id:
            query = query.filter(TimeRecord.employee_id == employee_id)
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').replace(tzinfo=JST)
            query = query.filter(TimeRecord.timestamp >= start)
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=JST)
            query = query.filter(TimeRecord.timestamp <= end)
        
        # 結果の取得（ページネーション対応）
        records = query.order_by(TimeRecord.timestamp.desc()).limit(limit).all()
        
        # レスポンスの最適化
        result = []
        for record in records:
            result.append({
                'id': record.id,
                'employee_id': record.employee_id,
                'employee_name': record.employee.name,
                'timestamp': record.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'type': record.record_type,
                'has_photo': bool(record.photo_path)
            })
        
        return jsonify({
            'records': result,
            'count': len(result),
            'has_more': len(result) == limit
        })
        
    except Exception as e:
        app.logger.error(f"Get time records error: {str(e)}")
        return jsonify({'error': '記録の取得中にエラーが発生しました'}), 500
    finally:
        db_session.close()


@app.route('/api/tags/sync', methods=['POST'])
@admin_required
def sync_tags():
    """Notionからタグを同期"""
    tags = fetch_notion_tags()
    db_session = get_db_session()
    try:
        for tag in tags:
            existing = db_session.query(Tag).filter_by(notion_id=tag['notion_id']).first()
            if existing:
                existing.name = tag['name']
            else:
                db_session.add(Tag(name=tag['name'], notion_id=tag['notion_id']))
        db_session.commit()
        return jsonify({'message': 'タグを同期しました'}), 200
    finally:
        db_session.close()


@app.route('/api/tags', methods=['GET'])
@login_required
def list_tags():
    """タグ一覧取得（検索対応）"""
    query = request.args.get('query', '')
    db_session = get_db_session()
    try:
        q = db_session.query(Tag)
        if query:
            q = q.filter(Tag.name.ilike(f'%{query}%'))
        tags = q.all()
        return jsonify([{'id': t.id, 'name': t.name} for t in tags])
    finally:
        db_session.close()


@app.route('/api/tag-work', methods=['POST'])
@login_required
def add_tag_work():
    """タグ別工数を登録"""
    data = request.json or {}
    tag_id = data.get('tag_id')
    hours = data.get('hours')
    date_str = data.get('date')
    if not all([tag_id, hours is not None, date_str]):
        return jsonify({'error': 'tag_id, date, hours が必要です'}), 400

    try:
        work_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': '日付形式が正しくありません'}), 400

    db_session = get_db_session()
    try:
        entry = db_session.query(TagWorkTime).filter_by(
            user_id=session['user_id'], tag_id=tag_id, date=work_date
        ).first()
        if entry:
            entry.hours = hours
        else:
            entry = TagWorkTime(user_id=session['user_id'], tag_id=tag_id, date=work_date, hours=hours)
            db_session.add(entry)
        db_session.commit()
        return jsonify({'message': '工数を登録しました'}), 201
    finally:
        db_session.close()


@app.route('/api/tag-work-summary', methods=['GET'])
@admin_required
def tag_work_summary():
    """タグ別工数集計"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    db_session = get_db_session()
    try:
        query = db_session.query(
            Tag.name,
            func.sum(TagWorkTime.hours).label('total_hours')
        ).join(Tag).group_by(Tag.id)

        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(TagWorkTime.date >= start)
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(TagWorkTime.date <= end)

        results = query.all()
        return jsonify([
            {'tag': r.name, 'total_hours': float(r.total_hours or 0)} for r in results
        ])
    finally:
        db_session.close()


@app.route('/api/export-csv', methods=['GET'])
@admin_required
def export_csv():
    """勤務記録をCSV出力"""
    db_session = get_db_session()
    try:
        # パラメータの取得
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 記録の取得
        query = db_session.query(TimeRecord).join(Employee)
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').replace(tzinfo=JST)
            query = query.filter(TimeRecord.timestamp >= start)
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=JST)
            query = query.filter(TimeRecord.timestamp <= end)
        
        records = query.order_by(TimeRecord.timestamp).all()
        
        # CSV生成
        output = io.StringIO()
        writer = csv.writer(output)
        
        # ヘッダー
        writer.writerow(['従業員ID', '従業員名', '日付', '時刻', '種別', '写真'])
        
        # データ行
        for record in records:
            writer.writerow([
                record.employee_id,
                record.employee.name,
                record.timestamp.strftime('%Y-%m-%d'),
                record.timestamp.strftime('%H:%M:%S'),
                '出勤' if record.record_type == 'check_in' else '退勤',
                '有' if record.photo_path else '無'
            ])
        
        # ファイルとして返す
        output.seek(0)
        output_bytes = io.BytesIO(output.getvalue().encode('utf-8-sig'))  # BOM付きUTF-8
        
        filename = f"timecard_{datetime.now(JST).strftime('%Y%m%d_%H%M%S')}.csv"
        
        return send_file(
            output_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    finally:
        db_session.close()


@app.route('/api/photo/<int:record_id>')
@login_required
def get_photo(record_id):
    """打刻時の写真を取得"""
    db_session = get_db_session()
    try:
        record = db_session.query(TimeRecord).filter_by(id=record_id).first()
        if record and record.photo_path and os.path.exists(record.photo_path):
            return send_file(record.photo_path)
        return jsonify({'error': '写真が見つかりません'}), 404
    finally:
        db_session.close()


# レスポンスヘッダーの設定
@app.after_request
def after_request(response):
    return set_security_headers(response)

# エラーハンドラーの登録
@app.errorhandler(400)
def handle_bad_request(e):
    return ErrorHandler.handle_validation_error(e)

@app.errorhandler(401)
def handle_unauthorized(e):
    return ErrorHandler.handle_authentication_error()

@app.errorhandler(403)
def handle_forbidden(e):
    return ErrorHandler.handle_authorization_error()

@app.errorhandler(404)
def handle_not_found(e):
    return ErrorHandler.handle_not_found_error()

@app.errorhandler(500)
def handle_internal_error(e):
    return ErrorHandler.handle_server_error(e)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
