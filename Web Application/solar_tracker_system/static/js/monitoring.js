let dashboardData = null;
let positionData = null;


async function getMonitoringData(panelId, selectedDate) {
    try {
        const dashboardResponse = await fetch(
            `/api/dashboard-data/?panel=${panelId}&date=${selectedDate}`);
        const positionResponse = await fetch(
            `/api/panel-positions/?panel=${panelId}&date=${selectedDate}`);
        const dashboardConverted = await dashboardResponse.json();
        const positionConverted = await positionResponse.json();

        return { dashboardConverted, positionConverted };
    } catch (error) {
        console.error(
            'Erro ao buscar dados de monitoramento:',
            error
        );
    }

    return { dashboardConverted: null, positionConverted: null };
}

async function renderData() {
    const selectedPanelID = getSelectedPanelID();

    if (selectedPanelID === null) return;
    
    const selectedDate = 
        document.getElementById("date-monitoring").value;
    const { 
        dashboardConverted: dd, 
        positionConverted: pd 
    } = await getMonitoringData(selectedPanelID, selectedDate);
    dashboardData = dd;
    positionData = pd;

    document.getElementById("data-selected-indicador")
        .innerText = new Date(selectedDate)
            .toLocaleDateString('pt-PT')
    document.getElementById("data-selected-indicador1")
        .innerText = new Date(selectedDate)
            .toLocaleDateString('pt-PT')

    renderSelectedGraph(dashboardData, positionData);
}

function getSelectedPanelID() {
    if (
        document.getElementById("sb-panel").value === undefined ||
        document.getElementById("sb-panel").value === ""
    ) {
        console.warn("⚠️ Seletor de painel não encontrado. Retornando null.");
        addNotification("Seletor de painel não encontrado. Adicione pelo menos um painel no Perfil.", "error");
        return null;
    }
    return document.getElementById("sb-panel").value;
}

