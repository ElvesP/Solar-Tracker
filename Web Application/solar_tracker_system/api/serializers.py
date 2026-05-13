from rest_framework import serializers
from solar_tracker_system.models import (
    Painel,
    DadosDashboard,
    PosicaoPainel,
    Localizacao
)


class PainelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Painel
        fields = '__all__'


class DadosDashboardSerializer(serializers.ModelSerializer):

    class Meta:
        model = DadosDashboard
        fields = '__all__'


class PosicaoPainelSerializer(serializers.ModelSerializer):

    class Meta:
        model = PosicaoPainel
        fields = '__all__'


class LocalizacaoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Localizacao
        fields = '__all__'