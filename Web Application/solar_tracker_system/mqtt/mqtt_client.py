import json
import os
import paho.mqtt.client as mqtt
import time
from dotenv import load_dotenv
from django.contrib.auth import get_user_model
from django.utils import timezone
from solar_tracker_system.models import SolarPanel
from solar_tracker_system.mqtt.topics import MQTT_TOPICS
from solar_tracker_system.services.sun_service import SunService
from .handlers import (
    save_dashboard_data,
    save_panel_position,
    save_location
)



# Load environment variables
load_dotenv()
BROKER = os.getenv('MQTT_BROKER')
PORT = int(os.getenv('MQTT_PORT', 1883))
client = mqtt.Client()

User = get_user_model()


def parse_payload(payload):
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def publish(topic, payload):
    client.publish(topic, payload)


def validate_mqtt_context(user_id, panel_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None, None, "User not found"

    try:
        panel = SolarPanel.objects.get(id=panel_id)
    except SolarPanel.DoesNotExist:
        return None, None, "Panel not found"

    if panel.user_id != user.id:
        return None, None, "Panel does not belong to user"

    return user, panel, None


# CONNECT EVENT
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT connected successfully")

        for topic in MQTT_TOPICS:
            client.subscribe(topic)
            print(f"📡 Subscribed to {topic}")

    else:
        print(f"❌ MQTT connection failed with code {rc}")


def on_message(client, userdata, msg):
    print("MESSAGE RECEIVED")
    try: 
        topic = msg.topic
        payload = msg.payload.decode("utf-8")
        print(topic)
    except Exception as e:
        print("Error", str(e))

    try:
        _, user_id, panel_id, data_type = topic.split("/")
    except ValueError:
        print("❌ Invalid topic format")
        return

    # 🔐 SECURITY CHECK
    user, panel, error = validate_mqtt_context(user_id, panel_id)

    if error:
        print(f"🚨 Security blocked message: {error}")
        return
    
    panel = SolarPanel.objects.get(id=panel_id)
    panel.last_seen = timezone.now()
    panel.save(update_fields=["last_seen"])

    if SunService.is_daytime():
        if data_type == "dashboard":
            datas = parse_payload(payload)
            for key, value in datas.items():
                if key == "data":
                    save_dashboard_data(value, user_id=user_id, panel_id=panel_id)
                elif key == "position":
                    save_panel_position(value, user_id=user_id, panel_id=panel_id)
                elif key == "location":
                    save_location(value, user_id=user_id, panel_id=panel_id)
                else:
                    print(f"⚠️ Unknown type: {data_type}")
        elif data_type == "info":
            publish(f"solar/{panel}/sunservice", json.dumps(
                SunService.get_sun_times()
            ))
    else:
        print(f"❌ It's Night - data ignored")


def on_disconnect(client, userdata, rc):
    print("⚠️ MQTT disconnected, trying to reconnect...")


# START MQTT CLIENT
def start():
    if not BROKER:
        raise ValueError("MQTT_BROKER not defined")

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    # 🔁 auto reconnect inteligente
    client.reconnect_delay_set(min_delay=1, max_delay=60)

    try:
        print(f"🚀 Connecting to {BROKER}:{PORT}")
        client.connect(BROKER, PORT, 60)

        client.loop_start()

        while True:
            time.sleep(1)

    except Exception as e:
        print(f"❌ Fatal MQTT error: {e}")