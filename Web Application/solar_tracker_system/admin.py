from django.contrib import admin
from .models import (
    Painel,
    DadosDashboard,
    PosicaoPainel,
    Localizacao
)


# Register your models here.
@admin.register(Painel)
class PainelAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nome',
        'utilizador',
        'status',
        'data_hora'
    )


@admin.register(DadosDashboard)
class DadosDashboardAdmin(admin.ModelAdmin):
        list_display = (
        'painel',
        'tensao',
        'corrente',
        'potencia',
        'eficiencia',
        'energia',
        'data_hora'
    )


@admin.register(PosicaoPainel)
class PosicaoPainelAdmin(admin.ModelAdmin):

    list_display = (
        'painel',
        'azimute_real',
        'elevacao_real',
        'modo',
        'data_hora'
    )


@admin.register(Localizacao)
class LocalizacaoAdmin(admin.ModelAdmin):
    list_display = (
        'painel',
        'latitude',
        'longitude',
        'data_hora'
    )