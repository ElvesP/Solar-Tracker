let reportData = null;

function getSelectedPanelID() {
    const selector = document.getElementById("sb-panel");

    if (!selector || !selector.value) {
        console.warn("⚠️ Painel não selecionado.");
        return null;
    }

    return selector.value;
}

async function getReportData(
    panelId,
    selectedDate,
    range
) {
    try {
        const response = await fetch(
            `/api/daily-data/?panel=${panelId}&date=${selectedDate}&range=${range}`
        );

        const converted = await response.json();

        return converted;
    } catch (error) {
        console.error(
            "❌ Erro ao buscar dados do relatório:",
            error
        );
    }

    return null;
}

function renderReportChart(data) {
    if (!data) {
        console.warn("⚠️ Dados do relatório indisponíveis.");
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

    const dataType =
        document.getElementById("rangeSelectData").value;
    const chartTitle =
        document.querySelector(".chart-title h2");
    const chartSubtitle =
        document.querySelector(".chart-title p");
    const insightSubtitle =
        document.getElementById("insightSubtitle");
    const range =
        document.getElementById("rangeSelect").value;

    const configMap = {
        energy: {
            label: "Energia (kWh)",
            field: "energy",
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.55)",
            title: "GERAÇÃO DE ENERGIA"
        },
        avg_luminosity: {
            label: "Luminosidade Média (Lux)",
            field: "avg_luminosity",
            borderColor: "#facc15",
            backgroundColor: "rgba(250,204,21,0.65)",
            title: "LUMINOSIDADE MÉDIA"
        },
        tracking_efficiency: {
            label: "Eficiência Média (%)",
            field: "tracking_efficiency",
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.35)",
            title: "EFICIÊNCIA DE RASTREAMENTO"
        }
    };

    const config = configMap[dataType];

    chartSubtitle.innerText = config.title;

    if (range === "week") {
        chartTitle.innerText = "Dados da Semana";
        insightSubtitle.innerText = "Semanal";
    } else if (range === "month") {
        chartTitle.innerText = "Dados do Mês";
        insightSubtitle.innerText = "Mensal";
    } else {
        chartTitle.innerText = "Dados do Ano";
        insightSubtitle.innerText = "Anual";
    }

    const labels = data.map(item => {
        return new Date(item.date)
            .toLocaleDateString('pt-PT');
    });

    const dataset = data.map(item =>
        Number(item[config.field])
    );

    const ctx =
        document.getElementById("energyChart");

    if (!window.reportChartInstance) {
        window.reportChartInstance = new Chart(
            ctx,
            {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: config.label,
                        data: dataset,
                        borderColor: config.borderColor,
                        backgroundColor: config.backgroundColor,
                        borderWidth: 1
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
                                color: textColor
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
        const chart = window.reportChartInstance;

        chart.data.labels = labels;
        chart.data.datasets[0].label =
            config.label;
        chart.data.datasets[0].data =
            dataset;
        chart.data.datasets[0].borderColor =
            config.borderColor;
        chart.data.datasets[0].backgroundColor =
            config.backgroundColor;

        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;

        chart.update();
    }

    updateInsights(data);
}

function updateInsights(data) {
    if (!data || data.length === 0) return;

    const last =
        data[data.length - 1];
    const totalCard =
        document.querySelector(".card.total h2");
    const totalSubtitle =
        document.querySelector(".card.total p");
    const insights =
        document.querySelector(".card.insights ul");
    const rangeSelect =
        document.getElementById("rangeSelectData")

    if (rangeSelect.value === "energy") {
        totalSubtitle.innerText =
            "TOTAL GERADO (DATA SELECCIONADA)";
        totalCard.innerText =
            `${Number(last.energy || 0).toFixed(2)} Wh`;
    } else if (rangeSelect.value === "avg_luminosity") {
        totalSubtitle.innerText =
            "LUMINOSIDADE MÉDIA (DATA SELECCIONADA)";
        totalCard.innerText =
            `${Number(last.avg_luminosity || 0).toFixed(0)} Lux`;
    } else if (rangeSelect.value === "tracking_efficiency") {
        totalSubtitle.innerText =
            "EFICIÊNCIA MÉDIA (DATA SELECCIONADA)";
        totalCard.innerText =
            `${Number(last.tracking_efficiency || 0).toFixed(2)}%`;
    }
    let totalEnergy = 0;
    let totalAvgLuminosity = 0;
    let totalAvgTrackingEfficiency = 0;

    data.forEach(item => {
        if (item.energy) {
            totalEnergy += Number(item.energy);
        };
        if(item.avg_luminosity) {
            totalAvgLuminosity += Number(item.avg_luminosity);
        };
        if(item.tracking_efficiency) {
            totalAvgTrackingEfficiency += Number(item.tracking_efficiency);
        };
    });

    insights.innerHTML = `
        <li>
            Energia gerada
            ${Number(totalEnergy || 0).toFixed(2)} Wh
        </li>
        <li>
            Eficiência média
            ${Number(totalAvgTrackingEfficiency/data.length || 0).toFixed(2)}%
        </li>
        <li>
            Luminosidade média
            ${Number(totalAvgLuminosity/data.length || 0).toFixed(0)} Lux
        </li>
    `;
}

async function renderReports() {
    const selectedPanelID =
        getSelectedPanelID();

    const selectedDate =
        document.getElementById("date-report").value;

    const range =
        document.getElementById("rangeSelect").value;

    reportData = await getReportData(
        selectedPanelID,
        selectedDate,
        range
    );

    renderReportChart(reportData);
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const today = new Date();
        const formattedDate =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        document.getElementById("date-report").value =
            formattedDate;

        setTimeout(async () => {
            await renderReports();
        }, 5000);

        document.getElementById("data-submit-btn2")
            .addEventListener(
                "click",
                async () => {
                    await renderReports();
                }
            );

        document.getElementById("themeBtn").addEventListener(
            "click",
            () => {
                if (!reportData) return;

                renderReportChart(reportData)
            }
        )

        document.getElementById("rangeSelectData")
            .addEventListener(
                "change",
                () => {
                    if (!reportData) return;

                    renderReportChart(reportData);
                }
            );
    }
);