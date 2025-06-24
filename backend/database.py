from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from werkzeug.security import generate_password_hash
from models import Base, Employee, User, WorkStatus, Notification
import os
from datetime import datetime
import pytz

# データベースファイルのパス
DB_PATH = 'data/timecard.db'
DATABASE_URL = f'sqlite:///{DB_PATH}'

# エンジンとセッションの作成
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

JST = pytz.timezone('Asia/Tokyo')


def init_db():
    """データベースの初期化"""
    # テーブルの作成
    Base.metadata.create_all(bind=engine)
    
    session = SessionLocal()
    try:
        # 初期従業員データ（既存データがない場合）
        if session.query(Employee).count() == 0:
            sample_employees = [
                Employee(employee_id='EMP001', name='山田太郎', email='yamada@example.com', department='営業部', position='主任'),
                Employee(employee_id='EMP002', name='鈴木花子', email='suzuki@example.com', department='人事部', position='一般社員'),
                Employee(employee_id='EMP003', name='佐藤次郎', email='sato@example.com', department='開発部', position='リーダー'),
                Employee(employee_id='ADMIN001', name='管理者', email='admin@example.com', department='管理部', position='管理者'),
            ]
            session.add_all(sample_employees)
            session.commit()
            print("サンプル従業員データを追加しました")
        
        # 初期ユーザーデータ（既存データがない場合）
        if session.query(User).count() == 0:
            users_data = [
                # 管理者ユーザー
                {
                    'username': 'admin',
                    'password': 'admin123',
                    'employee_id': 'ADMIN001',
                    'is_admin': True
                },
                # 一般ユーザー
                {
                    'username': 'yamada',
                    'password': 'yamada123',
                    'employee_id': 'EMP001',
                    'is_admin': False
                },
                {
                    'username': 'suzuki',
                    'password': 'suzuki123',
                    'employee_id': 'EMP002',
                    'is_admin': False
                },
                {
                    'username': 'sato',
                    'password': 'sato123',
                    'employee_id': 'EMP003',
                    'is_admin': False
                }
            ]
            
            for user_data in users_data:
                user = User(
                    username=user_data['username'],
                    password_hash=generate_password_hash(user_data['password']),
                    employee_id=user_data['employee_id'],
                    is_admin=user_data['is_admin']
                )
                session.add(user)
            
            session.commit()
            print("\n初期ユーザーを追加しました:")
            print("管理者: admin / admin123")
            print("一般ユーザー:")
            print("  - yamada / yamada123 (山田太郎)")
            print("  - suzuki / suzuki123 (鈴木花子)")
            print("  - sato / sato123 (佐藤次郎)")
        
        # 勤務状態の初期化
        employees = session.query(Employee).all()
        for employee in employees:
            existing_status = session.query(WorkStatus).filter_by(employee_id=employee.employee_id).first()
            if not existing_status:
                status = WorkStatus(
                    employee_id=employee.employee_id,
                    is_working=False
                )
                session.add(status)
        session.commit()
        
        # ウェルカム通知の作成
        users = session.query(User).all()
        for user in users:
            existing_notification = session.query(Notification).filter_by(user_id=user.id).first()
            if not existing_notification:
                notification = Notification(
                    user_id=user.id,
                    title='システムへようこそ！',
                    message='タイムカードシステムへようこそ。マイページから日報の作成や勤怠履歴の確認ができます。'
                )
                session.add(notification)
        session.commit()
        
    finally:
        session.close()


def get_db_session():
    """データベースセッションを取得"""
    return SessionLocal()
