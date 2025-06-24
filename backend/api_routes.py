"""
RESTful API Routes for Timecard Management System
Optimized for React frontend integration
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import pytz
from functools import wraps
from sqlalchemy import and_, func, desc
from sqlalchemy.exc import SQLAlchemyError

from models import TimeRecord, Employee, User, DailyReport, WorkStatus, Notification, Tag, TagWorkTime
from database import get_db_session
from security import validate_input_data, ErrorHandler

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Timezone setup
JST = pytz.timezone('Asia/Tokyo')

# Common response helper functions
def success_response(data=None, message=None):
    """Standardized success response"""
    response = {'success': True}
    if data is not None:
        response.update(data)
    if message:
        response['message'] = message
    return jsonify(response)

def error_response(error_msg, error_type='general_error', status_code=400):
    """Standardized error response"""
    return jsonify({
        'success': False,
        'error': error_msg,
        'type': error_type
    }), status_code

# Error handler decorator
def handle_api_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return error_response(str(e), 'validation_error', 400)
        except SQLAlchemyError as e:
            return error_response('Database error occurred', 'database_error', 500)
        except Exception as e:
            return error_response('Internal server error', 'internal_error', 500)
    return decorated_function

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required', 'authenticated': False}), 401
        
        # Check session validity
        if session.permanent and session.get('last_activity'):
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.now(JST) - last_activity > timedelta(hours=8):
                session.clear()
                return jsonify({'error': 'Session expired', 'authenticated': False}), 401
        
        # Update activity timestamp
        session['last_activity'] = datetime.now(JST).isoformat()
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin', False):
            return jsonify({'error': 'Admin access required', 'admin_required': True}), 403
        return f(*args, **kwargs)
    return decorated_function

# ==========================================
# Authentication Endpoints
# ==========================================

@api_bp.route('/auth/login', methods=['POST'])
@handle_api_errors
def login():
    """User login endpoint"""
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    username = validate_input_data(data.get('username'), 'username')
    password = data.get('password')
    
    with get_db_session() as db:
        user = db.query(User).filter(User.username == username).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        user.last_login = datetime.now(JST)
        db.commit()
        
        # Set session
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        session['is_admin'] = user.is_admin
        session['employee_id'] = user.employee_id
        session['last_activity'] = datetime.now(JST).isoformat()
        
        # Get employee info
        employee = db.query(Employee).filter(Employee.employee_id == user.employee_id).first()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'isAdmin': user.is_admin,
                'employeeId': user.employee_id,
                'employee': {
                    'name': employee.name if employee else '',
                    'department': employee.department if employee else '',
                    'position': employee.position if employee else ''
                } if employee else None
            }
        })

@api_bp.route('/auth/logout', methods=['POST'])
@login_required
@handle_api_errors
def logout():
    """User logout endpoint"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@api_bp.route('/auth/me', methods=['GET'])
@login_required
@handle_api_errors
def get_current_user():
    """Get current user information"""
    with get_db_session() as db:
        user = db.query(User).filter(User.id == session['user_id']).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        employee = db.query(Employee).filter(Employee.employee_id == user.employee_id).first()
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'isAdmin': user.is_admin,
                'employeeId': user.employee_id,
                'employee': {
                    'name': employee.name if employee else '',
                    'department': employee.department if employee else '',
                    'position': employee.position if employee else ''
                } if employee else None
            }
        })

# ==========================================
# Attendance Endpoints
# ==========================================

@api_bp.route('/attendance/today', methods=['GET'])
@login_required
@handle_api_errors
def get_today_attendance():
    """Get today's attendance record"""
    today = datetime.now(JST).date()
    employee_id = session['employee_id']
    
    with get_db_session() as db:
        record = db.query(TimeRecord).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                TimeRecord.date == today
            )
        ).first()
        
        # Get current work status
        work_status = db.query(WorkStatus).filter(
            WorkStatus.employee_id == employee_id
        ).first()
        
        current_status = 'off'
        if work_status:
            current_status = work_status.status
        
        if record:
            return jsonify({
                'record': {
                    'id': record.id,
                    'date': record.date.isoformat(),
                    'clockIn': record.clock_in.isoformat() if record.clock_in else None,
                    'clockOut': record.clock_out.isoformat() if record.clock_out else None,
                    'breakTime': record.break_time or 0,
                    'totalHours': float(record.total_hours or 0),
                    'status': current_status
                },
                'status': current_status
            })
        
        return jsonify({
            'record': None,
            'status': current_status
        })

