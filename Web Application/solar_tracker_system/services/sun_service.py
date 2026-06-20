import requests
from decimal import Decimal
from datetime import datetime, time
from django.utils import timezone
from math import radians
from solar_tracker_system.models import ( SolarPanel, Location )
from solar_tracker_system.services.solar_calculations import SolarCalculator
from zoneinfo import ZoneInfo
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class SunService:
    TIMEZONE = "Africa/Maputo"

    @classmethod
    def update_if_needed(cls, panel_id, data):
        LOCATION_THRESHOLD = 0.01

        if not data:
            return {"error": "Invalid data"}
    
        if 'latitude' not in data or 'longitude' not in data:
            return {"error": "Missing coordinates"}

        last_location = (
            Location.objects.filter(panel=panel_id)
            .order_by("-timestamp")
            .first()
        )

        today = timezone.localdate()

        if not last_location:
            cls.recalculate(panel_id, data)
            return

        day_changed = (
            last_location.timestamp.date() != today
        )

        location_changed = (
            abs(Decimal(data["latitude"]) - last_location.latitude) > LOCATION_THRESHOLD
            or
            abs(Decimal(data["longitude"]) - last_location.longitude) > LOCATION_THRESHOLD
        )

        if day_changed or location_changed:
            cls.recalculate(panel_id, data)
            return


    @classmethod
    def recalculate(cls, panel_id, data):
        panel = SolarPanel.objects.get(id=panel_id)

        if not panel:
            return

        sun_times = cls.calculate(
            data["latitude"],
            data["longitude"]
        )

        obj = Location.objects.create(
            panel=panel,
            latitude=data["latitude"],
            longitude=data["longitude"],
            sunrise=sun_times["sunrise"],
            sunset=sun_times["sunset"]
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"dashboard_panel_{panel_id}",
            {
                'type': 'send_location',
                'data': {
                    'latitude': obj.latitude,
                    'longitude': obj.longitude,
                    'sunrise': obj.sunrise,
                    'sunset': obj.sunset,
                    'timestamp': obj.timestamp.isoformat(),
                }
            }
        )


    @classmethod
    def calculate(cls, latitude, longitude):
        tz = ZoneInfo(cls.TIMEZONE)
        now = datetime.now(tz)
        day_number = SolarCalculator.day_of_year(now)
        declination = SolarCalculator.solar_declination(day_number)
        solar_altitude = -0.8333

        latitude_rad = radians(latitude)
        declination_rad = radians(declination)
        altitude_rad = radians(solar_altitude)

        h0 = SolarCalculator.calculate_sunrise_sunset(altitude_rad, latitude_rad, declination_rad)
        solar_noon = SolarCalculator.calculate_solar_time(day_number, longitude)

        daylight_offset = h0 / 15

        sunrise_hour = solar_noon - daylight_offset
        sunset_hour = solar_noon + daylight_offset

        sunrise = cls.decimal_hour_to_datetime(
            sunrise_hour,
            now,
            tz
        )

        sunset = cls.decimal_hour_to_datetime(
            sunset_hour,
            now,
            tz
        )

        return {
            "sunrise": sunrise,
            "sunset": sunset
        }


    @staticmethod
    def decimal_hour_to_datetime(hour_decimal, date, tz):
        hours = int(hour_decimal)
        minutes_decimal = (
            hour_decimal - hours
        ) * 60
        minutes = int(minutes_decimal)
        seconds = int(
            (minutes_decimal - minutes) * 60
        )

        return datetime.combine(
            date.date(),
            time(
                hour=hours,
                minute=minutes,
                second=seconds
            ),
            tz
        ).isoformat()
    

    @classmethod
    def get_sun_times(cls, panel_id):
        current = (
            Location.objects.filter(panel=panel_id)
            .order_by("-timestamp")
            .first()
        )

        if not current:
            return None

        return {
            "sunrise": current.sunrise,
            "sunset": current.sunset
        }


    @classmethod
    def is_daytime(cls, panel_id):
        sun_times = cls.get_sun_times(panel_id)

        if not sun_times:
            return False

        now = datetime.now(
            ZoneInfo(cls.TIMEZONE)
        )

        return (
            sun_times["sunrise"]
            <= now
            <= sun_times["sunset"]
        )