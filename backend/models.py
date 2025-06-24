from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Date, Time, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
from werkzeug.security import check_password_hash, generate_password_hash

Base = declarative_base()
JST = pytz.timezone('Asia/Tokyo')


class User(Base):
    """ユーザーモデル（ログイン用）"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), unique=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
    last_login = Column(DateTime(timezone=True))
    
    # リレーション
    employee = relationship('Employee', back_populates='user')
    daily_reports = relationship('DailyReport', back_populates='user')
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)


class Employee(Base):
    """従業員モデル"""
    __tablename__ = 'employees'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    department = Column(String(100))
    position = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
    
    # リレーション
    time_records = relationship('TimeRecord', back_populates='employee')
    user = relationship('User', back_populates='employee', uselist=False)
    daily_reports = relationship('DailyReport', back_populates='employee')


class TimeRecord(Base):
    """打刻記録モデル"""
    __tablename__ = 'time_records'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    record_type = Column(String(20), nullable=False)  # 'check_in' or 'check_out'
    photo_path = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
    
    # リレーション
    employee = relationship('Employee', back_populates='time_records')


class DailyReport(Base):
    """日報モデル"""
    __tablename__ = 'daily_reports'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False)
    report_date = Column(Date, nullable=False)
    work_content = Column(Text, nullable=False)
    achievements = Column(Text)
    issues = Column(Text)
    tomorrow_plan = Column(Text)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST), onupdate=lambda: datetime.now(JST))
    
    # リレーション
    user = relationship('User', back_populates='daily_reports')
    employee = relationship('Employee', back_populates='daily_reports')


class WorkStatus(Base):
    """現在の勤務状態を管理"""
    __tablename__ = 'work_status'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), unique=True, nullable=False)
    is_working = Column(Boolean, default=False)
    last_check_in = Column(DateTime(timezone=True))
    last_check_out = Column(DateTime(timezone=True))
    
    # リレーション
    employee = relationship('Employee')


class Notification(Base):
    """通知モデル"""
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))
    
    # リレーション
    user = relationship('User')


class Tag(Base):
    """業務タグ（Notionと同期）"""
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    notion_id = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))

    work_times = relationship('TagWorkTime', back_populates='tag')


class TagWorkTime(Base):
    """タグ別工数"""
    __tablename__ = 'tag_work_times'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    tag_id = Column(Integer, ForeignKey('tags.id'), nullable=False)
    date = Column(Date, nullable=False)
    hours = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(JST))

    user = relationship('User')
    tag = relationship('Tag', back_populates='work_times')
