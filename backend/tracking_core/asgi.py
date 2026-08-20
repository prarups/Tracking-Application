import os
import asyncio
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.notifications.middleware import JWTAuthMiddleware
import tracking_core.routing

django_asgi_app = get_asgi_application()

class CancelledErrorMiddleware:
    """
    Middleware to catch asyncio.CancelledError when clients disconnect
    or close their browser tabs early during HTTP requests.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        try:
            await self.inner(scope, receive, send)
        except (asyncio.CancelledError, GeneratorExit):
            pass

application = ProtocolTypeRouter({
    "http": CancelledErrorMiddleware(django_asgi_app),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            tracking_core.routing.websocket_urlpatterns
        )
    ),
})
