from rest_framework import serializers
from .models import Ticket, TicketCustomFieldValue, Attachment
from apps.users.serializers import UserSerializer
from apps.groups_app.serializers import GroupSerializer
from apps.projects.serializers import ProjectSerializer

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)

    class Meta:
        model = Attachment
        fields = ['id', 'ticket', 'uploaded_by', 'uploaded_by_details', 'file', 'thumbnail', 'original_filename', 'file_size_bytes', 'mime_type', 'is_compressed', 'created_at']

class TicketCustomFieldValueSerializer(serializers.ModelSerializer):
    field_key = serializers.CharField(source='custom_field.field_key', read_only=True)
    field_label = serializers.CharField(source='custom_field.label', read_only=True)

    class Meta:
        model = TicketCustomFieldValue
        fields = ['id', 'custom_field', 'field_key', 'field_label', 'value']

class TicketSerializer(serializers.ModelSerializer):
    reporter_details = UserSerializer(source='reporter', read_only=True)
    assigned_user_details = UserSerializer(source='assigned_user', read_only=True)
    assigned_group_details = GroupSerializer(source='assigned_group', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    custom_values = TicketCustomFieldValueSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    subtask_count = serializers.IntegerField(source='subtasks.count', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description', 'acceptance_criteria', 'priority', 'status', 'start_date', 'due_date',
            'project', 'project_details', 'assigned_group', 'assigned_group_details',
            'assigned_user', 'assigned_user_details', 'reporter', 'reporter_details',
            'watchers', 'labels', 'parent_ticket', 'dependencies', 'story_points',
            'custom_values', 'attachments', 'subtask_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ticket_number', 'reporter', 'created_at', 'updated_at']
