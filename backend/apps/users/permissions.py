from rest_framework import permissions
from .models import RoleChoices

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == RoleChoices.SUPER_ADMIN

class IsSuperAdminOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in [RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN] or request.user.is_superuser
        )

class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN, RoleChoices.MANAGER
        ]

class IsTeamLeadOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN, RoleChoices.MANAGER, RoleChoices.TEAM_LEAD
        ]

class IsNotViewer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role != RoleChoices.VIEWER
