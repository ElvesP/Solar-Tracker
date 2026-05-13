from django.views.generic import RedirectView
from django.templatetags.static import static
from django.urls import path, include
from . import views


urlpatterns = [
    path('favicon.ico', RedirectView.as_view(url=static('favicon.ico'))),
    path('', views.index, name='index'),
    path('home/', views.index, name='index'),
    path('profile/', views.profile, name='profile'),
    path('api/', include('solar_tracker_system.api.urls')),
]