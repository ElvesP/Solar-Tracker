let dashboardData = null;
let positionData = null;

function getSelectedPanelID() {
    if (
        document.getElementById("sb-panel").value === undefined ||
        document.getElementById("sb-panel").value === ""
    ) {
        console.warn("⚠️ Seletor de painel não encontrado. Retornando null.");
        return null;
    }
    return document.getElementById("sb-panel").value;
}

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

function renderSelectedGraph(dashboardData, positionData) {
    if (!dashboardData || !positionData) {
        console.warn("⚠️ Dados de monitoramento não disponíveis para renderizar gráficos.");
        return;
    }

    const isDark =
        document.body.classList.contains('dark');
    const textColor =
        isDark ? "#f5f5f5" : "#1f2937";
    const gridColor =
        isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.08)";

    const graphType = 
        document.getElementById("graphSelector").value;
    const graphConfig = {
        voltage: {
            label: "Tensão (V)",
            field: "voltage",
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.15)"
        },
        current: {
            label: "Corrente (A)",
            field: "current",
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.15)"
        },
        light: {
            label: "Luminosidade (Lux)",
            field: "luminosity",
            borderColor: "#facc15",
            backgroundColor: "rgba(250,204,21,0.15)"
        },
        power: {
            label: "Potência (W)",
            field: "power",
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.15)"
        },
        efficiency: {
            label: "Eficiência (%)",
            field: "tracking_efficiency",
            borderColor: "#a855f7",
            backgroundColor: "rgba(168,85,247,0.15)"
        }
    };

    const config = graphConfig[graphType];
    let labels = [];
    let dataset = [];

    if (
        graphType === 'voltage' ||
        graphType === 'current' ||
        graphType === 'light' ||
        graphType === 'power'
    ) {
        labels = dashboardData.map(item => {
            const date = new Date(item.timestamp);

            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        });

        dataset = dashboardData.map(item =>
            Number(item[config.field])
        );
    } else if (graphType === 'efficiency') {
        labels = positionData.map(item => {
            const date = new Date(item.timestamp);

            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        });

        dataset = positionData.map(item =>
            Number(item[config.field])
        );
    }

    if (!window.electricalChartInstance) {
        const electricalCtx =
            document.getElementById('electricalChart');

        window.electricalChartInstance = new Chart(
            electricalCtx,
            {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: config.label,
                        data: dataset,
                        borderColor: config.borderColor,
                        backgroundColor: config.backgroundColor,
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: textColor
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: textColor,
                                autoSkip: false,
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const [hour, minute] = label.split(':');

                                    if (index === 0) {
                                        return `${hour}:00`;
                                    }

                                    const previousLabel = this.getLabelForValue(index - 1);
                                    const [prevHour] = previousLabel.split(':');

                                    if (hour !== prevHour) {
                                        return `${hour}:00`;
                                    }

                                    return "";
                                }
                            },
                            grid: {
                                color: gridColor
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: textColor
                            },
                            grid: {
                                color: gridColor
                            }
                        }
                    }
                }
            }
        );
    } else {
        const chart = window.electricalChartInstance;

        chart.data.labels = labels;
        chart.data.datasets[0].data = dataset;
        chart.data.datasets[0].label = config.label;
        chart.data.datasets[0].borderColor = config.borderColor;
        chart.data.datasets[0].backgroundColor = config.backgroundColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;

        chart.update();
    }

    // SOLAR ANGLE CHART
    const solarLabels = positionData.map(item => {
        const date = new Date(item.timestamp);
        
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    });

    const actualAzimuth = positionData.map(item =>
        Number(item.actual_azimuth)
    );
    const theoreticalAzimuth = positionData.map(item =>
        Number(item.theoretical_azimuth)
    );
    const actualElevation = positionData.map(item =>
        Number(item.actual_elevation)
    );
    const theoreticalElevation = positionData.map(item =>
        Number(item.theoretical_elevation)
    );

    if (!window.solarAngleChartInstance) {
        const solarCtx =
            document.getElementById('solarAngleChart');

        window.solarAngleChartInstance = new Chart(
            solarCtx,
            {
                type: 'line',
                data: {
                    labels: solarLabels,
                    datasets: [
                        {
                            label: 'Azimute Real (°)',
                            data: actualAzimuth,
                            borderColor: '#07bdf8',
                            backgroundColor: 'rgba(56,189,248,0.15)',
                            tension: 0.3
                        },
                        {
                            label: 'Azimute Teórico (°)',
                            data: theoreticalAzimuth,
                            borderColor: '#eea5e9',
                            backgroundColor: 'rgba(14,165,233,0.15)',
                            tension: 0.3
                        },
                        {
                            label: 'Elevação Real (°)',
                            data: actualElevation,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16,185,129,0.15)',
                            tension: 0.3
                        },
                        {
                            label: 'Elevação Teórica (°)',
                            data: theoreticalElevation,
                            borderColor: '#ffc55e',
                            backgroundColor: 'rgba(34,197,94,0.15)',
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: textColor
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: textColor,
                                autoSkip: false,
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const [hour, minute] = label.split(':');

                                    if (index === 0) {
                                        return `${hour}:00`;
                                    }

                                    const previousLabel = this.getLabelForValue(index - 1);
                                    const [prevHour] = previousLabel.split(':');

                                    if (hour !== prevHour) {
                                        return `${hour}:00`;
                                    }

                                    return "";
                                }
                            },
                            grid: {
                                color: gridColor
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: textColor
                            },
                            grid: {
                                color: gridColor
                            }
                        }
                    }
                }
            }
        );
    } else {
        const chart = window.solarAngleChartInstance;

        chart.data.labels = solarLabels;
        chart.data.datasets[0].data = actualAzimuth;
        chart.data.datasets[1].data = theoreticalAzimuth;
        chart.data.datasets[2].data = actualElevation;
        chart.data.datasets[3].data = theoreticalElevation;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;

        chart.update();
    }
}

async function renderData() {
    const selectedPanelID = getSelectedPanelID();
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

document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date();
    const formattedDate =
        today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    document.getElementById('date-monitoring').value =
        formattedDate;

    setTimeout(() => {
        renderData();
    }, 5000);

    document.getElementById("data-submit-btn1").addEventListener(
        "click", 
        async () => {
            renderData();
        }
    );

    document.getElementById("themeBtn").addEventListener(
        "click",
        () => {
            if (!dashboardData && !positionData) return;

            renderSelectedGraph(dashboardData, positionData);
        }
    )

    document.getElementById('graphSelector').addEventListener(
        'change', 
        async () => {
            if (!dashboardData && !positionData) return;

            renderSelectedGraph(dashboardData, positionData);
        }
    );
});