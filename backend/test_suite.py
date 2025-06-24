# 総合テストスイート

import unittest
import json
import tempfile
import os
from datetime import datetime, timedelta
import pytz
from flask import Flask
from app import app, init_db
from models import User, Employee, TimeRecord, WorkStatus
from database import get_db_session
from security import security_manager, validate_password_strength, validate_file_upload
from werkzeug.security import generate_password_hash
from werkzeug.datastructures import FileStorage
import io

JST = pytz.timezone('Asia/Tokyo')

class TimeCardTestCase(unittest.TestCase):
    """タイムカードアプリケーションのテストケース"""
    
    def setUp(self):
        """テスト前の設定"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SECRET_KEY'] = 'test-secret-key'
        self.app.config['WTF_CSRF_ENABLED'] = False
        
        # テスト用データベース
        self.db_fd, self.app.config['DATABASE'] = tempfile.mkstemp()
        
        self.client = self.app.test_client()
        
        with self.app.app_context():
            init_db()
            self.create_test_data()
    
    def tearDown(self):
        """テスト後のクリーンアップ"""
        os.close(self.db_fd)
        os.unlink(self.app.config['DATABASE'])
    
    def create_test_data(self):
        """テストデータの作成"""
        db_session = get_db_session()
        try:
            # テスト従業員の作成
            employee = Employee(
                employee_id='TEST001',
                name='テストユーザー',
                email='test@example.com',
                department='開発部',
                position='エンジニア'
            )
            db_session.add(employee)
            
            # テストユーザーの作成
            user = User(
                username='testuser',
                password_hash=generate_password_hash('TestPassword123!'),
                employee_id='TEST001',
                is_admin=False
            )
            db_session.add(user)
            
            # 管理者ユーザーの作成
            admin_employee = Employee(
                employee_id='ADMIN001',
                name='管理者',
                email='admin@example.com',
                department='管理部',
                position='管理者'
            )
            db_session.add(admin_employee)
            
            admin_user = User(
                username='admin',
                password_hash=generate_password_hash('AdminPassword123!'),
                employee_id='ADMIN001',
                is_admin=True
            )
            db_session.add(admin_user)
            
            db_session.commit()
        finally:
            db_session.close()
    
    def login(self, username='testuser', password='TestPassword123!'):
        """ログインヘルパー"""
        return self.client.post('/api/login', 
                              data=json.dumps({
                                  'username': username,
                                  'password': password
                              }),
                              content_type='application/json')
    
    def admin_login(self):
        """管理者ログインヘルパー"""
        return self.login('admin', 'AdminPassword123!')

class AuthenticationTests(TimeCardTestCase):
    """認証機能のテスト"""
    
    def test_successful_login(self):
        """正常ログインのテスト"""
        response = self.login()
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['username'], 'testuser')
    
    def test_invalid_credentials(self):
        """無効な認証情報のテスト"""
        response = self.login('testuser', 'wrongpassword')
        self.assertEqual(response.status_code, 401)
        
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_missing_credentials(self):
        """認証情報不足のテスト"""
        response = self.client.post('/api/login',
                                  data=json.dumps({}),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_logout(self):
        """ログアウトのテスト"""
        self.login()
        response = self.client.post('/api/logout')
        self.assertEqual(response.status_code, 200)
    
    def test_auth_check(self):
        """認証状態確認のテスト"""
        # ログイン前
        response = self.client.get('/api/check-auth')
        self.assertEqual(response.status_code, 401)
        
        # ログイン後
        self.login()
        response = self.client.get('/api/check-auth')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['authenticated'])

class TimeRecordTests(TimeCardTestCase):
    """打刻機能のテスト"""
    
    def test_check_in(self):
        """出勤打刻のテスト"""
        self.login()
        
        response = self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('message', data)
    
    def test_check_out(self):
        """退勤打刻のテスト"""
        self.login()
        
        # 先に出勤
        self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        # 退勤
        response = self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_out'
        })
        
        self.assertEqual(response.status_code, 201)
    
    def test_duplicate_check_in(self):
        """重複出勤打刻のテスト"""
        self.login()
        
        # 最初の出勤
        self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        # 重複出勤（エラーになるはず）
        response = self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        self.assertEqual(response.status_code, 400)
    
    def test_unauthorized_time_record(self):
        """未認証での打刻テスト"""
        response = self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        self.assertEqual(response.status_code, 401)

class SecurityTests(TimeCardTestCase):
    """セキュリティ機能のテスト"""
    
    def test_password_strength_validation(self):
        """パスワード強度検証のテスト"""
        # 強いパスワード
        errors = validate_password_strength('StrongPassword123!')
        self.assertEqual(len(errors), 0)
        
        # 弱いパスワード
        weak_passwords = [
            'password',      # 一般的なパスワード
            '123456',        # 短すぎる
            'PASSWORD',      # 小文字なし
            'password123',   # 大文字・特殊文字なし
            'Password!',     # 数字なし
        ]
        
        for weak_password in weak_passwords:
            errors = validate_password_strength(weak_password)
            self.assertGreater(len(errors), 0)
    
    def test_input_validation(self):
        """入力検証のテスト"""
        # SQLインジェクション試行
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "../../../etc/passwd"
        ]
        
        for malicious_input in malicious_inputs:
            self.assertTrue(security_manager.contains_malicious_content(malicious_input))
    
    def test_rate_limiting(self):
        """レート制限のテスト"""
        # 正常なリクエスト
        self.assertTrue(security_manager.check_rate_limit('test_ip', 5, 1))
        
        # 制限を超えるリクエスト
        for _ in range(5):
            security_manager.check_rate_limit('test_ip', 5, 1)
        
        # 6回目は制限される
        self.assertFalse(security_manager.check_rate_limit('test_ip', 5, 1))
    
    def test_file_upload_validation(self):
        """ファイルアップロード検証のテスト"""
        # 正常なファイル
        valid_file = FileStorage(
            stream=io.BytesIO(b'test image data'),
            filename='test.jpg',
            content_type='image/jpeg'
        )
        errors = validate_file_upload(valid_file)
        self.assertEqual(len(errors), 0)
        
        # 不正なファイル名
        invalid_file = FileStorage(
            stream=io.BytesIO(b'test data'),
            filename='../../../malicious.exe',
            content_type='application/exe'
        )
        errors = validate_file_upload(invalid_file)
        self.assertGreater(len(errors), 0)

class APITests(TimeCardTestCase):
    """API機能のテスト"""
    
    def test_get_employees(self):
        """従業員一覧取得のテスト"""
        self.login()
        response = self.client.get('/api/employees')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
    
    def test_get_time_records(self):
        """打刻記録取得のテスト"""
        self.login()
        
        # 打刻記録を作成
        self.client.post('/api/time-record', data={
            'employee_id': 'TEST001',
            'type': 'check_in'
        })
        
        response = self.client.get('/api/time-records')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('records', data)
    
    def test_admin_only_endpoints(self):
        """管理者専用エンドポイントのテスト"""
        # 一般ユーザーでのアクセス
        self.login()
        response = self.client.get('/api/users')
        self.assertEqual(response.status_code, 403)
        
        # 管理者でのアクセス
        self.admin_login()
        response = self.client.get('/api/users')
        self.assertEqual(response.status_code, 200)

class DataValidationTests(TimeCardTestCase):
    """データ検証のテスト"""
    
    def test_employee_creation_validation(self):
        """従業員作成時の検証テスト"""
        self.admin_login()
        
        # 正常なデータ
        valid_data = {
            'employee_id': 'TEST002',
            'name': '新しいユーザー',
            'email': 'newuser@example.com',
            'department': '開発部',
            'position': 'エンジニア'
        }
        
        response = self.client.post('/api/employees',
                                  data=json.dumps(valid_data),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # 重複した従業員ID
        response = self.client.post('/api/employees',
                                  data=json.dumps(valid_data),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_user_creation_validation(self):
        """ユーザー作成時の検証テスト"""
        self.admin_login()
        
        # 正常なデータ
        valid_data = {
            'username': 'newuser',
            'password': 'NewPassword123!',
            'employee_id': 'TEST001',  # 既存の従業員ID
            'is_admin': False
        }
        
        response = self.client.post('/api/users',
                                  data=json.dumps(valid_data),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 201)

class PerformanceTests(TimeCardTestCase):
    """パフォーマンステスト"""
    
    def test_large_data_handling(self):
        """大量データ処理のテスト"""
        self.login()
        
        # 複数の打刻記録を作成
        for i in range(10):
            self.client.post('/api/time-record', data={
                'employee_id': 'TEST001',
                'type': 'check_in'
            })
            self.client.post('/api/time-record', data={
                'employee_id': 'TEST001',
                'type': 'check_out'
            })
        
        # 記録取得のパフォーマンス測定
        import time
        start_time = time.time()
        
        response = self.client.get('/api/time-records?limit=100')
        
        end_time = time.time()
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(response_time, 1.0)  # 1秒以内のレスポンス

def run_all_tests():
    """全テストの実行"""
    # テストスイートの作成
    test_classes = [
        AuthenticationTests,
        TimeRecordTests,
        SecurityTests,
        APITests,
        DataValidationTests,
        PerformanceTests
    ]
    
    suite = unittest.TestSuite()
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # テスト実行
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 結果の出力
    print(f"\n{'='*50}")
    print(f"テスト結果: {result.testsRun}件実行")
    print(f"成功: {result.testsRun - len(result.failures) - len(result.errors)}件")
    print(f"失敗: {len(result.failures)}件")
    print(f"エラー: {len(result.errors)}件")
    print(f"{'='*50}")
    
    if result.failures:
        print("\n失敗したテスト:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nエラーが発生したテスト:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    return result.wasSuccessful()

# 統合テスト用のヘルパー関数
def create_test_database():
    """テスト用データベースの作成"""
    with app.app_context():
        init_db()

def cleanup_test_database():
    """テスト用データベースのクリーンアップ"""
    # 実装に応じてクリーンアップ処理を追加
    pass

if __name__ == '__main__':
    # ログディレクトリの作成
    os.makedirs('logs', exist_ok=True)
    
    # テストの実行
    success = run_all_tests()
    
    # 終了コード
    exit(0 if success else 1)