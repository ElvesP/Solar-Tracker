import math
from datetime import datetime


class SolarCalculator:

    @staticmethod
    def day_of_year(date):

        return date.timetuple().tm_yday


    @staticmethod
    def solar_declination(day_number):

        return 23.45 * math.sin(
            math.radians(
                (360 / 365) * (284 + day_number)
            )
        )


    @staticmethod
    def hour_angle(decimal_hour):

        return 15 * (decimal_hour - 12)


    @staticmethod
    def calculate_elevation(
        latitude,
        declination,
        hour_angle
    ):

        latitude_rad = math.radians(latitude)
        declination_rad = math.radians(declination)
        hour_angle_rad = math.radians(hour_angle)

        elevation = math.asin(
            math.sin(latitude_rad) * math.sin(declination_rad)
            +
            math.cos(latitude_rad)
            * math.cos(declination_rad)
            * math.cos(hour_angle_rad)
        )

        return math.degrees(elevation)


    @staticmethod
    def calculate_azimuth(
        latitude,
        declination,
        elevation,
        hour_angle
    ):

        latitude_rad = math.radians(latitude)
        declination_rad = math.radians(declination)
        elevation_rad = math.radians(elevation)

        azimuth = math.acos(
            (
                math.sin(declination_rad)
                -
                math.sin(elevation_rad)
                * math.sin(latitude_rad)
            )
            /
            (
                math.cos(elevation_rad)
                * math.cos(latitude_rad)
            )
        )

        azimuth = math.degrees(azimuth)

        if hour_angle > 0:
            azimuth = 360 - azimuth

        return azimuth


    @staticmethod
    def calculate_solar_position(
        latitude,
        longitude
    ):

        now = datetime.utcnow()

        day_number = SolarCalculator.day_of_year(now)

        declination = SolarCalculator.solar_declination(
            day_number
        )

        decimal_hour = (
            now.hour
            + now.minute / 60
            + now.second / 3600
        )

        solar_hour_angle = SolarCalculator.hour_angle(
            decimal_hour
        )

        elevation = SolarCalculator.calculate_elevation(
            latitude,
            declination,
            solar_hour_angle
        )

        azimuth = SolarCalculator.calculate_azimuth(
            latitude,
            declination,
            elevation,
            solar_hour_angle
        )

        return {
            'azimuth': round(azimuth, 2),
            'elevation': round(elevation, 2)
        }