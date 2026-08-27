import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices

def seed():
    print("[+] Seeding Enterprise Tracking Database (Admin Superuser Only)...")

    # Ensure admin superuser exists
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@enterprise.com',
            'first_name': 'Super',
            'last_name': 'Admin',
            'role': RoleChoices.SUPER_ADMIN,
            'is_staff': True,
            'is_superuser': True
        }
    )
    if not created:
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
    admin.set_password('admin123')
    admin.save()

    # Ensure no demo users exist
    User.objects.exclude(username='admin').delete()

    print("[SUCCESS] Database Ready (Superadmin Only). No demo groups or users created.")

if __name__ == '__main__':
    seed()
