from rest_framework import serializers
from .models import Group, GroupMember
from apps.users.serializers import UserSerializer

class GroupMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'group', 'user', 'user_details', 'role', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    lead_details = UserSerializer(source='lead', read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'code', 'name', 'description', 'icon', 'color', 'lead', 'lead_details', 'member_count', 'members_details', 'permissions', 'created_at']
