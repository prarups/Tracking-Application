from django.db import models
from apps.groups_app.models import Group
from apps.projects.models import Project

class FieldTypeChoices(models.TextChoices):
    TEXT = 'TEXT', 'Text Input'
    TEXTAREA = 'TEXTAREA', 'Textarea'
    RICH_TEXT = 'RICH_TEXT', 'Rich Text Editor'
    NUMBER = 'NUMBER', 'Number'
    EMAIL = 'EMAIL', 'Email'
    PHONE = 'PHONE', 'Phone Number'
    DATE = 'DATE', 'Date Picker'
    DATETIME = 'DATETIME', 'Date Time Picker'
    DROPDOWN = 'DROPDOWN', 'Dropdown'
    SEARCHABLE_DROPDOWN = 'SEARCHABLE_DROPDOWN', 'Searchable Dropdown'
    MULTI_SELECT = 'MULTI_SELECT', 'Multi-Select Dropdown'
    CHECKBOX = 'CHECKBOX', 'Checkbox'
    RADIO = 'RADIO', 'Radio Button'
    TOGGLE = 'TOGGLE', 'Toggle Switch'
    USER_PICKER = 'USER_PICKER', 'User Picker'
    GROUP_PICKER = 'GROUP_PICKER', 'Group Picker'
    IMAGE_UPLOAD = 'IMAGE_UPLOAD', 'Image Upload'
    FILE_UPLOAD = 'FILE_UPLOAD', 'File Upload'
    COLOR_PICKER = 'COLOR_PICKER', 'Color Picker'

class CustomField(models.Model):
    field_key = models.CharField(max_length=50, unique=True, help_text="Unique identifier e.g. custom_sprint_name")
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=30, choices=FieldTypeChoices.choices, default=FieldTypeChoices.TEXT)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='custom_fields')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='custom_fields')
    is_required = models.BooleanField(default=False)
    default_value = models.JSONField(null=True, blank=True)
    options = models.JSONField(null=True, blank=True, help_text="List of choices for dropdowns/radio/checkbox")
    validation_rules = models.JSONField(null=True, blank=True, help_text="Min length, max length, regex pattern, min/max values")
    conditional_logic = models.JSONField(null=True, blank=True, help_text="Show if field X == value Y")
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.label} ({self.field_key}) - [{self.field_type}]"
