import math


class EnergyService:

    @staticmethod
    def calculate_power(voltage, current):
        return round(voltage* current, 2)

    @staticmethod
    def calculate_energy(dashboard_day):
        energy = 0

        dashboard_points = dashboard_day.order_by("timestamp")

        for i in range(1, len(dashboard_points)):
            prev = dashboard_points[i - 1]
            curr = dashboard_points[i]

            delta_seconds = (
                curr.timestamp - prev.timestamp
            ).total_seconds()

            if delta_seconds > 300:
                continue

            power = float(prev.power or 0)

            energy += power * (delta_seconds / 3600)  # Wh

        return round(energy, 2)

    @staticmethod
    def calculate_tracking_efficiency(azimuth_t, elevation_t, azimuth_r, elevation_r):
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

        return max(0.0, round(efficiency), 2)