@api_bp.route('/attendance/clock-in', methods=['POST'])
@login_required
@handle_api_errors
def clock_in():
    """Clock in endpoint"""
    data = request.get_json() or {}
    photo = data.get('photo')
    
    now = datetime.now(JST)
    today = now.date()
    employee_id = session['employee_id']
    
    with get_db_session() as db:
        # Check if already clocked in today
        existing = db.query(TimeRecord).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                TimeRecord.date == today
            )
        ).first()
        
        if existing and existing.clock_in:
            return jsonify({'error': 'Already clocked in today'}), 400
        
        if existing:
            # Update existing record
            existing.clock_in = now
            existing.photo_filename = photo if photo else None
            record = existing
        else:
            # Create new record
            record = TimeRecord(
                employee_id=employee_id,
                date=today,
                clock_in=now,
                photo_filename=photo if photo else None
            )
            db.add(record)
        
        # Update work status
        work_status = db.query(WorkStatus).filter(
            WorkStatus.employee_id == employee_id
        ).first()
        
        if work_status:
            work_status.status = 'working'
            work_status.last_update = now
        else:
            work_status = WorkStatus(
                employee_id=employee_id,
                status='working',
                last_update=now
            )
            db.add(work_status)
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Clocked in successfully',
            'record': {
                'id': record.id,
                'date': record.date.isoformat(),
                'clockIn': record.clock_in.isoformat(),
                'clockOut': record.clock_out.isoformat() if record.clock_out else None,
                'breakTime': record.break_time or 0,
                'totalHours': float(record.total_hours or 0)
            }
        })

@api_bp.route('/attendance/clock-out', methods=['POST'])
@login_required
@handle_api_errors
def clock_out():
    """Clock out endpoint"""
    data = request.get_json() or {}
    photo = data.get('photo')
    
    now = datetime.now(JST)
    today = now.date()
    employee_id = session['employee_id']
    
    with get_db_session() as db:
        record = db.query(TimeRecord).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                TimeRecord.date == today
            )
        ).first()
        
        if not record or not record.clock_in:
            return jsonify({'error': 'Must clock in first'}), 400
        
        if record.clock_out:
            return jsonify({'error': 'Already clocked out today'}), 400
        
        # Update record
        record.clock_out = now
        if photo:
            record.photo_filename = photo
        
        # Calculate total hours
        work_duration = record.clock_out - record.clock_in
        total_seconds = work_duration.total_seconds()
        total_hours = total_seconds / 3600
        
        # Subtract break time
        break_minutes = record.break_time or 0
        total_hours -= break_minutes / 60
        
        record.total_hours = max(0, total_hours)
        
        # Update work status
        work_status = db.query(WorkStatus).filter(
            WorkStatus.employee_id == employee_id
        ).first()
        
        if work_status:
            work_status.status = 'off'
            work_status.last_update = now
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Clocked out successfully',
            'record': {
                'id': record.id,
                'date': record.date.isoformat(),
                'clockIn': record.clock_in.isoformat(),
                'clockOut': record.clock_out.isoformat(),
                'breakTime': record.break_time or 0,
                'totalHours': float(record.total_hours)
            }
        })

@api_bp.route('/attendance/break/start', methods=['POST'])
@login_required
@handle_api_errors
def start_break():
    """Start break endpoint"""
    now = datetime.now(JST)
    employee_id = session['employee_id']
    
    with get_db_session() as db:
        work_status = db.query(WorkStatus).filter(
            WorkStatus.employee_id == employee_id
        ).first()
        
        if not work_status or work_status.status != 'working':
            return jsonify({'error': 'Must be working to start break'}), 400
        
        work_status.status = 'break'
        work_status.break_start = now
        work_status.last_update = now
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Break started',
            'status': 'break'
        })

@api_bp.route('/attendance/break/end', methods=['POST'])
@login_required
@handle_api_errors
def end_break():
    """End break endpoint"""
    now = datetime.now(JST)
    today = now.date()
    employee_id = session['employee_id']
    
    with get_db_session() as db:
        work_status = db.query(WorkStatus).filter(
            WorkStatus.employee_id == employee_id
        ).first()
        
        if not work_status or work_status.status != 'break':
            return jsonify({'error': 'Not currently on break'}), 400
        
        # Calculate break duration
        if work_status.break_start:
            break_duration = now - work_status.break_start
            break_minutes = break_duration.total_seconds() / 60
            
            # Update today's record
            record = db.query(TimeRecord).filter(
                and_(
                    TimeRecord.employee_id == employee_id,
                    TimeRecord.date == today
                )
            ).first()
            
            if record:
                record.break_time = (record.break_time or 0) + break_minutes
        
        work_status.status = 'working'
        work_status.break_start = None
        work_status.last_update = now
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Break ended',
            'status': 'working'
        })

@api_bp.route('/attendance/recent', methods=['GET'])
@login_required
@handle_api_errors
def get_recent_records():
    """Get recent attendance records"""
    employee_id = session['employee_id']
    limit = request.args.get('limit', 10, type=int)
    
    with get_db_session() as db:
        records = db.query(TimeRecord).filter(
            TimeRecord.employee_id == employee_id
        ).order_by(desc(TimeRecord.date)).limit(limit).all()
        
        return jsonify({
            'records': [{
                'id': record.id,
                'date': record.date.isoformat(),
                'clockIn': record.clock_in.isoformat() if record.clock_in else None,
                'clockOut': record.clock_out.isoformat() if record.clock_out else None,
                'breakTime': record.break_time or 0,
                'totalHours': float(record.total_hours or 0),
                'status': 'complete' if record.clock_out else 'incomplete'
            } for record in records]
        })

