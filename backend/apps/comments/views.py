import re
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Comment
from .serializers import CommentSerializer
from apps.users.models import User
from apps.audit_logs.utils import create_audit_log
from apps.notifications.utils import notify_ticket_event

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related('author', 'ticket', 'attachment').prefetch_related('mentions')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket_id')
        if ticket_id:
            return self.queryset.filter(ticket_id=ticket_id)
        return self.queryset

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        
        # Parse @username mentions
        usernames = re.findall(r'@(\w+)', comment.content)
        if usernames:
            mentioned_users = User.objects.filter(username__in=usernames)
            comment.mentions.set(mentioned_users)
            
            for user in mentioned_users:
                notify_ticket_event(
                    ticket=comment.ticket,
                    actor=self.request.user,
                    verb='MENTIONED',
                    message=f"{self.request.user.username} mentioned you in ticket {comment.ticket.ticket_number}",
                    target_user=user
                )

        create_audit_log(
            ticket=comment.ticket,
            actor=self.request.user,
            action_type='COMMENT_ADDED',
            field_name='comment',
            new_value=comment.content[:100],
            request=self.request
        )

        notify_ticket_event(
            ticket=comment.ticket,
            actor=self.request.user,
            verb='COMMENTED',
            message=f"{self.request.user.username} commented on ticket {comment.ticket.ticket_number}"
        )

    def perform_update(self, serializer):
        old_comment = Comment.objects.get(pk=serializer.instance.pk)
        new_content = serializer.validated_data.get('content', old_comment.content)
        
        if old_comment.content != new_content:
            history = old_comment.edit_history or []
            history.append({
                'content': old_comment.content,
                'edited_at': str(old_comment.updated_at)
            })
            serializer.validated_data['edit_history'] = history
            
        serializer.save()
