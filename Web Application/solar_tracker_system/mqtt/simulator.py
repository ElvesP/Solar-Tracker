import json
import os
import paho.mqtt.client as mqtt
import random
import time
from datetime import datetime
from dotenv import load_dotenv


load_dotenv()
BROKER = '10.153.200.27'
PORT = int(os.getenv('MQTT_PORT', 1883))
PANEL = "decfe0ec-3d71-4486-9f1a-15873081d0d8"
USER = "a3e58b4c-844b-43ea-a46c-897dc36414aa"
TOPICS = [
    (f"solar/{PANEL}/sunservice", 0),
    (f"solar/{PANEL}/control", 0),
]

latitude = -25.969200
longitude = 32.573200
sunset = None
sunrise = None

def print_header():
    print(" SIMULADOR MQTT ".center(70, "="))
    print()


def render_message(topic, payload):
    print("-" * 70)
    print(f"[{datetime.now().strftime('%H:%M:%S')}. TÓPICO : {topic}]")

    if topic == "sunservice":
        try:
            data = json.loads(payload)
            latitude = data["latitude"]
            longitude = data["longitude"]
            sunset = data["sunset"]
            sunrise = data["sunrise"]

            print(f"Info: [latitude: {latitude}, longitude: {longitude}, nascer do sol: {sunrise}, pôr do sol: {sunset}]")
            print("-" * 70)

            return (latitude, longitude, sunset, sunrise)
        except Exception:
            print("Formato de dados inválido")
            return (None, None, None, None)
    elif topic == "control":         
        try:
            data = json.loads(payload)

            dados = []
            for key, value in data.items():
                dados.append(f"{key}: {value}")

            print(f"DADOS  : {dados}")
        except Exception:
            print(f"RAW   : {payload}")

        print("-" * 70)
    else:
        print("Tópico inválido")


def on_connect(client, userdata, flags, rc, properties=None):
    for topic in TOPICS:
        client.subscribe(topic)

    print("[MQTT] Topicos subscrito:")

    for topic, qos in TOPICS:
        print(f"   - {topic} (QoS {qos})")

    print()


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode()

    try:
        _, panel_id, data_type = topic.split("/")
    except ValueError:
        print("❌ Invalid topic format")
        return
    
    if data_type == "sunservice":
        render_message(data_type, payload)
    elif data_type == "control":
        render_message(data_type, payload)


def start_fake_publishers(client):

    info_payload = {
        "latitude": latitude,
        "longitude": longitude
    }

    client.publish(
        f"solar/{USER}/{PANEL}/info",
        json.dumps(info_payload)
    )
    
    while True:
        dashboard_payload = {
            "data": {
                "voltage": round(random.uniform(16, 22), 2),
                "current": round(random.uniform(1, 5), 2),
                "luminosity": random.randint(100, 1000)
            },
            "position": {
                "actual_azimuth": round(random.uniform(-90, 90), 1),
                "actual_elevation": round(random.uniform(35, 90), 1)
            }
        }

        client.publish(
            f"solar/{USER}/{PANEL}/dashboard",
            json.dumps(dashboard_payload)
        )

        print("📤 Sent")
        time.sleep(10)


def main():

    print_header()

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2
    )

    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=60)

    try:
        print(f"[MQTT] Conectando ao broker {BROKER}:{PORT}...")
        client.connect(BROKER, PORT, 60)
        client.loop_start()

        start_fake_publishers(client)
    except KeyboardInterrupt:
        print("\n[MQTT] Parando simulador...")

    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
