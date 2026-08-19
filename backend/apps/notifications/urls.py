from rest_framework.routers import DefaultRouter
from .serializers import NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = router.urls
