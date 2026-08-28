from rest_framework import serializers, viewsets, permissions
from .models import Project
from apps.groups_app.serializers import GroupSerializer
from apps.users.serializers import UserSerializer
from apps.users.permissions import IsAdminOrManager

class ProjectSerializer(serializers.ModelSerializer):
    group_details = GroupSerializer(source='group', read_only=True)
    lead_details = UserSerializer(source='lead', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'key', 'name', 'description', 'group', 'group_details', 'lead', 'lead_details', 'is_active', 'created_at']

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('group', 'lead').order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.request.query_params.get('group_id')
        if group_id:
            return self.queryset.filter(group_id=group_id)
        return self.queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()
