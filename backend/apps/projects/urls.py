from rest_framework.routers import DefaultRouter
from .serializers import ProjectViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = router.urls
