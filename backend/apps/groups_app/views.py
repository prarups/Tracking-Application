from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Group, GroupMember
from .serializers import GroupSerializer, GroupMemberSerializer
from apps.users.permissions import IsSuperAdminOrAdmin

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'assign_members']:
            return [IsSuperAdminOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Group.objects.none()
        
        # Super Admin and Admin can access all groups
        if user.role in ['SUPER_ADMIN', 'ADMIN'] or user.is_superuser or user.is_staff:
            return Group.objects.all().prefetch_related('members').order_by('-code')
        
        # Standard users only see groups they are explicitly granted access to (via member or lead)
        return Group.objects.filter(Q(members=user) | Q(lead=user)).distinct().prefetch_related('members').order_by('-code')

    def perform_create(self, serializer):
        code = serializer.validated_data.get('code')
        if not code:
            existing_codes = set(Group.objects.values_list('code', flat=True))
            count = 1
            while f"TR{count:04d}" in existing_codes:
                count += 1
            code = f"TR{count:04d}"
        serializer.save(code=code)

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        group = self.get_object()
        if request.method == 'GET':
            memberships = GroupMember.objects.filter(group=group).select_related('user')
            serializer = GroupMemberSerializer(memberships, many=True)
            return Response(serializer.data)
        
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'MEMBER')
        membership, created = GroupMember.objects.get_or_create(group=group, user_id=user_id, defaults={'role': role})
        if not created:
            membership.role = role
            membership.save()
        return Response(GroupMemberSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='assign-members')
    def assign_members(self, request, pk=None):
        group = self.get_object()
        user_ids = request.data.get('user_ids', [])
        if isinstance(user_ids, list):
            GroupMember.objects.filter(group=group).delete()
            for uid in user_ids:
                GroupMember.objects.create(group=group, user_id=uid, role='MEMBER')
        serializer = GroupSerializer(group)
        return Response(serializer.data)
