from rest_framework import viewsets
from solar_tracker_system.models import (
    Painel,
    DadosDashboard,
    PosicaoPainel,
    Localizacao
)
from .serializers import (
    PainelSerializer,
    DadosDashboardSerializer,
    PosicaoPainelSerializer,
    LocalizacaoSerializer
)


class PainelViewSet(viewsets.ModelViewSet):

    queryset = Painel.objects.all()
    serializer_class = PainelSerializer


class DadosDashboardViewSet(viewsets.ModelViewSet):

    queryset = DadosDashboard.objects.all()
    serializer_class = DadosDashboardSerializer


class PosicaoPainelViewSet(viewsets.ModelViewSet):

    queryset = PosicaoPainel.objects.all()
    serializer_class = PosicaoPainelSerializer


class LocalizacaoViewSet(viewsets.ModelViewSet):

    queryset = Localizacao.objects.all()
    serializer_class = LocalizacaoSerializer