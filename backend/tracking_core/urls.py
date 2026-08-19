from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from django.http import HttpResponseRedirect
import os

def root_redirect(request):
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        return HttpResponseRedirect(frontend_url)
    return HttpResponseRedirect('/api/docs/')

urlpatterns = [
    path('', root_redirect, name='root'),
    path('admin/', admin.site.urls),
    
    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # App API Endpoints
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/groups/', include('apps.groups_app.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/dynamic-fields/', include('apps.dynamic_fields.urls')),
    path('api/v1/tickets/', include('apps.tickets.urls')),
    path('api/v1/comments/', include('apps.comments.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit-logs/', include('apps.audit_logs.urls')),
    path('api/v1/search/', include('apps.search.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