function renderSelectedGraph(dashboardData, positionData) {
    if (!Array.isArray(dashboardData) || !Array.isArray(positionData)) {
        console.warn(
            "Dados de monitoramento não disponíveis para renderizar gráficos."
        );
        addNotification("Dados de monitoramento não disponíveis para renderizar gráficos.", "error");
        return;
    }

    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#f5f5f5" : "#1f2937";
    const gridColor = isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.08)";
    const graphType =
        document.getElementById("graphSelector").value;
    const graphConfig = {
        voltage: {
            label: "Tensão (V)",
            field: "voltage",
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.15)",
            source: "dashboard"
        },
        current: {
            label: "Corrente (A)",
            field: "current",
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.15)",
            source: "dashboard"
        },
        light: {
            label: "Luminosidade (Lux)",
            field: "luminosity",
            borderColor: "#facc15",
            backgroundColor: "rgba(250,204,21,0.15)",
            source: "dashboard"
        },
        temperature: {
            label: "Temperatura (°C)",
            field: "temperature",
            borderColor: "#ff1819",
            backgroundColor: "rgba(140,100,21,0.15)",
            source: "dashboard"
        },
        power: {
            label: "Potência (W)",
            field: "power",
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.15)",
            source: "dashboard"
        },
        efficiency: {
            label: "Eficiência (%)",
            field: "tracking_efficiency",
            borderColor: "#a855f7",
            backgroundColor: "rgba(168,85,247,0.15)",
            source: "position"
        }
    };

    const config = graphConfig[graphType];

    if (!config) {
        console.warn("Tipo de gráfico desconhecido:", graphType);
        return;
    }

    function formatFullTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }

    function formatHour(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }

    function formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString([], {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }

    function isGap(item) {
        return item?.is_gap === true;
    }

    function getNumericValue(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    function prepareTimeData(items, fields) {
        const rows = (items || [])
            .filter(item => {
                if (!item || !item.timestamp) {
                    return false;
                }

                return Number.isFinite(
                    new Date(item.timestamp).getTime()
                );
            })
            .map(item => ({
                x: new Date(item.timestamp).getTime(),
                item
            }))
            .sort((a, b) => a.x - b.x);

        const series = fields.map(() => []);

        const fullTimeTicks = new Set();
        const hourlyTicks = new Set();

        if (rows.length === 0) {
            return {
                series,
                ticks: [],
                fullTimeTicks,
                hourlyTicks,
                min: undefined,
                max: undefined
            };
        }

        // Apenas medições reais definem os limites do gráfico.
        const realRows = rows.filter(
            row => !isGap(row.item)
        );

        if (realRows.length === 0) {
            return {
                series,
                ticks: [],
                fullTimeTicks,
                hourlyTicks,
                min: undefined,
                max: undefined
            };
        }

        const firstTimestamp = realRows[0].x;
        const lastTimestamp = realRows[realRows.length - 1].x;

        fullTimeTicks.add(firstTimestamp);
        fullTimeTicks.add(lastTimestamp);

        rows.forEach(row => {
            const gap = isGap(row.item);

            fields.forEach((field, fieldIndex) => {
                const value = gap
                    ? null
                    : getNumericValue(row.item[field]);

                series[fieldIndex].push({
                    x: row.x,
                    y: value
                });
            });
        });

        const firstDate = new Date(firstTimestamp);
        const hourDate = new Date(firstDate);

        hourDate.setMinutes(0, 0, 0);
        hourDate.setHours(hourDate.getHours() + 1);

        while (hourDate.getTime() < lastTimestamp) {
            const timestamp = hourDate.getTime();

            if (
                timestamp > firstTimestamp &&
                timestamp < lastTimestamp
            ) {
                hourlyTicks.add(timestamp);
            }

            hourDate.setHours(hourDate.getHours() + 1);
        }
   
        const ticks = [...new Set([
            ...fullTimeTicks,
            ...hourlyTicks
        ])].sort((a, b) => a - b);

        return {
            series,
            ticks,
            fullTimeTicks,
            hourlyTicks,
            min: firstTimestamp,
            max: lastTimestamp
        };
    }

    function createTimeAxis(timeInfo) {
        return {
            type: "linear",
            min: timeInfo.min,
            max: timeInfo.max,

            afterBuildTicks(axis) {
                axis.ticks = timeInfo.ticks.map(value => ({
                    value
                }));
            },

            ticks: {
                color: textColor,
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,

                callback(value) {
                    const timestamp = Number(value);

                    if (timeInfo.fullTimeTicks.has(timestamp)) {
                        return formatFullTime(timestamp);
                    }

                    if (timeInfo.hourlyTicks.has(timestamp)) {
                        return formatHour(timestamp);
                    }

                    return "";
                }
            },

            grid: { color: gridColor }
        };
    }

    function createYAxis() {
        return {
            beginAtZero: true,

            ticks: {
                color: textColor
            },

            grid: {
                color: gridColor
            }
        };
    }

    function createTooltipOptions() {
        return {
            callbacks: {
                title(items) {
                    if (!items.length) {
                        return "";
                    }

                    return formatDateTime(
                        items[0].parsed.x
                    );
                }
            }
        };
    }

    function updateChartAppearance(chart, timeInfo) {
        chart.options.scales.x = createTimeAxis(timeInfo);
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;
        chart.options.plugins.tooltip = createTooltipOptions();
    }

    const selectedItems = config.source === "dashboard"
        ? dashboardData
        : positionData;
    const timeData = prepareTimeData(
        selectedItems,
        [config.field]
    );
    const selectedSeries = timeData.series[0];
    const electricalCanvas =
        document.getElementById("electricalChart");

    if (!electricalCanvas) {
        console.warn("Canvas electricalChart não encontrado.");
        return;
    }

    if (!window.electricalChartInstance) {
        window.electricalChartInstance = new Chart(
            electricalCanvas,
            {
                type: "line",

                data: {
                    datasets: [{
                        label: config.label,
                        data: selectedSeries,
                        borderColor: config.borderColor,
                        backgroundColor: config.backgroundColor,
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 2,
                        spanGaps: false
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    interaction: {
                        mode: "nearest",
                        intersect: false
                    },

                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: textColor
                            }
                        },

                        tooltip: createTooltipOptions()
                    },

                    scales: {
                        x: createTimeAxis(timeData),
                        y: createYAxis()
                    }
                }
            }
        );
    } else {
        const chart = window.electricalChartInstance;

        chart.data.datasets[0].data = selectedSeries;
        chart.data.datasets[0].label = config.label;
        chart.data.datasets[0].borderColor = config.borderColor;
        chart.data.datasets[0].backgroundColor = config.backgroundColor;
        chart.data.datasets[0].spanGaps = false;

        updateChartAppearance(chart, timeData);

        chart.update();
    }

    const solarFields = [
        "actual_azimuth",
        "theoretical_azimuth",
        "actual_elevation",
        "theoretical_elevation"
    ];

    const solarTimeData = prepareTimeData(
        positionData,
        solarFields
    );

    const solarDatasets = [
        {
            label: "Azimute Real (°)",
            data: solarTimeData.series[0],
            borderColor: "#07bdf8",
            backgroundColor: "rgba(56,189,248,0.15)",
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
        },
        {
            label: "Azimute Teórico (°)",
            data: solarTimeData.series[1],
            borderColor: "#eea5e9",
            backgroundColor: "rgba(14,165,233,0.15)",
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
        },
        {
            label: "Elevação Real (°)",
            data: solarTimeData.series[2],
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.15)",
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
        },
        {
            label: "Elevação Teórica (°)",
            data: solarTimeData.series[3],
            borderColor: "#ffc55e",
            backgroundColor: "rgba(34,197,94,0.15)",
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
        }
    ];

    const solarCanvas =
        document.getElementById("solarAngleChart");

    if (!solarCanvas) {
        console.warn("Canvas solarAngleChart não encontrado.");
        return;
    }

    if (!window.solarAngleChartInstance) {
        window.solarAngleChartInstance = new Chart(
            solarCanvas,
            {
                type: "line",

                data: {
                    datasets: solarDatasets
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    interaction: {
                        mode: "nearest",
                        intersect: false
                    },

                    plugins: {
                        legend: {
                            display: true,

                            labels: {
                                color: textColor
                            }
                        },

                        tooltip: createTooltipOptions()
                    },

                    scales: {
                        x: createTimeAxis(solarTimeData),
                        y: createYAxis()
                    }
                }
            }
        );
    } else {
        const chart = window.solarAngleChartInstance;

        solarDatasets.forEach((dataset, index) => {
            chart.data.datasets[index].data = dataset.data;
            chart.data.datasets[index].label = dataset.label;
            chart.data.datasets[index].borderColor = dataset.borderColor;
            chart.data.datasets[index].backgroundColor =
                dataset.backgroundColor;
            chart.data.datasets[index].spanGaps = false;
        });

        updateChartAppearance(chart, solarTimeData);

        chart.update();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date();
    const formattedDate =
        today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    document.getElementById('date-monitoring').value =
        formattedDate;

    document.getElementById("nav-monitoring").addEventListener(
        "click", 
        async () => {
            renderData();
        }
    );

    document.getElementById("data-submit-btn1").addEventListener(
        "click", 
        async () => {
            renderData();
        }
    );

    document.getElementById('graphSelector').addEventListener(
        'change', 
        async () => {
            if (!dashboardData && !positionData) return;

            renderSelectedGraph(dashboardData, positionData);
        }
    );
});