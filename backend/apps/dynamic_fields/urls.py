from rest_framework.routers import DefaultRouter
from .serializers import CustomFieldViewSet

router = DefaultRouter()
router.register(r'', CustomFieldViewSet, basename='customfield')

urlpatterns = router.urls
