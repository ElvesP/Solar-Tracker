
import pandas as pd
import pvlib

# Coordenadas de Maputo
latitude = -25.94255
longitude = 32.540419
altitude = 0
fuso = "Africa/Maputo"

local = pvlib.location.Location(
    latitude=latitude,
    longitude=longitude,
    tz=fuso,
    altitude=altitude
)

# Datas de 1 a 7 de Novembro de 2026
datas = pd.date_range(
    "2026-11-01",
    periods=7,
    freq="D",
    tz=fuso
)

# Calcular os eventos solares com NREL SPA
eventos = local.get_sun_rise_set_transit(
    datas,
    method="spa"
)

resultados = []

for data in datas:

    # Eventos solares
    nascer = eventos.loc[data, "sunrise"]
    transito = eventos.loc[data, "transit"]
    por_sol = eventos.loc[data, "sunset"]

    # Criar instante de observação: 14:30
    hora_observacao = data.replace(
        hour=14,
        minute=30,
        second=0
    )

    # Calcular posição solar com NREL SPA
    posicao = local.get_solarposition(
        pd.DatetimeIndex([hora_observacao]),
        method="nrel_numpy"
    )

    # Extrair azimute e elevação
    azimute = posicao["azimuth"].iloc[0]
    elevacao = posicao["apparent_elevation"].iloc[0]

    resultados.append({
        "Data": data.strftime("%d/%m/%Y"),
        "Nascer do sol": nascer.strftime("%H:%M:%S"),
        "Trânsito solar": transito.strftime("%H:%M:%S"),
        "Pôr do sol": por_sol.strftime("%H:%M:%S"),
        "Azimute 14:30 (°)": round(azimute, 4),
        "Elevação 14:30 (°)": round(elevacao, 4)
    })

# Criar tabela
tabela = pd.DataFrame(resultados)

print("\nRESULTADOS DOS CÁLCULOS SOLARES\n")
print(tabela.to_string(index=False))

# Exportar resultados
tabela.to_csv(
    "eventos_solares_pvlib.csv",
    index=False,
    encoding="utf-8-sig"
)
