const ctx = document.getElementById('energyChart').getContext('2d');

let chart;

// Dados simulados
const datasets = {
    week: {
        labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
        data: [120, 150, 180, 140, 200, 170, 190]
    },
    month: {
        labels: Array.from({length: 30}, (_, i) => `Dia ${i+1}`),
        data: Array.from({length: 30}, () => Math.floor(Math.random() * 200))
    },
    year: {
        labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
        data: [3200, 2800, 3500, 4000, 4200, 4500, 4800, 4700, 4300, 3900, 3600, 3400]
    }
};

// Criar gráfico
function createChart(type) {
    const config = datasets[type];
    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: config.labels,
            datasets: [{
                label: 'Geração de Energia (kWh)',
                data: config.data,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Inicial
createChart('week');

// Evento de troca
document.getElementById('rangeSelect').addEventListener('change', (e) => {
    createChart(e.target.value);
});