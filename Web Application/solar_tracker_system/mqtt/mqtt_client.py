import os
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from solar_tracker_system.mqtt.topics import MQTT_TOPICS
from .handlers import (
    save_dashboard_data,
    save_panel_position,
    save_location
)
from django.contrib.auth import get_user_model
from solar_tracker_system.models import SolarPanel



# Load environment variables
load_dotenv()
BROKER = os.getenv('MQTT_BROKER')
PORT = int(os.getenv('MQTT_PORT', 1883))

# MESSAGE ROUTER (clean + scalable)
ROUTES = {
    "data": save_dashboard_data,
    "position": save_panel_position,
    "location": save_location,
}

User = get_user_model()


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
        payload = msg.payload.decode()

        print(topic)
        print(payload)

        payload = msg.payload.decode("utf-8")
        print(payload)
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

    handler = ROUTES.get(data_type)

    if handler:
        handler(payload, user_id=user_id, panel_id=panel_id)
    else:
        print(f"⚠️ Unknown type: {data_type}")


# START MQTT CLIENT
def start():
    if not BROKER:
        raise ValueError("MQTT_BROKER not defined in environment variables")

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        print(f"🚀 Connecting to MQTT broker {BROKER}:{PORT}")
        client.connect(BROKER, PORT, 60)
        client.loop_forever()
    except Exception as e:
        print(f"❌ MQTT startup error: {str(e)}")