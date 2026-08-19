import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from apps.users.models import User, RoleChoices
from apps.groups_app.models import Group, GroupMember, GroupMemberRole
from apps.projects.models import Project
from apps.dynamic_fields.models import CustomField, FieldTypeChoices
from apps.tickets.models import Ticket, PriorityChoices, StatusChoices, TicketCustomFieldValue
from apps.comments.models import Comment
from apps.audit_logs.utils import create_audit_log

def seed():
    print("[+] Seeding Enterprise Tracking Database...")


    # 1. Create Super Admin, Admin, Manager, Team Lead, Employee, Viewer
    admin, _ = User.objects.get_or_create(
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
    admin.set_password('admin123')
    admin.save()

    manager, _ = User.objects.get_or_create(
        username='manager',
        defaults={
            'email': 'manager@enterprise.com',
            'first_name': 'Engineering',
            'last_name': 'Manager',
            'role': RoleChoices.MANAGER
        }
    )
    manager.set_password('manager123')
    manager.save()

    lead, _ = User.objects.get_or_create(
        username='techlead',
        defaults={
            'email': 'lead@enterprise.com',
            'first_name': 'Tech',
            'last_name': 'Lead',
            'role': RoleChoices.TEAM_LEAD
        }
    )
    lead.set_password('lead123')
    lead.save()

    dev_user, _ = User.objects.get_or_create(
        username='john_dev',
        defaults={
            'email': 'john@enterprise.com',
            'first_name': 'John',
            'last_name': 'Developer',
            'role': RoleChoices.EMPLOYEE
        }
    )
    dev_user.set_password('dev123')
    dev_user.save()

    qa_user, _ = User.objects.get_or_create(
        username='sarah_qa',
        defaults={
            'email': 'sarah@enterprise.com',
            'first_name': 'Sarah',
            'last_name': 'Tester',
            'role': RoleChoices.EMPLOYEE
        }
    )
    qa_user.set_password('qa123')
    qa_user.save()

    # 2. Create Required Department Groups
    groups_data = [
        {'code': 'DEV', 'name': 'Development', 'icon': 'code', 'color': '#3B82F6', 'desc': 'Software engineering & features'},
        {'code': 'QA', 'name': 'QA & Testing', 'icon': 'bug', 'color': '#EF4444', 'desc': 'Quality assurance, automation & bugs'},
        {'code': 'SUP', 'name': 'Customer Support', 'icon': 'headset', 'color': '#10B981', 'desc': 'L1/L2 customer incidents'},
        {'code': 'HR', 'name': 'Human Resources', 'icon': 'users', 'color': '#8B5CF6', 'desc': 'Onboarding, hiring & employee welfare'},
        {'code': 'FIN', 'name': 'Finance', 'icon': 'dollar', 'color': '#F59E0B', 'desc': 'Budgeting, payroll & expenses'},
        {'code': 'ACC', 'name': 'Accounts', 'icon': 'calculator', 'color': '#6366F1', 'desc': 'Invoicing, billing & ledgers'},
        {'code': 'OPS', 'name': 'Operations & DevOps', 'icon': 'server', 'color': '#06B6D4', 'desc': 'Infrastructure, CI/CD & uptime'},
        {'code': 'MKT', 'name': 'Marketing', 'icon': 'megaphone', 'color': '#EC4899', 'desc': 'Campaigns, branding & SEO'},
    ]

    group_objs = {}
    for gdata in groups_data:
        grp, _ = Group.objects.get_or_create(
            code=gdata['code'],
            defaults={
                'name': gdata['name'],
                'description': gdata['desc'],
                'icon': gdata['icon'],
                'color': gdata['color'],
                'lead': lead
            }
        )
        group_objs[gdata['code']] = grp

    # Assign users to groups
    GroupMember.objects.get_or_create(group=group_objs['DEV'], user=dev_user, defaults={'role': GroupMemberRole.MEMBER})
    GroupMember.objects.get_or_create(group=group_objs['DEV'], user=lead, defaults={'role': GroupMemberRole.LEAD})
    GroupMember.objects.get_or_create(group=group_objs['QA'], user=qa_user, defaults={'role': GroupMemberRole.MEMBER})

    # 3. Create Demo Projects
    proj_dev, _ = Project.objects.get_or_create(
        key='DEV',
        defaults={
            'name': 'Core Platform Engineering',
            'description': 'Main commercial tracking product backend & frontend',
            'group': group_objs['DEV'],
            'lead': lead
        }
    )

    proj_qa, _ = Project.objects.get_or_create(
        key='QA',
        defaults={
            'name': 'Automation & Security Testing',
            'description': 'End-to-end regression suites and security audits',
            'group': group_objs['QA'],
            'lead': manager
        }
    )

    # 4. Create Dynamic Custom Fields
    sprint_field, _ = CustomField.objects.get_or_create(
        field_key='sprint_name',
        defaults={
            'label': 'Sprint Name',
            'field_type': FieldTypeChoices.DROPDOWN,
            'options': ['Sprint 2026.1', 'Sprint 2026.2', 'Backlog Refinement'],
            'group': group_objs['DEV'],
            'display_order': 1
        }
    )

    impact_field, _ = CustomField.objects.get_or_create(
        field_key='customer_impact',
        defaults={
            'label': 'Customer Impact Level',
            'field_type': FieldTypeChoices.SEARCHABLE_DROPDOWN,
            'options': ['Low Impact', 'Moderate Impact', 'High Revenue Risk', 'Mission Critical'],
            'group': group_objs['DEV'],
            'display_order': 2
        }
    )

    # 5. Create Sample Tickets
    t1, _ = Ticket.objects.get_or_create(
        ticket_number='DEV-1001',
        defaults={
            'title': 'Implement AG Grid Enterprise for ticket table view',
            'description': 'Replace standard tables with high-performance AG Grid Enterprise with column filters, export to Excel, and sticky headers.',
            'priority': PriorityChoices.URGENT,
            'status': StatusChoices.IN_PROGRESS,
            'project': proj_dev,
            'assigned_group': group_objs['DEV'],
            'assigned_user': dev_user,
            'reporter': lead,
            'story_points': 5
        }
    )

    t2, _ = Ticket.objects.get_or_create(
        ticket_number='DEV-1002',
        defaults={
            'title': 'Setup Django Channels & Redis WebSockets for instant notifications',
            'description': 'Ensure real-time notification popups and unread count badge update without page refresh.',
            'priority': PriorityChoices.HIGH,
            'status': StatusChoices.TODO,
            'project': proj_dev,
            'assigned_group': group_objs['DEV'],
            'assigned_user': dev_user,
            'reporter': manager,
            'story_points': 8
        }
    )

    t3, _ = Ticket.objects.get_or_create(
        ticket_number='QA-1001',
        defaults={
            'title': 'Verify Image Compression Pipeline under 50KB',
            'description': 'Upload multi-megabyte screenshots and confirm output WebP files are strictly under 50 KB.',
            'priority': PriorityChoices.MEDIUM,
            'status': StatusChoices.IN_REVIEW,
            'project': proj_qa,
            'assigned_group': group_objs['QA'],
            'assigned_user': qa_user,
            'reporter': manager,
            'story_points': 3
        }
    )

    # Custom Field Values
    TicketCustomFieldValue.objects.get_or_create(ticket=t1, custom_field=sprint_field, defaults={'value': 'Sprint 2026.1'})
    TicketCustomFieldValue.objects.get_or_create(ticket=t1, custom_field=impact_field, defaults={'value': 'High Revenue Risk'})

    # Sample Comments
    Comment.objects.get_or_create(
        ticket=t1,
        author=lead,
        content='Great progress @john_dev! Please ensure dark mode styles look crisp on AG Grid headers.'
    )

    create_audit_log(t1, admin, 'SYSTEM_SEEDED', new_value='Initial seed completed', request=None)

    print("[SUCCESS] Database Seeded Successfully!")
    print("--------------------------------------------------")
    print("Credentials:")
    print("Superadmin : admin / admin123")
    print("Manager    : manager / manager123")
    print("Tech Lead  : techlead / lead123")
    print("Developer  : john_dev / dev123")
    print("QA Tester  : sarah_qa / qa123")
    print("--------------------------------------------------")

if __name__ == '__main__':
    seed()
