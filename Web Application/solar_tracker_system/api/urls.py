from rest_framework.routers import DefaultRouter
from .views import (
    SolarPanelViewSet,
    DashboardDataViewSet,
    PanelPositionViewSet,
    LocationViewSet
)

router = DefaultRouter()

# =========================
# SOLAR PANEL ROUTES
# =========================
router.register(
    r'solar-panels',
    SolarPanelViewSet,
    basename='solar-panel'
)

# =========================
# DASHBOARD DATA ROUTES
# =========================
router.register(
    r'dashboard-data',
    DashboardDataViewSet,
    basename='dashboard-data'
)

# =========================
# PANEL POSITION ROUTES
# =========================
router.register(
    r'panel-positions',
    PanelPositionViewSet,
    basename='panel-position'
)

# =========================
# LOCATION ROUTES
# =========================
router.register(
    r'locations',
    LocationViewSet,
    basename='location'
)

urlpatterns = router.urls