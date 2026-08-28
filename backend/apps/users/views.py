from rest_framework import status, generics, permissions, viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from django.contrib.auth import authenticate
from .models import User, LoginHistory, CustomRole, RoleChoices
from .serializers import UserSerializer, UserRegisterSerializer, LoginHistorySerializer, CustomRoleSerializer
from .permissions import IsAdminOrManager, IsSuperAdmin
from apps.groups_app.models import Group, GroupMember, GroupMemberRole
from apps.groups_app.serializers import GroupSerializer

from apps.audit_logs.utils import get_client_ip

from django.db.models import Q

@extend_schema(request=serializers.Serializer, responses={200: serializers.Serializer})
class CustomTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username_input = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        # Lookup user by username, email, or employee_id (case-insensitive)
        target_user = User.objects.filter(
            Q(username__iexact=username_input) |
            Q(email__iexact=username_input) |
            Q(employee_id__iexact=username_input)
        ).first()

        user = None
        if target_user:
            user = authenticate(username=target_user.username, password=password)
        else:
            user = authenticate(username=username_input, password=password)
        
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if target_user and not target_user.is_active:
            if target_user.check_password(password):
                LoginHistory.objects.create(user=target_user, ip_address=ip, user_agent=user_agent, is_successful=False)
                return Response({'detail': 'User account is disabled. Login is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        if user:
            if not user.is_active:
                return Response({'detail': 'User account is disabled. Login is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
            refresh = RefreshToken.for_user(user)
            LoginHistory.objects.create(user=user, ip_address=ip, user_agent=user_agent, is_successful=True)
            user.last_login_ip = ip
            user.save(update_fields=['last_login_ip'])
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        else:
            if target_user:
                LoginHistory.objects.create(user=target_user, ip_address=ip, user_agent=user_agent, is_successful=False)
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)



class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class CustomRoleViewSet(viewsets.ModelViewSet):
    queryset = CustomRole.objects.all().order_by('name')
    serializer_class = CustomRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegisterSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        user_obj = self.get_object()
        is_active_val = request.data.get('is_active')
        if is_active_val in [False, 'false', 'False', 0]:
            if str(request.user.id) == str(user_obj.id):
                return Response({'detail': 'Safety Guard: You cannot disable your own active logged-in admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        user_obj = self.get_object()
        is_active_val = request.data.get('is_active')
        if is_active_val in [False, 'false', 'False', 0]:
            if str(request.user.id) == str(user_obj.id):
                return Response({'detail': 'Safety Guard: You cannot disable your own active logged-in admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().partial_update(request, *args, **kwargs)

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        val = self.kwargs.get(lookup_url_kwarg, '')

        if isinstance(val, str) and val.startswith('@'):
            val = val[1:]

        user_obj = None
        if str(val).isdigit():
            user_obj = queryset.filter(Q(pk=int(val)) | Q(username__iexact=str(val))).first()
        else:
            user_obj = queryset.filter(
                Q(username__iexact=val) |
                Q(email__iexact=val) |
                Q(employee_id__iexact=val)
            ).first()

        if not user_obj:
            from django.http import Http404
            raise Http404(f"No User matches the given query for identifier '{val}'.")

        self.check_object_permissions(self.request, user_obj)
        return user_obj

    @action(detail=True, methods=['get', 'post'], url_path='group-permissions')
    def group_permissions(self, request, pk=None):
        user = self.get_object()
        if request.method == 'GET':
            memberships = GroupMember.objects.filter(user=user).select_related('group')
            res = [
                {
                    'group_id': m.group.id,
                    'group_code': m.group.code,
                    'group_name': m.group.name,
                    'role': m.role
                }
                for m in memberships
            ]
            return Response(res)

        if not (request.user.role in [RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN] or request.user.is_superuser):
            return Response({'detail': 'Only Super Admin and Admin can assign or revoke group access rights.'}, status=status.HTTP_403_FORBIDDEN)

        group_id = request.data.get('group_id')
        role = request.data.get('role', GroupMemberRole.MEMBER)
        action_type = request.data.get('action', 'grant')

        if not group_id:
            return Response({'detail': 'group_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        group = Group.objects.get(id=group_id)

        if action_type == 'revoke':
            GroupMember.objects.filter(user=user, group=group).delete()
            return Response({'detail': f"Access revoked for group {group.name}"})
        else:
            membership, created = GroupMember.objects.get_or_create(
                user=user, group=group, defaults={'role': role}
            )
            if not created:
                membership.role = role
                membership.save()
            return Response({'detail': f"Granted access to {group.name} as {role}"})

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({'detail': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': f"Password for @{user.username} successfully updated."})

class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user)[:20]
