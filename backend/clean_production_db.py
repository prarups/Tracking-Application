import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices, CustomRole
from apps.groups_app.models import Group, GroupMember
from apps.projects.models import Project
from apps.dynamic_fields.models import CustomField
from apps.tickets.models import Ticket, TicketCustomFieldValue, Attachment
from apps.comments.models import Comment
from apps.notifications.models import Notification
from apps.audit_logs.models import ActivityLog

def clean_and_init():
    print("[*] Starting Production Database Cleanup...")

    # 1. Delete all Tickets, Comments, Attachments, Notifications, Audit Logs
    Comment.objects.all().delete()
    Attachment.objects.all().delete()
    TicketCustomFieldValue.objects.all().delete()
    Ticket.objects.all().delete()
    Notification.objects.all().delete()
    ActivityLog.objects.all().delete()

    # 2. Delete Projects
    Project.objects.all().delete()

    # 3. Delete Group Members & Groups
    GroupMember.objects.all().delete()
    Group.objects.all().delete()

    # 4. Delete Custom Fields & Roles
    CustomField.objects.all().delete()
    CustomRole.objects.all().delete()

    # 5. Delete all Non-Superusers
    User.objects.filter(is_superuser=False).delete()

    # 6. Ensure 1 clean Admin Superuser exists
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
        print("[+] Created clean Superuser: admin / admin123")
    else:
        print(f"[+] Preserved existing Superuser: {admin_user.username}")

    print("[OK] Database cleaned completely! All default groups, roles, projects, tickets and dummy users removed.")

if __name__ == '__main__':
    clean_and_init()
