from django.db import models
from django.conf import settings
from apps.groups_app.models import Group

class Project(models.Model):
    key = models.CharField(max_length=10, unique=True, help_text="Project key prefix e.g. DEV, QA, PRJ")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='projects')
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_projects')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.key})"
