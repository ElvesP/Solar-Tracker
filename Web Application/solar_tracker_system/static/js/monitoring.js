const textColor = '#9ca3af';

const datasets = {
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
        field: "light_intensity",
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

let monitoringData = [];

// ELECTRICAL CHART

const electricalCtx =
    document.getElementById("electricalChart");
const electricalChart = new Chart(
    electricalCtx,
    {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: datasets.voltage.label,
                data: [],
                borderColor: datasets.voltage.borderColor,
                backgroundColor: datasets.voltage.backgroundColor,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        onClick: null,
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    },
                    title: {
                        display: true,
                        text: "Tempo do Dia",
                        color: textColor,
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    }
);


// SOLAR CHART

const solarCtx =
    document.getElementById("solarAngleChart");
const solarChart = new Chart(
    solarCtx,
    {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Elevação Solar",
                data: [],
                borderColor: "#a855f7",
                backgroundColor:
                    "rgba(168,85,247,0.15)",
                borderWidth: 3,
                tension: 0.45,
                fill: true,
                pointRadius: 4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        onClick: () => {}
                    }
                }
            },

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Ângulo de Azimute (°)",
                        color: textColor,
                    },
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Ângulo de Elevação (°)",
                        color: textColor,
                    },
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    }
);


// UPDATE ELECTRICAL CHART

function updateElectricalChart() {
    const selector =
        document.getElementById("graphSelector");
    const selectedDataset =
        datasets[selector.value];
    electricalChart.data.labels =
        monitoringData.map(
            item => item.time
        );
    electricalChart.data.datasets[0].label =
        selectedDataset.label;
    electricalChart.data.datasets[0].data =
        monitoringData.map(
            item => item[selectedDataset.field]
        );
    electricalChart.data.datasets[0].borderColor =
        selectedDataset.borderColor;
    electricalChart.data.datasets[0].backgroundColor =
        selectedDataset.backgroundColor;

    electricalChart.update();
}


// UPDATE SOLAR CHART

function updateSolarChart() {
    solarChart.data.labels =
        monitoringData.map(
            item => item.azimuth
        );
    solarChart.data.datasets[0].data =
        monitoringData.map(
            item => item.elevation
        );

    solarChart.update();
}


// FETCH MONITORING DATA

async function getMonitoringData() {
    const selectedDate =
        document.getElementById(
            "date-monitoring"
        ).value;
    if (!selectedDate) return;

    try {
        const response = await fetch(
            `/api/monitoring/?date=${selectedDate}`
        );

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar dados"
            );
        }

        monitoringData =
            await response.json();

        updateElectricalChart();

        updateSolarChart();

    } catch (error) {

        console.error(error);
    }
}


// GRAPH SELECT EVENT

const selector =
    document.getElementById("graphSelector");
selector.addEventListener(
    "change",
    updateElectricalChart
);


// INITIAL LOAD

getMonitoringData();