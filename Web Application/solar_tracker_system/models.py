import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser



#USER MODEL
class CustomUser(AbstractUser):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)


# BASE MODEL
class BaseModel(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


# SOLAR PANEL
class SolarPanel(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solar_panels'
    )
    name = models.CharField(max_length=100)
    last_seen = models.DateTimeField(null=True, blank=True)

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
        get_latest_by = 'timestamp' 
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
        max_digits=5, decimal_places=2)

    class Meta:
        get_latest_by = 'timestamp'
        verbose_name = 'Panel Position'
        verbose_name_plural = 'Panel Positions'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.panel.name} - {self.timestamp}"


#REMOTE CONTROL
class RemoteControl(BaseModel):
    MODE_CHOICES = [
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
    ]
    panel = models.ForeignKey(
        SolarPanel,
        on_delete=models.CASCADE,
        related_name='remote_controls',
        db_index=True
    )
    manual_azimuth = models.DecimalField(
        max_digits=8, decimal_places=2)
    manual_elevation = models.DecimalField(
        max_digits=8, decimal_places=2)
    mode = models.CharField(
        max_length=20, choices=MODE_CHOICES, default='automatic')

    class Meta:
        get_latest_by = 'timestamp'
        verbose_name = 'Remote Control'
        verbose_name_plural = 'Remote Controls'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.panel.name} - {self.timestamp}"


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