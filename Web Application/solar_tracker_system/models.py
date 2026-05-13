from django.db import models
from django.conf import settings


# PAINEL SOLAR
class Painel(models.Model):

    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]

    utilizador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='paineis'
    )

    nome = models.CharField(
        max_length=100
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='offline'
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    data_hora = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Painel'
        verbose_name_plural = 'Painéis'


    def __str__(self):
        return self.nome


# DADOS DO DASHBOARD
class DadosDashboard(models.Model):

    painel = models.ForeignKey(
        Painel,
        on_delete=models.CASCADE,
        related_name='dados_dashboard'
    )

    tensao = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    corrente = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    luminosidade = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    potencia = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    eficiencia = models.DecimalField(
        max_digits=5,
        decimal_places=2
    )

    energia = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    data_hora = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = 'Dado Dashboard'
        verbose_name_plural = 'Dados Dashboard'

        indexes = [
            models.Index(fields=['data_hora']),
        ]

        ordering = ['-data_hora']

    def __str__(self):
        return f"{self.painel.nome} - {self.data_hora}"


# POSIÇÃO DO PAINEL
class PosicaoPainel(models.Model):

    MODO_CHOICES = [
        ('automatico', 'Automático'),
        ('manual', 'Manual'),
    ]

    painel = models.ForeignKey(
        Painel,
        on_delete=models.CASCADE,
        related_name='posicoes'
    )

    azimute_teorico = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    azimute_real = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    elevacao_teorico = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    elevacao_real = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    modo = models.CharField(
        max_length=20,
        choices=MODO_CHOICES,
        default='automatico'
    )

    data_hora = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Posição do Painel'
        verbose_name_plural = 'Posições do Painel'

        ordering = ['-data_hora']

    def __str__(self):
        return f"{self.painel.nome} - {self.modo}"


# LOCALIZAÇÃO
class Localizacao(models.Model):

    painel = models.ForeignKey(
        Painel,
        on_delete=models.CASCADE,
        related_name='localizacoes'
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    data_hora = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Localização'
        verbose_name_plural = 'Localizações'

        ordering = ['-data_hora']

    def __str__(self):
        return f"{self.latitude}, {self.longitude}"