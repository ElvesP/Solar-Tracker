from datetime import datetime, timedelta
from django.db.models import Avg
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    Location
)
from solar_tracker_system.services.energy_service import EnergyService
from .serializers import (
    SolarPanelSerializer,
    DashboardDataSerializer,
    PanelPositionSerializer,
    LocationSerializer
)


# SOLAR PANEL VIEWSET
class SolarPanelViewSet(viewsets.ModelViewSet):
    serializer_class = SolarPanelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SolarPanel.objects.filter(
            user=self.request.user
        ).order_by('timestamp')

        return queryset


    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )


# DASHBOARD DATA VIEWSET
class DashboardDataViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DashboardData.objects.filter(
            panel__user=self.request.user
        ).order_by('timestamp')
        panel = self.request.query_params.get('panel')
        date = self.request.query_params.get('date')

        if panel and date:
            queryset = queryset.filter(
                panel_id=panel, timestamp__date=date)

        return queryset


# PANEL POSITION VIEWSET
class PanelPositionViewSet(viewsets.ModelViewSet):
    serializer_class = PanelPositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PanelPosition.objects.filter(
            panel__user=self.request.user
        ).order_by('timestamp')
        panel = self.request.query_params.get('panel')
        date = self.request.query_params.get('date')

        if panel and date:
            queryset = queryset.filter(
                panel_id=panel, timestamp__date=date)

        return queryset


# LOCATION VIEWSET
class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Location.objects.filter(
            panel__user=self.request.user
        ).order_by('timestamp')
        panel = self.request.query_params.get('panel')
        date = self.request.query_params.get('date')

        if panel and date:
            queryset = queryset.filter(
                panel_id=panel, timestamp__date=date)

        return queryset


# DAILY DATA VIEW
class DailyDataViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        dashboard_queryset = DashboardData.objects.filter(
            panel__user=self.request.user
        )
        position_queryset = PanelPosition.objects.filter(
            panel__user=self.request.user
        )
        panel = self.request.query_params.get('panel')
        date = self.request.query_params.get('date')
        rangeType = self.request.query_params.get('range')

        try:
            end_date = datetime.strptime(
                date,
                "%Y-%m-%d"
            ).date()
        except (ValueError, TypeError):
            return Response(
                {"error": "Formato incorrecto. Use YYYY-MM-DD."},
                status=400
            )

        if rangeType == "week":
            start_date = end_date - timedelta(days=6)
        elif rangeType == "month":
            start_date = end_date.replace(day=1)
        elif rangeType == "year":
            start_date = end_date.replace(month=1, day=1)
        else:
            return Response(
                {"error": "Intervalo inválido. Use 'week', 'month' o 'year'."},
                status=400
            )

        dashboard_queryset = dashboard_queryset.filter(
            panel_id=panel,
            timestamp__date__range=[start_date, end_date]
        )
        position_queryset = position_queryset.filter(
            panel_id=panel,
            timestamp__date__range=[start_date, end_date]
        )

        results = []

        if rangeType == "week":
            current_day = start_date

            while current_day <= end_date:
                dashboard_day = dashboard_queryset.filter(
                        timestamp__date=current_day
                    )
                position_day = position_queryset.filter(
                        timestamp__date=current_day
                    )
                energy = EnergyService.calculate_energy(dashboard_day)
                avg_luminosity = dashboard_day.aggregate(
                        avg=Avg('luminosity')
                    )['avg'] or 0
                tracking_efficiency = position_day.aggregate(
                        avg=Avg('tracking_efficiency')
                    )['avg'] or 0

                results.append({
                    "date": current_day,
                    "energy": round(float(energy), 2),
                    "avg_luminosity": round(float(avg_luminosity), 2),
                    "tracking_efficiency":
                        round(float(tracking_efficiency), 2)
                })

                current_day += timedelta(days=1)

        elif rangeType == "month":
            current_day = start_date

            while current_day <= end_date:
                dashboard_day = dashboard_queryset.filter(
                        timestamp__date=current_day
                    )
                position_day = position_queryset.filter(
                        timestamp__date=current_day
                    )
                energy = EnergyService.calculate_energy(dashboard_day)
                avg_luminosity = dashboard_day.aggregate(
                        avg=Avg('luminosity')
                    )['avg'] or 0

                tracking_efficiency = position_day.aggregate(
                        avg=Avg('tracking_efficiency')
                    )['avg'] or 0

                results.append({
                    "date": current_day,
                    "energy": round(float(energy), 2),
                    "avg_luminosity": round(float(avg_luminosity), 2),
                    "tracking_efficiency":
                        round(float(tracking_efficiency), 2)
                })

                current_day += timedelta(days=1)

        elif rangeType == "year":

            for month in range(1, 13):
                dashboard_month = dashboard_queryset.filter(
                        timestamp__year=end_date.year,
                        timestamp__month=month
                    )
                position_month = position_queryset.filter(
                        timestamp__year=end_date.year,
                        timestamp__month=month
                    )
                energy = EnergyService.calculate_energy(dashboard_month)
                avg_luminosity = dashboard_month.aggregate(
                        avg=Avg('luminosity')
                    )['avg'] or 0
                tracking_efficiency = position_month.aggregate(
                        avg=Avg('tracking_efficiency')
                    )['avg'] or 0

                results.append({
                    "date": f"{end_date.year}-{month:02d}",
                    "energy": round(float(energy), 2),
                    "avg_luminosity": round(float(avg_luminosity), 2),
                    "tracking_efficiency":
                        round(float(tracking_efficiency), 2)
                })

        return Response(results)


class DeleteMyUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(
            {"detail": "User deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )