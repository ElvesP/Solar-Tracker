import os
import json
import random
import time
import paho.mqtt.client as mqtt
from dotenv import load_dotenv


# =========================
# MQTT SETUP
# =========================
load_dotenv()
BROKER = os.getenv('MQTT_BROKER')
PORT = int(os.getenv('MQTT_PORT', 1883))
client = mqtt.Client()
client.connect('localhost', PORT, 60)
client.loop_start()


# =========================
# SIMULATION LOOP
# =========================
while True:
    payload = {
        "data": {
            "voltage": round(random.uniform(16, 22), 2),
            "current": round(random.uniform(1, 5), 2),
            "luminosity": random.randint(100, 1000)
        },
        "position": {
            "theoretical_azimuth": round(random.uniform(99, 150), 1),
            "actual_azimuth": round(random.uniform(99, 150), 1),
            "theoretical_elevation": round(random.uniform(35, 90), 1),
            "actual_elevation": round(random.uniform(35, 90), 1),
        },
        "location": {
            "latitude": -25.969200,
            "longitude": 32.573200
        }
    }

    # Publish
    client.publish(
        "solar/a3e58b4c-844b-43ea-a46c-897dc36414aa/decfe0ec-3d71-4486-9f1a-15873081d0d8/dashboard",
        json.dumps(payload)
    )

    print("📤 Sent:")

    time.sleep(10)