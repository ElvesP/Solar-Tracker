import json
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    Location
)
from solar_tracker_system.services.energy_service import EnergyService
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()


def parse_payload(payload):
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except ObjectDoesNotExist:
        return None


def get_panel(panel_id):
    try:
        return SolarPanel.objects.get(id=panel_id)
    except ObjectDoesNotExist:
        return None


def validate_access(user_id, panel):

    if not panel:
        return False

    return str(panel.user_id) == str(user_id)


def save_dashboard_data(data, user_id, panel_id):
    user = get_user(user_id)
    panel = get_panel(panel_id)

    if not data:
        return {"error": "Invalid data"}

    if not user:
        return {"error": "User not found"}

    if not panel:
        return {"error": "Panel not found"}

    if not validate_access(user_id, panel):
        return {"error": "Unauthorized access to panel"}

    required_fields = [
        'voltage', 
        'current', 
        'luminosity'
    ]

    if not all(field in data for field in required_fields):
        return {"error": "Missing fields"}

    obj = DashboardData.objects.create(
        panel=panel,
        voltage=data['voltage'],
        current=data['current'],
        luminosity=data['luminosity'],
        power=EnergyService.calculate_power(
            data['voltage'], data['current'])
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"dashboard_panel_{panel_id}",
        {
            'type': 'send_dashboard_data',
            'data': {
                'voltage': obj.voltage,
                'current': obj.current,
                'luminosity': obj.luminosity,
                'power': obj.power,
                'timestamp': obj.timestamp.isoformat()
            }
        }
    )

    return {"success": True}


def save_panel_position(data, user_id, panel_id):
    user = get_user(user_id)
    panel = get_panel(panel_id)

    if not data:
        return {"error": "Invalid data"}

    if not user:
        return {"error": "User not found"}

    if not panel:
        return {"error": "Panel not found"}

    if not validate_access(user_id, panel):
        return {"error": "Unauthorized access"}

    required_fields = [
        'theoretical_azimuth',
        'actual_azimuth',
        'theoretical_elevation',
        'actual_elevation'
    ]

    if not all(field in data for field in required_fields):
        return {"error": "Missing fields"}

    obj = PanelPosition.objects.create(
        panel=panel,
        theoretical_azimuth=data['theoretical_azimuth'],
        actual_azimuth=data['actual_azimuth'],
        theoretical_elevation=data['theoretical_elevation'],
        actual_elevation=data['actual_elevation'],
        tracking_efficiency=EnergyService.calculate_tracking_efficiency(
            data['theoretical_azimuth'], data['theoretical_elevation'],
            data['actual_azimuth'], data['actual_elevation']
        )
    )


    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"dashboard_panel_{panel_id}",
        {
            'type': 'send_panel_position',
            'data': {
                'theoretical_azimuth': obj.theoretical_azimuth,
                'actual_azimuth': obj.actual_azimuth,
                'theoretical_elevation': obj.theoretical_elevation,
                'actual_elevation': obj.actual_elevation,
                'tracking_efficiency': obj.tracking_efficiency,
                'timestamp': obj.timestamp.isoformat()
            }
        }
    )

    return {"success": True}


def save_location(data, user_id, panel_id):
    user = get_user(user_id)
    panel = get_panel(panel_id)
    
    if not data:
        return {"error": "Invalid data"}

    if not user:
        return {"error": "User not found"}

    if not panel:
        return {"error": "Panel not found"}

    if not validate_access(user_id, panel):
        return {"error": "Unauthorized access to panel"}

    if 'latitude' not in data or 'longitude' not in data:
        return {"error": "Missing coordinates"}
    
    last_position = Location.objects.filter(
        panel=panel
    ).order_by('-timestamp').first()

    if last_position:
        save_locate = Decimal(last_position.latitude) != Decimal(data['latitude']) or Decimal(last_position.longitude) != Decimal(data['longitude'])
    else:
        save_locate = True

    if save_locate:
        obj = Location.objects.create(
            panel=panel,
            latitude=data['latitude'],
            longitude=data['longitude']
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"dashboard_panel_{panel_id}",
            {
                'type': 'send_location',
                'data': {
                    'latitude': obj.latitude,
                    'longitude': obj.longitude,
                    'timestamp': obj.timestamp.isoformat(),
                }
            }
        )

    return {"success": True}


def send_solar_control(user_id, panel_id):
    data = {
        "action": "MOVE",
        "mode": "automatic",
        "azimuth": 120,
        "elevation": 35,
    }
