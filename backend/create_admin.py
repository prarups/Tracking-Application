import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices

def create_initial_admin():
    # 1. Automatically restore active status for ALL users on deployment
    updated_count = User.objects.all().update(is_active=True)
    print(f"[+] Ensured all users are active (Updated: {updated_count})")

    # 2. Ensure default superuser 'admin' exists and has known password 'admin123' as fallback
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        admin_user = User.objects.filter(is_superuser=True).first()

    if not admin_user:
        User.objects.create_superuser(
            username='admin',
            email='admin@enterprise.com',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            role=RoleChoices.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True
        )
        print("[+] Clean Production Superuser created: admin / admin123")
    else:
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password('admin123')
        admin_user.save()
        print("[=] Reset default superuser 'admin' password to 'admin123' & ensured active status.")

if __name__ == '__main__':
    create_initial_admin()
