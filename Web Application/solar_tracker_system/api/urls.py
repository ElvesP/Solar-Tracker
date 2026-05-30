from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SolarPanelViewSet,
    DashboardDataViewSet,
    PanelPositionViewSet,
    RemoteControlViewSet,
    LocationViewSet,
    DailyDataViewSet,
    DeleteMyUserView
)

router = DefaultRouter()

# SOLAR PANEL ROUTES
router.register(
    r'solar-panels',
    SolarPanelViewSet,
    basename='solar-panel'
)

# DASHBOARD DATA ROUTES
router.register(
    r'dashboard-data',
    DashboardDataViewSet,
    basename='dashboard-data'
)

# PANEL POSITION ROUTES
router.register(
    r'panel-positions',
    PanelPositionViewSet,
    basename='panel-position'
)

# REMOTE CONTROL ROUTES
router.register(
    r'remote-controls',
    RemoteControlViewSet,
    basename='remote-control'
)

# LOCATION ROUTES
router.register(
    r'locations',
    LocationViewSet,
    basename='location'
)

urlpatterns = [
    path("", include(router.urls)),
    path("daily-data/", DailyDataViewSet.as_view()),
    path("users/me/", DeleteMyUserView.as_view())
]