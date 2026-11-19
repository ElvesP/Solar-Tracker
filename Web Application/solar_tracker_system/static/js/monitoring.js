let dashboardData = null;
let positionData = null;
const emptyLimits = () => ({ xMin: "", xMax: "", yMin: "", yMax: "" });
const axisLimits = {
    electrical: emptyLimits(),
    solar: emptyLimits()
};


function timeToSeconds(value) {
    if (!value) return null;
    const [h, m, s = 0] = value.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

function numberOrUndefined(value) {
    if (value === "" || value === null || value === undefined) {
        return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function timeToTimestamp(value, baseTimestamp) {
    if (!value || baseTimestamp === undefined) return undefined;
    const [h, m, s = 0] = value.split(":").map(Number);
    const date = new Date(baseTimestamp);
    date.setHours(h, m, s, 0);
    return date.getTime();
}

function resolveLimits(raw, baseTimestamp) {
    return {
        xMin: timeToTimestamp(raw.xMin, baseTimestamp),
        xMax: timeToTimestamp(raw.xMax, baseTimestamp),
        yMin: numberOrUndefined(raw.yMin),
        yMax: numberOrUndefined(raw.yMax)
    };
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
            label: "Iluminância (Lux)",
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

    function getRange(timeInfo, limits) {
        return {
            min: limits.xMin ?? timeInfo.min,
            max: limits.xMax ?? timeInfo.max
        };
    }

    function createZoomOptions(timeInfo, limits) {
        const { min, max } = getRange(timeInfo, limits);

        return {
            limits: {
                x: {
                    min: Math.min(timeInfo.min ?? min, min ?? Infinity),
                    max: Math.max(timeInfo.max ?? max, max ?? -Infinity)
                }
            },
            pan: {
                enabled: true,
                mode: "xy",
                modifierKey: "shift"
            },
            zoom: {
                wheel: { enabled: true, modifierKey: "ctrl" },
                pinch: { enabled: true },
                drag: {
                    enabled: true,
                    threshold: 5, 
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.15)",
                    borderWidth: 1
                },
                mode: "xy"
            }
        };
    }

    function createTimeAxis(timeInfo, limits) {
        const { min, max } = getRange(timeInfo, limits);

        const MIN_GAP_PX = 80; // espaço mínimo entre rótulos
        const STEPS_S = [
            1, 5, 15, 30, 60, 300, 900, 1800,
            3600, 7200, 10800, 21600, 43200
        ];

        // Partilhado entre afterBuildTicks e callback
        let edgeTicks = new Set();
        let showSeconds = false;

        return {
            type: "linear",
            min,
            max,

            afterBuildTicks(axis) {
                const lo = axis.min;
                const hi = axis.max;

                edgeTicks = new Set();

                if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
                    axis.ticks = [];
                    return;
                }

                const width = axis.chart.width || 600;
                const msPerPx = (hi - lo) / width;
                const minGapMs = msPerPx * MIN_GAP_PX;

                // Menor passo que cabe sem sobreposição
                const stepS = STEPS_S.find(s => s * 1000 >= minGapMs)
                    ?? STEPS_S[STEPS_S.length - 1];
                const stepMs = stepS * 1000;
                showSeconds = stepS < 60;

                // Alinhar à hora local
                const offsetMs =
                    -new Date(lo).getTimezoneOffset() * 60000;
                let t = Math.ceil((lo - offsetMs) / stepMs) * stepMs + offsetMs;

                // Marcas intermédias, longe das extremidades
                const values = [];
                for (; t < hi; t += stepMs) {
                    if (t - lo >= minGapMs && hi - t >= minGapMs) {
                        values.push(t);
                    }
                }

                // Extremidades (sempre visíveis)
                edgeTicks.add(lo);
                edgeTicks.add(hi);

                axis.ticks = [lo, ...values, hi].map(value => ({ value }));
            },

            ticks: {
                color: textColor,
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,

                callback(value) {
                    const timestamp = Number(value);

                    if (edgeTicks.has(timestamp) || showSeconds) {
                        return formatFullTime(timestamp);
                    }

                    return formatHour(timestamp);
                }
            },
            grid: { color: gridColor }
        };
    }

    function createYAxis(limits, beginAtZero = true) {
        return {
            beginAtZero,
            min: limits.yMin,
            max: limits.yMax,
            ticks: { color: textColor },
            grid: { color: gridColor }
        };
    }

    function updateChartAppearance(chart, timeInfo, limits, beginAtZero = true) {
        const zoomLimits = createZoomOptions(timeInfo, limits).limits;

        chart.options.scales.x = createTimeAxis(timeInfo, limits);
        chart.options.scales.y.beginAtZero = beginAtZero;
        chart.options.scales.y.min = limits.yMin;
        chart.options.scales.y.max = limits.yMax;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.legend.labels.color = textColor;
        chart.options.plugins.tooltip = createTooltipOptions();
        chart.options.plugins.zoom.limits = zoomLimits;
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

    const selectedItems = config.source === "dashboard"
        ? dashboardData
        : positionData;
    const timeData = prepareTimeData(
        selectedItems,
        [config.field]
    );
    const electricalLimits = resolveLimits(
        axisLimits.electrical, timeData.min
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
                        borderWidth: 2,
                        pointRadius: 0,
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
                        tooltip: createTooltipOptions(),
                        zoom: createZoomOptions(timeData, electricalLimits)
                    },
                    scales: {
                        x: createTimeAxis(timeData, electricalLimits),
                        y: createYAxis(electricalLimits)
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

        updateChartAppearance(chart, timeData, electricalLimits);
        chart.update();
    }

    const solarMode =
        document.getElementById("solarGraphType")?.value || "angles";
    const isDifferences = solarMode === "differences";

    function difference(actual, theoretical, wrap = false) {
        const a = getNumericValue(actual);
        const t = getNumericValue(theoretical);

        if (a === null || t === null) return null;

        let d = a - t;

        if (wrap) {
            d = ((d + 540) % 360) - 180;
        }

        return d;
    }

    const solarSource = isDifferences
        ? positionData.map(item => ({
            ...item,
            azimuth_diff: difference(
                item.actual_azimuth, item.theoretical_azimuth, true
            ),
            elevation_diff: difference(
                item.actual_elevation, item.theoretical_elevation
            )
        }))
        : positionData;

    const solarFields = isDifferences
        ? ["azimuth_diff", "elevation_diff"]
        : [
            "actual_azimuth",
            "theoretical_azimuth",
            "actual_elevation",
            "theoretical_elevation"
        ];

    const solarTimeData = prepareTimeData(solarSource, solarFields);
    const solarLimits = resolveLimits(
        axisLimits.solar, solarTimeData.min
    );

    const solarDatasets = isDifferences
        ? [
            {
                label: "Δ Azimute (Real − Teórico) (°)",
                data: solarTimeData.series[0],
                borderColor: "#05c1ff",
                backgroundColor: "rgba(56,189,248,0.15)",
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            },
            {
                label: "Δ Elevação (Real − Teórico) (°)",
                data: solarTimeData.series[1],
                borderColor: "#10b981",
                backgroundColor: "rgba(16,185,129,0.15)",
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            }
        ]
        : [
            {
                label: "Azimute Real (°)",
                data: solarTimeData.series[0],
                borderColor: "#0d9488",
                backgroundColor: "rgba(56,189,248,0.15)",
                borderDash: [6, 4],
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            },
            {
                label: "Azimute Teórico (°)",
                data: solarTimeData.series[1],
                borderColor: "#2563eb",
                backgroundColor: "rgba(14,165,233,0.15)",
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            },
            {
                label: "Elevação Real (°)",
                data: solarTimeData.series[2],
                borderColor: "#f59e0b",
                backgroundColor: "rgba(16,185,129,0.15)",
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            },
            {
                label: "Elevação Teórica (°)",
                data: solarTimeData.series[3],
                borderColor: "#9333ea",
                backgroundColor: "rgba(34,197,94,0.15)",
                borderDash: [6, 4],
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: false
            }
        ];

    const solarBeginAtZero = !isDifferences;

    const solarCanvas = document.getElementById("solarAngleChart");

    if (!solarCanvas) {
        console.warn("Canvas solarAngleChart não encontrado.");
        return;
    }

    if (!window.solarAngleChartInstance) {
        window.solarAngleChartInstance = new Chart(
            solarCanvas,
            {
                type: "line",
                data: { datasets: solarDatasets },
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
                            labels: { color: textColor }
                        },
                        tooltip: createTooltipOptions(),
                        zoom: createZoomOptions(solarTimeData, solarLimits)
                    },
                    scales: {
                        x: createTimeAxis(solarTimeData, solarLimits),
                        y: createYAxis(solarLimits, solarBeginAtZero)
                    }
                }
            }
        );
    } else {
        const chart = window.solarAngleChartInstance;

        chart.data.datasets = solarDatasets;

        updateChartAppearance(
            chart, solarTimeData, solarLimits, solarBeginAtZero
        );
        chart.update();
    }
}

