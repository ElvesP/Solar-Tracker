import json

from solar_tracker_system.models import (
    Painel,
    DadosDashboard,
    PosicaoPainel,
    Localizacao
)


def salvar_dados_dashboard(payload):
    data = json.loads(payload)
    painel = Painel.objects.get(id=data['id_painel'])
    DadosDashboard.objects.create(
        painel=painel,
        tensao=data['tensao'],
        corrente=data['corrente'],
        luminosidade=data['luminosidade'],
        potencia=data['potencia'],
        eficiencia=data['eficiencia'],
        energia=data['energia']
    )


def salvar_posicao(payload):
    data = json.loads(payload)
    painel = Painel.objects.get(id=data['id_painel'])
    PosicaoPainel.objects.create(
        painel=painel,
        azimute_teorico=data['azimute_teorico'],
        azimute_real=data['azimute_real'],
        elevacao_teorico=data['elevacao_teorico'],
        elevacao_real=data['elevacao_real'],
        modo=data['modo']
    )


def salvar_localizacao(payload):
    data = json.loads(payload)
    painel = Painel.objects.get(id=data['id_painel'])
    Localizacao.objects.create(
        painel=painel,
        latitude=data['latitude'],
        longitude=data['longitude']
    )