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
    payload1 = {
        #data
        "voltage": round(random.uniform(16, 22), 2),
        "current": round(random.uniform(1, 5), 2),
        "luminosity": random.randint(100, 1000)
    }

    payload2 = {
        # position
        "theoretical_azimuth": round(random.uniform(99, 150), 1),
        "actual_azimuth": round(random.uniform(99, 150), 1),
        "theoretical_elevation": round(random.uniform(35, 90), 1),
        "actual_elevation": round(random.uniform(35, 90), 1),
        "mode": "automatic"
    }

    payload3 = {
         # GPS
        "latitude": round(random.uniform(-25.96, -25.95), 6),
        "longitude": round(random.uniform(32.57, 32.58), 6)
    }

    # Publish
    client.publish(
        "solar/1/2f651e64-2d02-490b-b4cc-0cb27ae28c8a/data",
        json.dumps(payload1)
    )
    client.publish(
        "solar/1/2f651e64-2d02-490b-b4cc-0cb27ae28c8a/position",
        json.dumps(payload2)
    )
    client.publish(
        "solar/1/2f651e64-2d02-490b-b4cc-0cb27ae28c8a/location",
        json.dumps(payload3)
    )

    print("📤 Sent:")

    time.sleep(10)