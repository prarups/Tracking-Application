from rest_framework import serializers
from .models import User, LoginHistory, CustomRole

class CustomRoleSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(source='users.count', read_only=True)

    class Meta:
        model = CustomRole
        fields = ['id', 'name', 'description', 'permissions', 'user_count', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    custom_role_details = CustomRoleSerializer(source='custom_role', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'employee_id', 'username', 'email', 'first_name', 'last_name', 'role', 'custom_role', 'custom_role_details', 'avatar', 'phone_number', 'is_mfa_enabled', 'is_active', 'date_joined']
        read_only_fields = ['id', 'employee_id', 'date_joined']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    custom_role = serializers.PrimaryKeyRelatedField(
        queryset=CustomRole.objects.all(), required=False, allow_null=True, default=None
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'custom_role']

    def create(self, validated_data):
        custom_role = validated_data.pop('custom_role', None)
        user = User.objects.create_user(**validated_data)
        if custom_role:
            user.custom_role = custom_role
            user.save(update_fields=['custom_role'])
        return user

class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ['id', 'ip_address', 'user_agent', 'login_time', 'is_successful']
