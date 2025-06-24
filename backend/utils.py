import os
from datetime import datetime

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    """アップロード可能なファイルかチェック"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_csv(records):
    """打刻記録からCSVデータを生成"""
    lines = ['従業員ID,従業員名,日付,時刻,種別,写真\n']
    
    for record in records:
        line = f"{record.employee_id},"
        line += f"{record.employee.name},"
        line += f"{record.timestamp.strftime('%Y-%m-%d')},"
        line += f"{record.timestamp.strftime('%H:%M:%S')},"
        line += f"{'出勤' if record.record_type == 'check_in' else '退勤'},"
        line += f"{'有' if record.photo_path else '無'}\n"
        lines.append(line)
    
    return ''.join(lines)