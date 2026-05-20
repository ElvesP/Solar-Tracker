import requests
from datetime import datetime
from django.utils.timezone import make_aware
from zoneinfo import ZoneInfo


class SunService:

    LATITUDE = -25.9692
    LONGITUDE = 32.5732
    TIMEZONE = "Africa/Maputo"

    @classmethod
    def get_sun_times(cls):

        url = (
            "https://api.sunrise-sunset.org/json"
            f"?lat={cls.LATITUDE}"
            f"&lng={cls.LONGITUDE}"
            "&formatted=0"
        )

        response = requests.get(url)

        data = response.json()["results"]

        sunrise_utc = datetime.fromisoformat(
            data["sunrise"].replace("Z", "+00:00")
        )

        sunset_utc = datetime.fromisoformat(
            data["sunset"].replace("Z", "+00:00")
        )

        # Converter para hora local
        tz = ZoneInfo(cls.TIMEZONE)

        sunrise_local = sunrise_utc.astimezone(tz)
        sunset_local = sunset_utc.astimezone(tz)

        return {
            "sunrise": sunrise_local,
            "sunset": sunset_local
        }

    @classmethod
    def is_daytime(cls):

        sun_times = cls.get_sun_times()

        now = datetime.now(
            ZoneInfo(cls.TIMEZONE)
        )

        return (
            sun_times["sunrise"]
            <= now
            <= sun_times["sunset"]
        )