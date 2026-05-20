import os
import threading
from django.apps import AppConfig


class SolarTrackerSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'solar_tracker_system'

    def ready(self):
        # evita duplicação do autoreload
        if os.environ.get('RUN_MAIN') != 'true':
            return
        from .mqtt.mqtt_client import start
        mqtt_thread = threading.Thread(
            target=start,
            daemon=True
        )
        mqtt_thread.start()
        print("✅ MQTT thread started")