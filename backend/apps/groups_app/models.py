from django.db import models
from django.conf import settings

class Group(models.Model):
    code = models.CharField(max_length=20, unique=True, help_text="Short code e.g. DEV, QA, HR")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='folder', help_text="MUI icon identifier")
    color = models.CharField(max_length=20, default='#3B82F6', help_text="Hex color code")
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_groups')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='GroupMember', related_name='app_groups')
    permissions = models.JSONField(default=dict, blank=True, help_text="Custom permissions JSON config")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class GroupMemberRole(models.TextChoices):
    LEAD = 'LEAD', 'Group Lead'
    MEMBER = 'MEMBER', 'Member'
    OBSERVER = 'OBSERVER', 'Observer'

class GroupMember(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=GroupMemberRole.choices, default=GroupMemberRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.group.code} as {self.role}"
