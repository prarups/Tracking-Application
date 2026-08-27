from django.db import models
from django.conf import settings
from apps.groups_app.models import Group
from apps.projects.models import Project
from apps.dynamic_fields.models import CustomField

class PriorityChoices(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'
    CRITICAL = 'CRITICAL', 'Critical'

class StatusChoices(models.TextChoices):
    BACKLOG = 'BACKLOG', 'Backlog'
    OPEN = 'OPEN', 'Open'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    IN_REVIEW = 'IN_REVIEW', 'In Review'
    REOPEN = 'REOPEN', 'Reopen'
    DONE = 'DONE', 'Done'
    CLOSED = 'CLOSED', 'Closed'

class Ticket(models.Model):
    ticket_number = models.CharField(max_length=30, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    acceptance_criteria = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PriorityChoices.choices, default=PriorityChoices.MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.OPEN, db_index=True)
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    assigned_group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='tickets')
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reported_tickets')
    
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='watched_tickets', blank=True)
    labels = models.JSONField(default=list, blank=True)
    
    parent_ticket = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    dependencies = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
    
    story_points = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assigned_group', 'status']),
            models.Index(fields=['assigned_user', 'status']),
            models.Index(fields=['reporter', 'status']),
            models.Index(fields=['created_at', 'priority']),
        ]

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            prefix = self.assigned_group.code if self.assigned_group else (self.project.key if self.project else 'TR0001')
            last_ticket = Ticket.objects.filter(ticket_number__startswith=f"{prefix}-").order_by('-id').first()
            if last_ticket:
                try:
                    last_num = int(last_ticket.ticket_number.split('-')[-1])
                    new_num = last_num + 1
                except ValueError:
                    new_num = 1001
            else:
                new_num = 1001
            self.ticket_number = f"{prefix}-{new_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.ticket_number}] {self.title}"

class TicketCustomFieldValue(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='custom_values')
    custom_field = models.ForeignKey(CustomField, on_delete=models.CASCADE)
    value = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('ticket', 'custom_field')

class Attachment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    thumbnail = models.ImageField(upload_to='attachments/thumbnails/', null=True, blank=True)
    original_filename = models.CharField(max_length=255)
    file_size_bytes = models.IntegerField()
    mime_type = models.CharField(max_length=100)
    is_compressed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
