from rest_framework import serializers, viewsets, permissions
from .models import CustomField
from apps.users.permissions import IsAdminOrManager

from apps.groups_app.serializers import GroupSerializer

class CustomFieldSerializer(serializers.ModelSerializer):
    group_details = GroupSerializer(source='group', read_only=True)

    class Meta:
        model = CustomField
        fields = [
            'id', 'field_key', 'label', 'field_type', 'group', 'group_details', 'project',
            'is_required', 'default_value', 'options', 'validation_rules',
            'conditional_logic', 'display_order', 'is_active', 'created_at'
        ]

class CustomFieldViewSet(viewsets.ModelViewSet):
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CustomField.objects.filter(is_active=True)
        group_id = self.request.query_params.get('group_id')
        project_id = self.request.query_params.get('project_id')
        if group_id:
            qs = qs.filter(group_id=group_id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()
