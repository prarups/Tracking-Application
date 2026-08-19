from django.test import TestCase
from apps.users.models import User, RoleChoices

class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testdev',
            email='testdev@enterprise.com',
            password='password123',
            role=RoleChoices.EMPLOYEE
        )
        self.assertEqual(user.username, 'testdev')
        self.assertEqual(user.role, RoleChoices.EMPLOYEE)
        self.assertTrue(user.check_password('password123'))

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username='superadmin',
            email='admin@enterprise.com',
            password='adminpassword'
        )
        self.assertEqual(admin.role, RoleChoices.SUPER_ADMIN)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
