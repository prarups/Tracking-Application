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
    member_count = serializers.SerializerMethodField()
    members_details = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'code', 'name', 'description', 'icon', 'color', 'lead', 'lead_details', 'member_count', 'members_details', 'permissions', 'created_at']

    def get_member_count(self, obj):
        if hasattr(obj, 'member_count_annotated'):
            return obj.member_count_annotated
        if hasattr(obj, '_prefetched_objects_cache') and 'members' in obj._prefetched_objects_cache:
            return len(obj.members.all())
        return obj.members.count()
