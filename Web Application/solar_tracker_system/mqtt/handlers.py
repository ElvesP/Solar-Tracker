import json
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from solar_tracker_system.models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    RemoteControl,
    Location
)
from solar_tracker_system.services.energy_service import EnergyService
from solar_tracker_system.services.solar_calculations import SolarCalculator
from solar_tracker_system.services.decision_engine import DecisionEngine
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
        'luminosity',
        'temperature'
    ]

    if not all(field in data for field in required_fields):
        return {"error": "Missing fields"}

    obj = DashboardData.objects.create(
        panel=panel,
        voltage=data['voltage'],
        current=data['current'],
        luminosity=data['luminosity'],
        temperature=data['temperature'],
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
                'temperature': obj.temperature,
                'power': obj.power,
                'timestamp': obj.timestamp.isoformat()
            }
        }
    )

    return {"success": True}


def save_panel_position(client, data, user_id, panel_id):
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
        'actual_azimuth',
        'actual_elevation'
    ]

    if not all(field in data for field in required_fields):
        return {"error": "Missing fields"}

    last_position = Location.objects.filter(
        panel=panel
    ).order_by('-timestamp').first()

    theo_position = SolarCalculator.calculate_solar_position(
        last_position.latitude,
        last_position.longitude
    )

    obj = PanelPosition.objects.create(
        panel=panel,
        theoretical_azimuth=theo_position["azimuth"],
        actual_azimuth=data['actual_azimuth'],
        theoretical_elevation=theo_position["elevation"],
        actual_elevation=data['actual_elevation'],
        tracking_efficiency=EnergyService.calculate_tracking_efficiency(
            theo_position["azimuth"], theo_position["elevation"],
            data['actual_azimuth'], data['actual_elevation']
        )
    )

    light = DashboardData.objects.filter(
        panel=panel_id).order_by("-timestamp").first()
    control_mode = RemoteControl.objects.filter(
        panel=panel_id).order_by("-timestamp").first()

    if not control_mode or control_mode.mode == "automatic":
        decision = DecisionEngine.decide(
            light.luminosity, 
            obj.theoretical_azimuth,
            obj.actual_azimuth,
            obj.theoretical_elevation,
            obj.actual_elevation,
        )

        if decision == "standby":
            client.publish(
                f"solar/{panel_id}/control", 
                json.dumps({
                    "action": "standby",
                    "mode": "automatic",
                    "azimuth": None,
                    "elevation": 90
                }),
                qos=0
            )
        if decision == "move_panel":
            client.publish(
                f"solar/{panel_id}/control", 
                json.dumps({
                    "action": "move_panel",
                    "mode": "automatic",
                    "azimuth": obj.theoretical_azimuth,
                    "elevation": obj.theoretical_elevation
                }),
                qos=0
            )
    if control_mode.mode == "manual":
        decision = DecisionEngine.decide(
            light.luminosity, 
            control_mode.azimuth,
            obj.actual_azimuth,
            control_mode.elevation,
            obj.actual_elevation,
        )
        if decision == "standby" or decision == "move_panel":
            client.publish(
                f"solar/{panel_id}/control", 
                json.dumps({
                    "action": "move_panel",
                    "mode": control_mode.mode,
                    "azimuth": float(control_mode.azimuth),
                    "elevation": float(control_mode.elevation)
                }),
                qos=0
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