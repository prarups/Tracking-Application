from django.db import models
from django.db.models import Prefetch
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket, TicketCustomFieldValue, Attachment
from .serializers import TicketSerializer, AttachmentSerializer
from .image_utils import compress_image_under_50kb
from apps.dynamic_fields.models import CustomField
from apps.audit_logs.utils import create_audit_log
from apps.notifications.utils import notify_ticket_event

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().select_related(
        'project', 'assigned_group', 'assigned_group__lead', 'assigned_user', 'reporter'
    ).prefetch_related(
        'assigned_group__members',
        Prefetch('custom_values', queryset=TicketCustomFieldValue.objects.select_related('custom_field')),
        Prefetch('attachments', queryset=Attachment.objects.select_related('uploaded_by')),
        'watchers'
    ).order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().annotate(subtasks_count_annotated=models.Count('subtasks', distinct=True))
        user = self.request.user

        if user.is_authenticated and not (user.role in ['SUPER_ADMIN', 'ADMIN'] or user.is_superuser or user.is_staff):
            qs = qs.filter(
                models.Q(assigned_group__members=user) |
                models.Q(assigned_group__lead=user) |
                models.Q(assigned_user=user) |
                models.Q(reporter=user)
            ).distinct()

        group_id = self.request.query_params.get('group_id')
        project_id = self.request.query_params.get('project_id')
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        assigned_user_id = self.request.query_params.get('assigned_user_id')

        if group_id:
            qs = qs.filter(assigned_group_id=group_id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if priority_param:
            qs = qs.filter(priority=priority_param)
        if assigned_user_id:
            qs = qs.filter(assigned_user_id=assigned_user_id)
            
        return qs

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg, '')

        if str(lookup_val).isdigit():
            obj = queryset.filter(pk=lookup_val).first()
        else:
            obj = queryset.filter(ticket_number__iexact=lookup_val).first()

        if not obj:
            from rest_framework.exceptions import NotFound
            raise NotFound(f"Ticket '{lookup_val}' not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        ticket = serializer.save(reporter=self.request.user)

        # Save custom dynamic field values if provided
        custom_data = self.request.data.get('custom_fields_data', {})
        if isinstance(custom_data, dict):
            for field_key, val in custom_data.items():
                if val:
                    cf = CustomField.objects.filter(field_key=field_key).first()
                    if cf:
                        TicketCustomFieldValue.objects.update_or_create(
                            ticket=ticket, custom_field=cf, defaults={'value': val}
                        )
        
        # Audit Log
        create_audit_log(
            ticket=ticket,
            actor=self.request.user,
            action_type='CREATED',
            field_name='ticket',
            new_value=f"Ticket {ticket.ticket_number} created",
            request=self.request
        )
        
        # Real-time WebSocket Notifications
        actor_name = self.request.user.first_name or self.request.user.username
        notify_ticket_event(
            ticket=ticket,
            actor=self.request.user,
            verb='CREATED',
            message=f"{actor_name} created new ticket {ticket.ticket_number}: \"{ticket.title}\""
        )

    def perform_update(self, serializer):
        old_ticket = Ticket.objects.get(pk=serializer.instance.pk)
        ticket = serializer.save()

        # Update custom dynamic field values if provided
        custom_data = self.request.data.get('custom_fields_data', {})
        if isinstance(custom_data, dict):
            for field_key, val in custom_data.items():
                cf = CustomField.objects.filter(field_key=field_key).first()
                if cf:
                    if val is not None and str(val).strip() != "":
                        TicketCustomFieldValue.objects.update_or_create(
                            ticket=ticket, custom_field=cf, defaults={'value': str(val)}
                        )
                    else:
                        TicketCustomFieldValue.objects.filter(ticket=ticket, custom_field=cf).delete()
        
        changes = []
        # Audit log changes
        for field in ['status', 'priority', 'assigned_user', 'title']:
            old_val = getattr(old_ticket, field)
            new_val = getattr(ticket, field)
            if old_val != new_val:
                changes.append(f"{field.replace('_', ' ').capitalize()}: '{old_val}' → '{new_val}'")
                create_audit_log(
                    ticket=ticket,
                    actor=self.request.user,
                    action_type='UPDATED',
                    field_name=field,
                    old_value=str(old_val),
                    new_value=str(new_val),
                    request=self.request
                )
                
        # Real-time notification
        actor_name = self.request.user.first_name or self.request.user.username
        change_summary = ", ".join(changes) if changes else "Ticket details updated"
        notify_ticket_event(
            ticket=ticket,
            actor=self.request.user,
            verb='UPDATED',
            message=f"{actor_name} updated {ticket.ticket_number}: {change_summary}"
        )

    @action(detail=True, methods=['post'], url_path='attachments')
    def upload_attachment(self, request, pk=None):
        ticket = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        comp_file, _, comp_size = compress_image_under_50kb(file_obj)

        attachment = Attachment.objects.create(
            ticket=ticket,
            uploaded_by=request.user,
            file=comp_file,
            thumbnail=None,
            original_filename=file_obj.name,
            file_size_bytes=comp_size,
            mime_type='image/webp' if comp_file.name.endswith('.webp') else getattr(file_obj, 'content_type', 'application/octet-stream'),
            is_compressed=True
        )

        create_audit_log(
            ticket=ticket,
            actor=request.user,
            action_type='ATTACHMENT_UPLOADED',
            field_name='attachment',
            new_value=attachment.original_filename,
            request=request
        )

        return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)
