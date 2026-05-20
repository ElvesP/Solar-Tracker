from django.contrib import admin
from .models import (
    SolarPanel,
    DashboardData,
    PanelPosition,
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
        'status',
        'timestamp'
    )

    search_fields = (
        'name',
        'user__username',
    )

    list_filter = (
        'status',
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