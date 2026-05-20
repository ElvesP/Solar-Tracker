from rest_framework import serializers
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    Location,
    DailyData
)


# SOLAR PANEL SERIALIZER
class SolarPanelSerializer(
    serializers.ModelSerializer):

    class Meta:
        model = SolarPanel

        fields = [
            'id',
            'name',
            'status',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# DASHBOARD DATA SERIALIZER
class DashboardDataSerializer(
    serializers.ModelSerializer):
    
    class Meta:
        model = DashboardData
        fields = [
            'id',
            'panel',
            'voltage',
            'current',
            'luminosity',
            'power',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# PANEL POSITION SERIALIZER
class PanelPositionSerializer(
    serializers.ModelSerializer):
    
    class Meta:
        model = PanelPosition

        fields = [
            'id',
            'panel',
            'theoretical_azimuth',
            'actual_azimuth',
            'theoretical_elevation',
            'actual_elevation',
            'tracking_efficiency',
            'mode',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# LOCATION SERIALIZER
class LocationSerializer(
    serializers.ModelSerializer):

    class Meta:
        model = Location

        fields = [
            'id',
            'panel',
            'latitude',
            'longitude',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# DAILY DATA SERIALIZER
class DailyDataSerializer(
    serializers.ModelSerializer):
    
    class Meta:
        model = DailyData

        fields = [
            'id',
            'panel',
            'date',
            'energy_generated',
            'avg_tracking_efficiency',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]