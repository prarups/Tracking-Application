from rest_framework.routers import DefaultRouter
from .serializers import ActivityLogViewSet

router = DefaultRouter()
router.register(r'', ActivityLogViewSet, basename='auditlog')

urlpatterns = router.urls
