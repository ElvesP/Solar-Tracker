from rest_framework import viewsets
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    Location,
    DailyData
)
from .serializers import (
    SolarPanelSerializer,
    DashboardDataSerializer,
    PanelPositionSerializer,
    LocationSerializer,
    DailyDataSerializer
)


# SOLAR PANEL VIEWSET
class SolarPanelViewSe (viewsets.ModelViewSet):
    queryset = SolarPanel.objects.all().order_by('-timestamp')
    serializer_class = SolarPanelSerializer


# DASHBOARD DATA VIEWSET
class DashboardDataViewSet(viewsets.ModelViewSet):
    queryset = DashboardData.objects.all().order_by('-timestamp')
    serializer_class = DashboardDataSerializer


# PANEL POSITION VIEWSET
class PanelPositionViewSet(viewsets.ModelViewSet):
    queryset = PanelPosition.objects.all().order_by('-timestamp')
    serializer_class = PanelPositionSerializer


# LOCATION VIEWSET
class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all().order_by('-timestamp')
    serializer_class = LocationSerializer


# DAILYDATA VIEWSET
class DailyDataViewSet(viewsets.ModelViewSet):
    queryset = DailyData.objects.all().order_by('-timestamp')
    serializer_class = DailyDataSerializer