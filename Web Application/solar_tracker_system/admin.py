from django.contrib import admin
from .models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
    RemoteControl,
    Location
)


# =========================
# SOLAR PANEL ADMIN
# =========================
@admin.register(SolarPanel)
class SolarPanelAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'name',
        'user',
        'last_seen',
        'timestamp'
    )

    search_fields = (
        'name',
        'user__username',
    )

    list_filter = (
        'last_seen',
        'timestamp'
    )

    ordering = ('-timestamp',)


# =========================
# DASHBOARD DATA ADMIN
# =========================
@admin.register(DashboardData)
class DashboardDataAdmin(admin.ModelAdmin):

    list_display = (
        'panel',
        'voltage',
        'current',
        'luminosity',
        'power',
        'timestamp'
    )

    search_fields = (
        'panel__name',
    )

    list_filter = (
        'timestamp',
    )

    ordering = ('-timestamp',)


# =========================
# PANEL POSITION ADMIN
# =========================
@admin.register(PanelPosition)
class PanelPositionAdmin(admin.ModelAdmin):

    list_display = (
        'panel',
        'actual_azimuth',
        'theoretical_azimuth',
        'actual_elevation',
        'theoretical_elevation',
        'tracking_efficiency',
        'timestamp'
    )

    search_fields = (
        'panel__name',
    )

    list_filter = (
        'panel',
        'timestamp'
    )

    ordering = ('-timestamp',)


# =========================
# PANEL POSITION ADMIN
# =========================
@admin.register(RemoteControl)
class RemoteControlAdmin(admin.ModelAdmin):

    list_display = (
        'panel',
        'manual_azimuth',
        'manual_elevation',
        'mode',
        'timestamp'
    )

    search_fields = (
        'panel__name',
    )

    list_filter = (
        'mode',
        'timestamp'
    )

    ordering = ('-timestamp',)


# =========================
# LOCATION ADMIN
# =========================
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):

    list_display = (
        'panel',
        'latitude',
        'longitude',
        'timestamp'
    )

    search_fields = (
        'panel__name',
    )

    list_filter = (
        'timestamp',
    )

    ordering = ('-timestamp',)