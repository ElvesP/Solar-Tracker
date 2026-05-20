import json
from channels.generic.websocket import AsyncWebsocketConsumer


class DashboardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_group_name = 'dashboard'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print('WebSocket conectado')


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print('WebSocket desconectado')


    async def send_dashboard_data(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "dashboard_data",
                "data": event['data']
            })
        )

    async def send_panel_position(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "panel_position",
                "data": event['data']
            })
        )

    async def send_location(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "location",
                "data": event['data']
            })
        )