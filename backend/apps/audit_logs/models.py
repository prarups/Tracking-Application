from django.db import models
from django.conf import settings
from apps.tickets.models import Ticket

class ActivityLog(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    action_type = models.CharField(max_length=50, help_text="CREATED, UPDATED, STATUS_CHANGE, COMMENT_ADDED, ATTACHMENT_UPLOADED, DELETED")
    field_name = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ticket', '-timestamp']),
            models.Index(fields=['actor', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.actor.username} {self.action_type} on {self.timestamp}"
