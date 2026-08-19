from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from apps.users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    actor_details = UserSerializer(source='actor', read_only=True)
    ticket_number = serializers.CharField(source='ticket.ticket_number', read_only=True, default='')

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'actor_details', 'ticket', 'ticket_number', 'verb', 'message', 'is_read', 'created_at']

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
