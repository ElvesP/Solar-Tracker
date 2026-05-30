from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    RemoteControl,
    Location
)
from solar_tracker_system.services.energy_service import EnergyService
from .serializers import (
    SolarPanelSerializer,
    DashboardDataSerializer,
    PanelPositionSerializer,
    RemoteControlSerializer,
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

        if panel:
            queryset = queryset.filter(
                panel_id=panel)
            
        if date:
            queryset = queryset.filter(
                timestamp__date=date)

        return queryset


    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(
            self.get_queryset()
        )
        response = []
        previous = None

        for obj in queryset:
            if previous:
                gap = (
                    obj.timestamp -
                    previous.timestamp
                )

                if gap.total_seconds() > 300:
                    response.append({
                        "id": obj.id,
                        "voltage": None,
                        "current": None,
                        "power": None,
                        "luminosity": None,
                        "timestamp": (
                            previous.timestamp +
                            timedelta(minutes=1)
                        ).isoformat(),
                    })

            response.append({
                "id": obj.id,
                "voltage": obj.voltage,
                "current": obj.current,
                "luminosity": obj.luminosity,
                "power": obj.power,
                "timestamp": obj.timestamp.isoformat(),
            })
            previous = obj

        return Response(response)


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

        if panel:
            queryset = queryset.filter(
                panel_id=panel)
            
        if date:
            queryset = queryset.filter(
                timestamp__date=date)

        return queryset
    

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(
            self.get_queryset()
        )
        response = []
        previous = None

        for obj in queryset:
            if previous:
                gap = (
                    obj.timestamp -
                    previous.timestamp
                )

                if gap.total_seconds() > 300:
                    response.append({
                        "id": obj.id,
                        "theoretical_azimuth": None,
                        "actual_azimuth": None,
                        "theoretical_elevation": None,
                        "actual_elevation": None,
                        "tracking_efficiency": None,
                        "timestamp": (
                            previous.timestamp +
                            timedelta(minutes=1)
                        ).isoformat()
                    })

            # dado real
            response.append({
                "id": obj.id,
                "theoretical_azimuth": obj.theoretical_azimuth,
                "actual_azimuth": obj.actual_azimuth,
                "theoretical_elevation": obj.theoretical_elevation,
                "actual_elevation": obj.actual_elevation,
                "tracking_efficiency": obj.tracking_efficiency,
                "timestamp": obj.timestamp.isoformat()
            })

            previous = obj

        return Response(response)
        

# REMOTE CONTROL VIEWSET
class RemoteControlViewSet(viewsets.ModelViewSet):
    serializer_class = RemoteControlSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = RemoteControl.objects.filter(
            panel__user=self.request.user
        ).order_by('timestamp')
        panel = self.request.query_params.get('panel')

        if panel:
            queryset = queryset.filter(
                panel_id=panel)

        return queryset


    def perform_create(self, serializer):
        panel_id = self.request.data.get('panel')
        mode = self.request.data.get('mode')

        panel = get_object_or_404(
            SolarPanel,
            id=panel_id,
            user=self.request.user
        )

        last_position = RemoteControl.objects.filter(
            panel=panel
        ).order_by('-timestamp').first()

        default_values = {
            "manual_azimuth": 0.0,
            "manual_elevation": 0.0,
            "mode": "initial",
        }

        if last_position:
            defaults = {
                "manual_azimuth": last_position.manual_azimuth,
                "manual_elevation": last_position.manual_elevation,
                "mode": last_position.mode,
            }
        else:
            defaults = default_values

        if mode == "manual":
            manual_az = self.request.data.get('manual_azimuth')
            manual_el = self.request.data.get('manual_elevation')

            save_decision = defaults["mode"] != mode or defaults["manual_azimuth"] != Decimal(manual_az) or defaults["manual_elevation"] != Decimal(manual_el)
            if save_decision:
                serializer.save(
                    panel=panel,
                    manual_azimuth=manual_az,
                    manual_elevation=manual_el,
                    mode=mode
                )
            else:
                raise ValidationError("Dados anteriores iguais.")

        elif mode == "automatic":
            if defaults["mode"] != mode:
                serializer.save(
                    panel=panel,
                    manual_azimuth=Decimal(0.0),
                    manual_elevation=Decimal(0.0),
                    mode=mode
                )
            else:
                raise ValidationError("Dados anteriores iguais.")

        else:
            raise ValidationError("Modo inválido. Use 'manual' ou 'automatic'.")

    

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

        if panel:
            queryset = queryset.filter(
                panel_id=panel)
            
        if date:
            queryset = queryset.filter(
                timestamp__date=date)

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