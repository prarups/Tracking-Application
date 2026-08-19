from django.db import models
from django.conf import settings
from apps.tickets.models import Ticket

class NotificationVerb(models.TextChoices):
    CREATED = 'CREATED', 'Created'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    TRANSFERRED = 'TRANSFERRED', 'Transferred'
    COMMENTED = 'COMMENTED', 'Commented'
    MENTIONED = 'MENTIONED', 'Mentioned'
    STATUS_CHANGED = 'STATUS_CHANGED', 'Status Changed'
    ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED', 'Attachment Uploaded'

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_notifications')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    verb = models.CharField(max_length=30, choices=NotificationVerb.choices, default=NotificationVerb.CREATED)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.message}"
