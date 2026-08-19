import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices

def create_initial_admin():
    if not User.objects.filter(is_superuser=True).exists():
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
        print("[=] Superuser already exists. Skipping creation.")

if __name__ == '__main__':
    create_initial_admin()
