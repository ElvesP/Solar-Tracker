from django.db import models
from django.conf import settings
import uuid


# BASE MODEL
class BaseModel(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


# SOLAR PANEL
class SolarPanel(BaseModel):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solar_panels'
    )
    name = models.CharField(max_length=100)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='offline'
    )

    class Meta:
        verbose_name = 'Solar Panel'
        verbose_name_plural = 'Solar Panels'

    def __str__(self):
        return self.name


# DASHBOARD DATA (IoT readings)
class DashboardData(BaseModel):
    panel = models.ForeignKey(
        SolarPanel,
        on_delete=models.CASCADE,
        related_name='dashboard_data',
        db_index=True
    )
    voltage = models.DecimalField(max_digits=10, decimal_places=2)
    current = models.DecimalField(max_digits=10, decimal_places=2)
    luminosity = models.DecimalField(max_digits=10, decimal_places=2)
    power = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Dashboard Data'
        verbose_name_plural = 'Dashboard Data'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['panel', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.panel.name} - {self.timestamp}"


# PANEL POSITION
class PanelPosition(BaseModel):
    MODE_CHOICES = [
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
    ]
    panel = models.ForeignKey(
        SolarPanel,
        on_delete=models.CASCADE,
        related_name='positions',
        db_index=True
    )
    theoretical_azimuth = models.DecimalField(
        max_digits=8, decimal_places=2)
    actual_azimuth = models.DecimalField(
        max_digits=8, decimal_places=2)
    theoretical_elevation = models.DecimalField(
        max_digits=8, decimal_places=2)
    actual_elevation = models.DecimalField(
        max_digits=8, decimal_places=2)
    tracking_efficiency = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0)
    mode = models.CharField(
        max_length=20, choices=MODE_CHOICES, default='automatic')

    class Meta:
        verbose_name = 'Panel Position'
        verbose_name_plural = 'Panel Positions'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.panel.name} - {self.mode}"


# LOCATION
class Location(BaseModel):
    panel = models.ForeignKey(
        SolarPanel,
        on_delete=models.CASCADE,
        related_name='locations',
        db_index=True
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    class Meta:
        verbose_name = 'Location'
        verbose_name_plural = 'Locations'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.latitude}, {self.longitude}"


class DailyData(BaseModel):
    panel = models.ForeignKey(
        SolarPanel,
        on_delete=models.CASCADE,
        related_name='daily_data',
        db_index=True
    )
    date = models.DateField()
    energy_generated = models.DecimalField(max_digits=10, decimal_places=2)
    avg_tracking_efficiency = models.DecimalField(
        max_digits=5, decimal_places=2)

    class Meta:
        verbose_name = 'Daily Data'
        verbose_name_plural = 'Daily Data'
        ordering = ['-date']
        unique_together = ('panel', 'date')

    def __str__(self):
        return f"{self.panel.name} - {self.date}"