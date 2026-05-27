import json
from channels.generic.websocket import AsyncWebsocketConsumer
from solar_tracker_system.models import SolarPanel


class DashboardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.panel_id = self.scope['url_route']['kwargs']['panel_id']

        try:
            await SolarPanel.objects.aget(id=self.panel_id)
        except:
            await self.close()
            return

        self.group_name = f"dashboard_panel_{self.panel_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print('WebSocket conectado')


    async def send_dashboard_data(self, event):
        await self.send(
            text_data=json.dumps({
                "panel": str(self.panel_id),
                "type": "dashboard_data",
                "data": event['data']
            })
        )


    async def send_panel_position(self, event):
        await self.send(
            text_data=json.dumps({
                "panel": str(self.panel_id),
                "type": "panel_position",
                "data": event['data']
            })
        )


    async def send_location(self, event):
        await self.send(
            text_data=json.dumps({
                "panel": str(self.panel_id),
                "type": "location",
                "data": event['data']
            })
        )


    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

        print('WebSocket desconectado')


    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get("type") == "ping":
            await self.send(text_data=json.dumps({
                "type": "pong"
            }))