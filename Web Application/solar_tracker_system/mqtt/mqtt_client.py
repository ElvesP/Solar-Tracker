import os
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from .topics import MQTT_TOPICS
from .handlers import (
    salvar_dados_dashboard,
    salvar_posicao,
    salvar_localizacao
)

BROKER = os.getenv('MQTT_BROKER')
PORT = int(os.getenv('MQTT_PORT'))


def on_connect(client, userdata, flags, rc):
    print('Conectado ao broker MQTT')
    for topic in MQTT_TOPICS:
        client.subscribe(topic)


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode()
    print(topic)
    print(payload)

    if topic == 'solar/painel/dados':
        salvar_dados_dashboard(payload)
    elif topic == 'solar/painel/posicao':
        salvar_posicao(payload)
    elif topic == 'solar/painel/localizacao':
        salvar_localizacao(payload)



def start():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, PORT, 60)
    client.loop_forever()