function rerenderCharts() {
    if (!Array.isArray(dashboardData) || !Array.isArray(positionData)) return;

    window.electricalChartInstance?.resetZoom?.();
    window.solarAngleChartInstance?.resetZoom?.();

    renderSelectedGraph(dashboardData, positionData);
}

function setupAxisLimitControls(key, prefix, Prefix) {
    const get = suffix => document.getElementById(prefix + suffix);
    const fields = ["XMin", "XMax", "YMin", "YMax"];

    get("XMin");

    document.getElementById(`apply${Prefix}Limits`)
        .addEventListener("click", () => {
            const raw = {
                xMin: get("XMin").value,
                xMax: get("XMax").value,
                yMin: get("YMin").value,
                yMax: get("YMax").value
            };

            const xMin = timeToSeconds(raw.xMin);
            const xMax = timeToSeconds(raw.xMax);
            const yMin = numberOrUndefined(raw.yMin);
            const yMax = numberOrUndefined(raw.yMax);

            if (xMin !== null && xMax !== null && xMin >= xMax) {
                addNotification(
                    "A hora mínima deve ser menor que a hora máxima.",
                    "error"
                );
                return;
            }

            if (yMin !== undefined && yMax !== undefined && yMin >= yMax) {
                addNotification(
                    "O valor mínimo de Y deve ser menor que o máximo.",
                    "error"
                );
                return;
            }

            axisLimits[key] = raw;
            rerenderCharts();
        });

    document.getElementById(`reset${Prefix}Limits`)
        .addEventListener("click", () => {
            fields.forEach(f => { get(f).value = ""; });
            axisLimits[key] = emptyLimits();
            rerenderCharts();
        });
}

