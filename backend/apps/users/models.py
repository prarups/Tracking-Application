from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class RoleChoices(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Manager'
    TEAM_LEAD = 'TEAM_LEAD', 'Team Lead'
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    VIEWER = 'VIEWER', 'Viewer'

class CustomRole(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.JSONField(default=list, help_text="List of granted permission keys e.g. create_ticket, manage_groups")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', RoleChoices.SUPER_ADMIN)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.EMPLOYEE)
    custom_role = models.ForeignKey(CustomRole, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    is_mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    objects = UserManager()

    def save(self, *args, **kwargs):
        if not self.employee_id:
            max_num = 0
            existing_ids = User.objects.filter(employee_id__startswith='TRA').values_list('employee_id', flat=True)
            for eid in existing_ids:
                if eid:
                    num_str = ''.join(c for c in eid if c.isdigit())
                    if num_str:
                        try:
                            num = int(num_str)
                            if num > max_num:
                                max_num = num
                        except ValueError:
                            pass
            self.employee_id = f"TRA{str(max_num + 1).zfill(4)}"
        super().save(*args, **kwargs)

    def __str__(self):
        role_label = self.custom_role.name if self.custom_role else self.get_role_display()
        return f"[{self.employee_id}] {self.username} ({role_label})"

class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_histories')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(null=True, blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    is_successful = models.BooleanField(default=True)

    class Meta:
        ordering = ['-login_time']
