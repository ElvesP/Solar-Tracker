from rest_framework import serializers
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    RemoteControl,
    Location
)


# SOLAR PANEL SERIALIZER
class SolarPanelSerializer(serializers.ModelSerializer):

    class Meta:
        model = SolarPanel

        fields = [
            'id',
            'name',
            'last_seen',
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# DASHBOARD DATA SERIALIZER
class DashboardDataSerializer(serializers.ModelSerializer):
    
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
class PanelPositionSerializer(serializers.ModelSerializer):
    
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
            'timestamp'
        ]

        read_only_fields = [
            'id',
            'timestamp'
        ]


# REMOTE CONTROLE SERIALIZER
class RemoteControlSerializer(serializers.ModelSerializer):

    class Meta:
        model = RemoteControl

        fields = [
            'id',
            'panel',
            'manual_azimuth',
            'manual_elevation',
            'mode',
            'timestamp'
        ]


        read_only_fields = [
            'id',
            'timestamp'
        ]


# LOCATION SERIALIZER
class LocationSerializer(serializers.ModelSerializer):

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