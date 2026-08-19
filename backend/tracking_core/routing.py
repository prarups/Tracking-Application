from django.urls import re_path
from apps.notifications.consumers import NotificationConsumer, TicketConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/tickets/(?P<ticket_id>\d+)/$', TicketConsumer.as_asgi()),
]
