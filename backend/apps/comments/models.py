from django.db import models
from django.conf import settings
from apps.tickets.models import Ticket

class Comment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    attachment = models.ForeignKey('tickets.Attachment', on_delete=models.SET_NULL, null=True, blank=True, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    edit_history = models.JSONField(default=list, blank=True, help_text="History of previous edits")
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='mentioned_comments', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.ticket.ticket_number}"
