from django.test import TestCase
from apps.users.models import User, RoleChoices
from apps.groups_app.models import Group
from apps.projects.models import Project
from apps.tickets.models import Ticket, StatusChoices, PriorityChoices

class TicketModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reporter', email='rep@test.com', password='pass')
        self.group = Group.objects.create(code='DEV', name='Development')
        self.project = Project.objects.create(key='DEV', name='Core Engine', group=self.group)

    def test_ticket_number_generation(self):
        t1 = Ticket.objects.create(
            title='First Ticket',
            project=self.project,
            assigned_group=self.group,
            reporter=self.user,
            priority=PriorityChoices.HIGH,
            status=StatusChoices.TODO
        )
        self.assertEqual(t1.ticket_number, 'DEV-1001')

        t2 = Ticket.objects.create(
            title='Second Ticket',
            project=self.project,
            assigned_group=self.group,
            reporter=self.user,
            priority=PriorityChoices.MEDIUM,
            status=StatusChoices.IN_PROGRESS
        )
        self.assertEqual(t2.ticket_number, 'DEV-1002')
