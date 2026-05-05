const textColor = '#9ca3af';

const timeLabels = [
    "06:00","07:00","08:00","09:00","10:00","11:00",
    "12:00","13:00","14:00","15:00","16:00","17:00","18:00"
];

const datasets = {
    voltage: {
        label: "Tensão (V)",
        data: [10, 12, 15, 17, 19, 21, 22, 22, 21, 19, 17, 14, 11],
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.15)"
    },
    current: {
        label: "Corrente (A)",
        data: [0.3, 0.8, 1.5, 2.8, 4.0, 5.2, 5.9, 5.7, 5.0, 3.8, 2.6, 1.2, 0.4],
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.15)"
    },
    light: {
        label: "Luminosidade (Lux)",
        data: [200, 1000, 5000, 12000, 25000, 40000, 50000, 47000, 38000, 25000, 12000, 3000, 400],
        borderColor: "#facc15",
        backgroundColor: "rgba(250,204,21,0.15)"
    },
    power: {
        label: "Potência (W)",
        data: [5, 20, 55, 100, 150, 190, 220, 210, 180, 140, 95, 45, 10],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.15)"
    },
    efficiency: {
        label: "Eficiência (%)",
        data: [30,35,40,55,60,68,72,70,65,58,50,42,38],
        borderColor: "#a855f7"
    }
};

const electricalCtx = document.getElementById("electricalChart");
let electricalChart = new Chart(electricalCtx, {
    type: "line",
    data: {
        labels: timeLabels,
        datasets: [{
            label: datasets.voltage.label,
            data: datasets.voltage.data,
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
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: "rgba(255,255,255,0.05)"
                }
            }
        }
    }
});

const selector =
    document.getElementById("graphSelector");

selector.addEventListener("change", () => {
    const selected = datasets[selector.value];
    electricalChart.data.datasets[0].label =
        selected.label;
    electricalChart.data.datasets[0].data =
        selected.data;
    electricalChart.data.datasets[0].borderColor =
        selected.borderColor;
    electricalChart.data.datasets[0].backgroundColor =
        selected.backgroundColor;
    electricalChart.update();
});

const azimuth = [
    90, 100, 110, 120, 135,
    150, 180, 210, 225,
    240, 255, 270
];

const elevation = [
    5, 12, 20, 32, 45,
    58, 70, 60, 48,
    35, 18, 6
];

const solarCtx =
    document.getElementById("solarAngleChart");

new Chart(solarCtx, {
    type: "line",
    data: {
        labels: azimuth,
        datasets: [{
            label: "Elevação Solar",
            data: elevation,
            borderColor: "#a855f7",
            backgroundColor: "rgba(168,85,247,0.15)",
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
});