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
        
        azimuth = math.acos( 
            ( 
                math.sin(declination_rad) 
                - 
                math.sin(elevation_rad) * math.sin(latitude_rad) 
            ) 
            / 
            ( 
                math.cos(elevation_rad) * math.cos(latitude_rad) 
            ) 
        ) 
        
        azimuth = math.degrees(azimuth)
        
        if hour_angle > 0: 
            azimuth = 180 - azimuth 
            
            return azimuth
        
        if hour_angle < 0:
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
    def calculate_solar_noon(longitude):
        now = datetime.utcnow()
        day_number = SolarCalculator.day_of_year(now)
        B = math.radians((360/365)*(day_number - 81))
        LC = (float(longitude) - 30)/15
        ET = 9.87*math.sin(2*B) - 7.53*math.cos(B) - 1.5*math.sin(B)
        solar_noon = 12 - LC - ET/60
        
        return solar_noon


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

        azimuth = azimuth - 180

        if azimuth > 90:
            azimuth = azimuth - 180

        return {
            'azimuth': round(azimuth, 2),
            'elevation': round(elevation, 2)
        }