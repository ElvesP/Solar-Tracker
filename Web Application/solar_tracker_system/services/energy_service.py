import math
from django.utils import timezone
from solar_tracker_system.models import (
    DashboardData,
    PanelPosition,
    DailyData
)
from datetime import timedelta

class EnergyService:

    @staticmethod
    def calculate_power(voltage, current):
        return round(voltage * current, 2)

    @staticmethod
    def calculate_energy(panel):
        today = timezone.localdate()
        power_data = DashboardData.objects.filter(
                panel=panel,
                timestamp__date=today
            ).order_by("timestamp")

        energy_wh = 0.0

        if power_data.exists():
            for i in range(1, len(power_data)):
                prev = power_data[i - 1]
                curr = power_data[i]
                power = prev.power
                delta_t = (
                    curr.timestamp - prev.timestamp
                ).total_seconds() / 3600
                energy_wh += power * delta_t

        return round(energy_wh, 2)

    @staticmethod
    def tracking_efficiency(azimuth_t, elevation_t, azimuth_r, elevation_r):
        phi_t = math.radians(azimuth_t)
        alpha_t = math.radians(elevation_t)

        phi_r = math.radians(azimuth_r)
        alpha_r = math.radians(elevation_r)

        st_x = math.cos(alpha_t) * math.cos(phi_t)
        st_y = math.cos(alpha_t) * math.sin(phi_t)
        st_z = math.sin(alpha_t)

        sr_x = math.cos(alpha_r) * math.cos(phi_r)
        sr_y = math.cos(alpha_r) * math.sin(phi_r)
        sr_z = math.sin(alpha_r)

        dot_product = (st_x * sr_x) + (st_y * sr_y) + (st_z * sr_z)

        dot_product = max(-1.0, min(1.0, dot_product))

        efficiency = dot_product * 100

        return max(0.0, round(efficiency, 2))


    @staticmethod
    def calculate_daily_summary(panel):
        today = timezone.localdate()
        power_data = DashboardData.objects.filter(
                panel=panel,
                timestamp__date=today
            ).order_by("timestamp")

        energy_wh = 0.0

        if power_data.exists():
            for i in range(1, len(power_data)):
                prev = power_data[i - 1]
                curr = power_data[i]
                power = prev.power
                delta_t = (
                    curr.timestamp - prev.timestamp
                ).total_seconds() / 3600
                energy_wh += power * delta_t

        tracking_data = PanelPosition.objects.filter(
            panel=panel,
            timestamp__date=today
        )
        avg_efficiency = 0

        if tracking_data.exists():
            total = sum(
                item.tracking_efficiency
                for item in tracking_data
            )
            avg_efficiency = (
                total / tracking_data.count()
            )

        DailyData.objects.create(
            panel=panel,
            date=today,
            energy_generated=round(energy_wh, 2),
            avg_tracking_efficiency=round(avg_efficiency, 2)
        )