from rest_framework.routers import DefaultRouter

from .views import (
    PainelViewSet,
    DadosDashboardViewSet,
    PosicaoPainelViewSet,
    LocalizacaoViewSet
)

router = DefaultRouter()

router.register(r'paineis', PainelViewSet)
router.register(r'dados', DadosDashboardViewSet)
router.register(r'posicoes', PosicaoPainelViewSet)
router.register(r'localizacoes', LocalizacaoViewSet)

urlpatterns = router.urls