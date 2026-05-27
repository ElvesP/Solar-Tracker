let selectedPanelId = null;
let panels = [];

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadPanels();

    document.getElementById("controlar-selecter")?.addEventListener(
        "change", handlePanelChange);
    document.getElementById("add-panel-btn")?.addEventListener(
        "click", addPanel);
    document.getElementById("remove-panel-btn")?.addEventListener(
        "click", removePanel);
    document.getElementById("rename-panel-btn")?.addEventListener(
        "click", renamePanel);
    document.querySelector(".danger-btn")?.addEventListener(
        "click", deleteAccount);
});

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}

// LOAD PANELS
async function loadPanels() {
    try {
        const res = await fetch("/api/solar-panels/");
        panels = await res.json();

        renderPanelSelector();
        updateSolarInfo();
    } catch (error) {
        console.error("Erro ao carregar painéis:", error);
    }
}


// RENDER SELECT
function renderPanelSelector() {
    const selector = document.getElementById("controlar-selecter");

    if (!selector) return;

    selector.innerHTML = "";

    let count = 0;
    panels.forEach(panel => {
        count++;
        const option = document.createElement("option");
        option.value = panel.id;
        option.textContent = `Painel ${count}`;
        selector.appendChild(option);
    });

    if (panels.length > 0) {
        selectedPanelId = panels[0].id;
        selector.value = selectedPanelId;
    }
}


// PANEL CHANGE
function handlePanelChange(event) {
    selectedPanelId = event.target.value;
    updateSolarInfo();
}


function formatTimestamp(timestamp) {
    const data = new Date(timestamp);

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()} às ${
        String(data.getHours()).padStart(2, "0")
    }:${
        String(data.getMinutes()).padStart(2, "0")
    }`;
}


// UPDATE SOLAR INFO
function updateSolarInfo() {
    const selectedPanel = panels.find(
        panel => panel.id == selectedPanelId
    );

    console.log(selectedPanel)

    document.getElementById("panel-count").textContent =
        panels.length;

    if (!selectedPanel) {
        document.getElementById("panel-name").textContent = "-";
        document.getElementById("panel-status").textContent = "-";
        document.getElementById("panel-id").textContent = "-";
        document.getElementById("panel-date-joined").textContent = "-";

        return;
    }

    document.getElementById("panel-name").textContent =
        selectedPanel.name;
    document.getElementById("panel-status").textContent =
        selectedPanel.status;
    document.getElementById("panel-id").textContent =
        selectedPanel.id;
    document.getElementById("panel-date-joined").textContent =
        formatTimestamp(selectedPanel.timestamp);
}


// ADD PANEL
async function addPanel() {
    const name = prompt("Nome do novo painel:");

    if (!name) return;

    try {
        const res = await fetch("/api/solar-panels/", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({
                name: name,
                status: "offline"
            })
        });

        if (!res.ok) throw new Error("Erro ao criar painel");

        await loadPanels();
    } catch (error) {
        console.error(error);
    }
}

// RENAME PANEL
async function renamePanel() {
    if (!selectedPanelId) {
        alert("Seleciona um painel primeiro");
        return;
    }

    const newName = prompt("Novo nome do painel:");

    if (!newName) return;

    try {
        const res = await fetch(
            `/api/solar-panels/${selectedPanelId}/`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({
                    name: newName
                })
            }
        );

        if (!res.ok) {
            throw new Error("Erro ao renomear painel");
        }

        await loadPanels();
    } catch (error) {
        console.error(error);
    }
}

// REMOVE PANEL
async function removePanel() {
    if (!selectedPanelId) {
        alert("Seleciona um painel primeiro");
        return;
    }

    const confirmDelete = confirm("Tens a certeza que queres remover este painel?");

    if (!confirmDelete) return;

    try {
        const res = await fetch(`/api/solar-panels/${selectedPanelId}/`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        });

        if (!res.ok) throw new Error("Erro ao remover painel");

        await loadPanels();
    } catch (error) {
        console.error(error);
    }
}


// DELETE ACCOUNT
async function deleteAccount() {
    const confirmDelete = confirm(
        "ATENÇÃO: Isto vai apagar a tua conta permanentemente. Continuar?"
    );

    if (!confirmDelete) return;

    try {
        const res = await fetch("/api/users/me/", {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        });

        if (!res.ok) throw new Error("Erro ao apagar conta");

        alert("Conta eliminada");

        window.location.href = "/";
    } catch (error) {
        console.error(error);
    }
}