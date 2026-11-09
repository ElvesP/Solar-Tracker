import pandas as pd
import pvlib

from datetime import datetime
from zoneinfo import ZoneInfo


class SolarCalculator:
    TIMEZONE = "Africa/Maputo"

    @classmethod
    def calculate_solar_position(cls, latitude, longitude, date_time=None):

        tz = ZoneInfo(cls.TIMEZONE)

        if date_time is None:
            date_time = datetime.now(tz)
        elif date_time.tzinfo is None:
            date_time = date_time.replace(tzinfo=tz)
        else:
            date_time = date_time.astimezone(tz)

        times = pd.DatetimeIndex([date_time])

        solar_position = pvlib.solarposition.get_solarposition(
            time=times,
            latitude=float(latitude),
            longitude=float(longitude),
            altitude=0,
            method="nrel_numpy"
        )

        result = solar_position.iloc[0]

        return {
            "azimuth": round(float(result["azimuth"]), 2),
            "elevation": round(float(result["elevation"]), 2),
            "apparent_elevation": round(
                float(result["apparent_elevation"]), 2
            )
        }

    @classmethod
    def calculate_sunrise_sunset(
        cls, latitude, longitude, date=None
    ):

        tz = ZoneInfo(cls.TIMEZONE)

        if date is None:
            date = datetime.now(tz).date()

        midnight = datetime.combine(
            date,
            datetime.min.time(),
            tzinfo=tz
        )

        times = pd.DatetimeIndex([midnight])

        solar_events = (
            pvlib.solarposition.sun_rise_set_transit_spa(
                times=times,
                latitude=float(latitude),
                longitude=float(longitude)
            )
        )

        result = solar_events.iloc[0]

        sunrise = result["sunrise"]
        sunset = result["sunset"]
        solar_noon = result["transit"]

        return {
            "sunrise": sunrise.to_pydatetime(),
            "sunset": sunset.to_pydatetime(),
            "solar_noon": solar_noon.to_pydatetime()
        }