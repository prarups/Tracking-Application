import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices

def create_initial_admin():
    # Automatically restore active status for all superusers and admins on deployment
    updated_count = User.objects.filter(is_superuser=True).update(is_active=True)
    User.objects.filter(role__in=[RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN]).update(is_active=True)
    print(f"[+] Ensured superusers and admins are active (Updated: {updated_count})")

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
        print("[=] Superuser already exists. Ensured active status.")

if __name__ == '__main__':
    create_initial_admin()
