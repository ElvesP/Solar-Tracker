from django.urls import path
from .consumers import DashboardConsumer

websocket_urlpatterns = [
    path("ws/dashboard/<uuid:panel_id>/", DashboardConsumer.as_asgi()),
]