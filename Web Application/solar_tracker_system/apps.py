from django.apps import AppConfig
import threading


class SolarTrackerSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'

    name = 'solar_tracker_system'

    def ready(self):

        from .mqtt.mqtt_client import start

        mqtt_thread = threading.Thread(target=start)

        mqtt_thread.daemon = True

        mqtt_thread.start()
