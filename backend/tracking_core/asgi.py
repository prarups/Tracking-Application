import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.notifications.middleware import JWTAuthMiddleware
import tracking_core.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            tracking_core.routing.websocket_urlpatterns
        )
    ),
})
