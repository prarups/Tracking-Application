from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, UserProfileView, UserViewSet, CustomRoleViewSet, LoginHistoryView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', CustomRoleViewSet, basename='role')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('login-history/', LoginHistoryView.as_view(), name='login_history'),
    path('', include(router.urls)),
]