document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date();
    const formattedDate =
        today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    let lastDark = document.body.classList.contains("dark");

    new MutationObserver(() => {
        const isDark = document.body.classList.contains("dark");
        if (isDark === lastDark) return;   
        lastDark = isDark;

        if (Array.isArray(dashboardData) && Array.isArray(positionData)) {
            renderSelectedGraph(dashboardData, positionData);
        }
    }).observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
    });

    setupAxisLimitControls("electrical", "electrical", "Electrical");
    setupAxisLimitControls("solar", "solar", "Solar");

    document.getElementById('date-monitoring').value =
        formattedDate;

    document.getElementById("nav-monitoring").addEventListener(
        "click",
        async () => {
            await renderData();
        }
    );

    document.getElementById("data-submit-btn1").addEventListener(
        "click", 
        async () => {
            await renderData();
        }
    );

    document.getElementById('graphSelector').addEventListener(
        'change',
        async () => {
            if (!dashboardData && !positionData) return;

            axisLimits.electrical.yMin = "";
            axisLimits.electrical.yMax = "";
            document.getElementById("electricalYMin").value = "";
            document.getElementById("electricalYMax").value = "";

            renderSelectedGraph(dashboardData, positionData);
        }
    );

        document.getElementById('solarGraphType').addEventListener(
        'change',
        () => {
            if (!Array.isArray(positionData)) return;

            axisLimits.solar.yMin = "";
            axisLimits.solar.yMax = "";
            document.getElementById("solarYMin").value = "";
            document.getElementById("solarYMax").value = "";

            window.solarAngleChartInstance?.resetZoom?.();
            renderSelectedGraph(dashboardData, positionData);
        }
    );

    document.getElementById('sb-panel').addEventListener(
        'change', 
        async () => {
            await renderData();
        }
    );

    ["electricalChart", "solarAngleChart"].forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;

        const reset = () => Chart.getChart(canvas)?.resetZoom();

        canvas.addEventListener("dblclick", reset);

        const hammer = new Hammer(canvas);
        hammer.on("doubletap", reset);
    });
});