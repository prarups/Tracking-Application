from rest_framework import serializers, viewsets, permissions
from .models import ActivityLog
from apps.users.serializers import UserSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_details = UserSerializer(source='actor', read_only=True)
    ticket_number = serializers.CharField(source='ticket.ticket_number', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = ['id', 'ticket', 'ticket_number', 'actor', 'actor_details', 'action_type', 'field_name', 'old_value', 'new_value', 'ip_address', 'user_agent', 'timestamp']

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().select_related('actor', 'ticket')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket_id')
        if ticket_id:
            return self.queryset.filter(ticket_id=ticket_id)
        return self.queryset
