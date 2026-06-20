import math
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo


class SolarCalculator:

    @staticmethod
    def day_of_year(date):
        return date.timetuple().tm_yday


    @staticmethod
    def solar_declination(day_number):
        declination = math.asin(
            - math.sin(math.radians(23.45)) * math.cos(
                math.radians(
                    (360 / 365.25) * (10 + day_number)
                )
            )
        )
        return math.degrees(declination)


    @staticmethod
    def solar_time(local_time, longitude):
        return (
            Decimal(str(local_time.hour))
            + Decimal(str(local_time.minute)) / 60
            + Decimal(str(local_time.second)) / 3600
            + Decimal(str(longitude)) / 15
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
        hour_angle_rad = math.radians(hour_angle)
        
        azimuth = math.atan2(
            math.sin(hour_angle_rad),
            (
                math.cos(hour_angle_rad) * math.sin(latitude_rad)
                -
                math.tan(declination_rad) * math.cos(latitude_rad)
            )
        )

        azimuth = (
            math.degrees(azimuth)
            + 180
        ) % 360

        return azimuth


    @staticmethod
    def calculate_sunrise_sunset(
        altitude_rad, 
        latitude_rad, 
        declination_rad
    ):
        cos_h0 = (
            (
                math.sin(altitude_rad)
                - math.sin(latitude_rad) * math.sin(declination_rad)
            )
            /
            (
                math.cos(latitude_rad)
                * math.cos(declination_rad)
            )
        )

        cos_h0 = max(-1.0, min(1.0, cos_h0))

        h0 = math.degrees(math.acos(cos_h0))

        return h0


    @staticmethod
    def calculate_solar_time(day_number, longitude, time = 12):
        B = math.radians((360/365)*(day_number - 81))
        LC = (float(longitude) - 30)/15
        ET = 229.18 * ( 
                    0.000075 + 0.001868 * math.cos(B) - 
                    0.032077 * math.sin(B) - 
                    0.014615 * math.cos(2*B) +
                    0.04089 * math.sin(2*B)
                )
        solar_time = time - LC - ET/60
        
        return solar_time


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
        decimal_hour = SolarCalculator.solar_time(
            now,
            longitude
        )
        solar_hour = SolarCalculator.calculate_solar_time(
            day_number, longitude, decimal_hour
        )
        solar_hour_angle = SolarCalculator.hour_angle(
            solar_hour
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

        """
        azimuth = azimuth - 180

        if azimuth > 90:
            azimuth = azimuth - 180
        """

        return {
            'azimuth': round(azimuth, 2),
            'elevation': round(elevation, 2)
        }