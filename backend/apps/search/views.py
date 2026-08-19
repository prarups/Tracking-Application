from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from apps.tickets.models import Ticket
from apps.comments.models import Comment
from apps.users.models import User
from apps.groups_app.models import Group
from apps.projects.models import Project

class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({
                'tickets': [],
                'comments': [],
                'users': [],
                'groups': [],
                'projects': []
            })

        # 1. Search Tickets
        tickets = Ticket.objects.filter(
            Q(ticket_number__icontains=query) |
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(labels__icontains=query)
        ).select_related('assigned_group', 'assigned_user')[:10]

        ticket_results = [
            {
                'id': t.id,
                'ticket_number': t.ticket_number,
                'title': t.title,
                'status': t.status,
                'priority': t.priority,
                'group_name': t.assigned_group.name if t.assigned_group else '',
                'assigned_username': t.assigned_user.username if t.assigned_user else 'Unassigned'
            }
            for t in tickets
        ]

        # 2. Search Comments
        comments = Comment.objects.filter(content__icontains=query).select_related('ticket', 'author')[:5]
        comment_results = [
            {
                'id': c.id,
                'ticket_id': c.ticket.id,
                'ticket_number': c.ticket.ticket_number,
                'author': c.author.username,
                'snippet': c.content[:120] + ('...' if len(c.content) > 120 else '')
            }
            for c in comments
        ]

        # 3. Search Users
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:5]
        user_results = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': u.role
            }
            for u in users
        ]

        # 4. Search Groups
        groups = Group.objects.filter(
            Q(code__icontains=query) | Q(name__icontains=query)
        )[:5]
        group_results = [
            {
                'id': g.id,
                'code': g.code,
                'name': g.name,
                'color': g.color,
                'icon': g.icon
            }
            for g in groups
        ]

        # 5. Search Projects
        projects = Project.objects.filter(
            Q(key__icontains=query) | Q(name__icontains=query)
        )[:5]
        project_results = [
            {
                'id': p.id,
                'key': p.key,
                'name': p.name
            }
            for p in projects
        ]

        return Response({
            'tickets': ticket_results,
            'comments': comment_results,
            'users': user_results,
            'groups': group_results,
            'projects': project_results
        })
