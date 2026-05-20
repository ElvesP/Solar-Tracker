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
    voltage = round(random.uniform(16, 22), 2)
    current = round(random.uniform(1, 5), 2)
    payload1 = {
        #data
        "voltage": voltage,
        "current": current,
        "luminosity": random.randint(100, 1000),
        "power": round(voltage * current, 2),
        "energy": round(random.uniform(0.1, 5), 2),
    }

    payload2 = {
        # position
        "theoretical_azimuth": 120,
        "actual_azimuth": 118,
        "theoretical_elevation": 45,
        "actual_elevation": 44,
        "mode": "automatic",
    }

    payload3 = {
         # GPS
        "latitude": -25.96,
        "longitude": 32.58
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