@api_bp.route('/attendance/monthly', methods=['GET'])
@login_required
@handle_api_errors
def get_monthly_records():
    """Get monthly attendance records"""
    month = request.args.get('month')  # Format: YYYY-MM
    employee_id = session['employee_id']
    
    if not month:
        return jsonify({'error': 'Month parameter required'}), 400
    
    try:
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # Calculate end date
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month_num + 1, 1).date()
    except ValueError:
        return jsonify({'error': 'Invalid month format. Use YYYY-MM'}), 400
    
    with get_db_session() as db:
        records = db.query(TimeRecord).filter(
            and_(
                TimeRecord.employee_id == employee_id,
                TimeRecord.date >= start_date,
                TimeRecord.date < end_date
            )
        ).order_by(TimeRecord.date).all()
        
        return jsonify({
            'records': [{
                'id': record.id,
                'date': record.date.isoformat(),
                'clockIn': record.clock_in.isoformat() if record.clock_in else None,
                'clockOut': record.clock_out.isoformat() if record.clock_out else None,
                'breakTime': record.break_time or 0,
                'totalHours': float(record.total_hours or 0),
                'status': 'complete' if record.clock_out else 'incomplete'
            } for record in records]
        })

# ==========================================
# Admin Endpoints
# ==========================================

@api_bp.route('/admin/employees', methods=['GET'])
@login_required
@admin_required
@handle_api_errors
def get_employees():
    """Get all employees (admin only)"""
    search = request.args.get('search', '')
    department = request.args.get('department', '')
    status = request.args.get('status', '')
    
    with get_db_session() as db:
        query = db.query(Employee, User).outerjoin(User, User.employee_id == Employee.employee_id)
        
        if search:
            query = query.filter(
                (Employee.name.contains(search)) |
                (Employee.employee_id.contains(search))
            )
        
        if department:
            query = query.filter(Employee.department == department)
        
        if status:
            if status == 'active':
                query = query.filter(Employee.status == 'active')
            elif status == 'inactive':
                query = query.filter(Employee.status == 'inactive')
        
        results = query.all()
        
        employees = []
        for employee, user in results:
            employees.append({
                'id': employee.id,
                'employeeId': employee.employee_id,
                'name': employee.name,
                'department': employee.department,
                'position': employee.position,
                'email': employee.email,
                'phone': employee.phone,
                'joinDate': employee.join_date.isoformat() if employee.join_date else None,
                'status': employee.status,
                'hasUser': user is not None,
                'isAdmin': user.is_admin if user else False
            })
        
        return jsonify({'employees': employees})

@api_bp.route('/admin/attendance/summary', methods=['GET'])
@login_required
@admin_required
@handle_api_errors
def get_attendance_summary():
    """Get attendance summary for all employees"""
    date_str = request.args.get('date')
    
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = datetime.now(JST).date()
    
    with get_db_session() as db:
        # Get all employees
        employees = db.query(Employee).filter(Employee.status == 'active').all()
        
        # Get attendance records for the date
        records = db.query(TimeRecord).filter(TimeRecord.date == target_date).all()
        record_dict = {record.employee_id: record for record in records}
        
        # Get work statuses
        statuses = db.query(WorkStatus).all()
        status_dict = {status.employee_id: status for status in statuses}
        
        summary = []
        for employee in employees:
            record = record_dict.get(employee.employee_id)
            status = status_dict.get(employee.employee_id)
            
            summary.append({
                'employeeId': employee.employee_id,
                'name': employee.name,
                'department': employee.department,
                'clockIn': record.clock_in.isoformat() if record and record.clock_in else None,
                'clockOut': record.clock_out.isoformat() if record and record.clock_out else None,
                'totalHours': float(record.total_hours or 0) if record else 0,
                'currentStatus': status.status if status else 'off',
                'isPresent': record is not None and record.clock_in is not None
            })
        
        return jsonify({
            'date': target_date.isoformat(),
            'summary': summary
        })

# ==========================================
# Health Check & Status Endpoints
# ==========================================

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        with get_db_session() as db:
            # Test database connection
            db.execute('SELECT 1')
            db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.now(JST).isoformat(),
        'version': '2.0.0',
        'database': db_status,
        'services': {
            'authentication': 'healthy',
            'attendance': 'healthy',
            'admin': 'healthy'
        }
    })

@api_bp.route('/status', methods=['GET'])
@login_required
@handle_api_errors
def get_system_status():
    """Get system status information"""
    with get_db_session() as db:
        # Count active users
        active_users = db.query(User).filter(User.last_login >= datetime.now(JST) - timedelta(days=7)).count()
        
        # Count today's attendance records
        today = datetime.now(JST).date()
        today_records = db.query(TimeRecord).filter(TimeRecord.date == today).count()
        
        # Count currently working employees
        working_now = db.query(WorkStatus).filter(WorkStatus.status == 'working').count()
        
        return jsonify({
            'activeUsers': active_users,
            'todayAttendance': today_records,
            'currentlyWorking': working_now,
            'systemTime': datetime.now(JST).isoformat(),
            'uptime': 'System operational'
        })

# Error handlers
@api_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@api_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500