let backendAz = 0.0;
let backendEl = 0.0;
let currentPanelId = null;
let notifications = [];
let panels = [];
let selectedPanelID = null;
let socket= null;

// DOM ELEMENTS (DASHBOARD ELEMENTS)
const dataType = ["dashboard_data", "panel_position", "location"];
const voltageElement = document.getElementById("voltage");
const currentElement = document.getElementById("current");
const luminosityElement = document.getElementById("luminosity");
const powerElement = document.getElementById("power");
const efficiencyElement = document.getElementById("trackingEfficiency");
const locationElement = document.getElementById("location");
const solarEventElement = document.getElementById("solar-event");
const actualAzimuthElement = document.getElementById("actual-azimuth");
const theoreticalAzimuthElement = document.getElementById("theoretical-azimuth");
const azimuthDifferenceElement = document.getElementById("azimuth-difference");
const azimuthEfficiencyElement = document.getElementById("azimuth-efficiency");
const azimuthEfficiencyBar = document.getElementById("azimuth-efficiency-bar");
const cirAz = document.getElementById("azimuth-circle");
const theoreticalElevationElement = document.getElementById("theoretical-elevation");
const actualElevationElement = document.getElementById("actual-elevation");
const elevationDifferenceElement = document.getElementById("elevation-difference");
const elevationEfficiencyElement = document.getElementById("elevation-efficiency");
const elevationEfficiencyBar = document.getElementById("elevation-efficiency-bar");
const circEl = document.getElementById("elevation-circle");
const statusBadge = document.getElementById("statusBadge");

const btn = document.getElementById("notificationBtn");
const clearBtn = document.getElementById("clearNotiBtn");
const dropdown = document.getElementById("notiDropdown");
const notiList = document.getElementById("notiList");

//Control settings
const title = document.getElementById('headerTitle');
const modeBadge = document.getElementById("modeBadge");
const modeIcon = document.getElementById("modeIcon");
const modeText = document.getElementById("modeText");

async function getLocation(latitude, longitude) {
    const url = 
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.display_name || "Localização desconhecida";
    }    catch (error) {
        addNotification(`Erro ao carregar dados da localização: ${erroe}`, "error");
        return "Localização desconhecida";
    }
}

async function getPanelStatus(selectedPanelID){
    try {
        const res = await fetch(`/api/solar-panels/${selectedPanelID}`);
        const response = await fetch(`/api/remote-controls/?panel=${selectedPanelID}`);
        const paneles = await res.json();
        const panelMode = await response.json();

        if (panelMode.length>0) {
            const modal = panelMode[panelMode.length-1].mode;
            updateOperationMode(modal); 
            window.stateMode = modal;
        } else {
            const modal = "automatic"
            updateOperationMode(modal);
        }

        if(!paneles.last_seen) {
            statusBadge.innerText = "OFFLINE";
            statusBadge.classList.remove("on");

            return;
        }
 

        const now = new Date();
        const lastSeen = new Date(paneles.last_seen);
        const isOnline = (now - lastSeen)/1000/60 < 2;

        if (isOnline) {
            statusBadge.innerText = "ONLINE";
            statusBadge.classList.add("on");
        } else {
            statusBadge.innerText = "OFFLINE";
            statusBadge.classList.remove("on");
        }
    } catch (error) {
        addNotification(`Erro ao carregar painel: ${error}`, "error");
    }
}

async function getSolarEvent(latitude, longitude) {
    try {
        const url =
        `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`;
        const res = await fetch(url);
        const data = await res.json();
        const sunrise = new Date(data.results.sunrise);
        const sunset = new Date(data.results.sunset);
        const now = new Date();
        let message;

        if (now >= sunrise && now < sunset) {
            message = `Pôr do sol às ${sunset.toLocaleTimeString()}`;
        } else {
            message = `Nascer do sol às ${sunrise.toLocaleTimeString()}`;
        }

        return  message || "Localização desconhecida";
    } catch (error) {
        addNotification(`Erro ao carregar painéis: ${error}`, "error");
        return "Localização desconhecida"
    }
}

async function loadPanels() {
    try {
        const res = await fetch("/api/solar-panels/");
        panels = await res.json();

        renderPanelSelector();
        updatePanelName();

        if (selectedPanelID) {
            initializeWebSocket(selectedPanelID);
            getPanelStatus(selectedPanelID);
        }
    } catch (error) {
        addNotification(`Erro ao carregar painéis: ${error}`, "error");
    }
}

function addNotification(message, type = "info") {
    const notification = {
        id: Date.now() + Math.random(),
        message,
        type,
        time: new Date().toLocaleTimeString()
    };

    notifications.unshift(notification);
    render();
}

function deleteNotification(id) {
    const element = document.querySelector(
        `[data-id="${id}"]`
    );

    if (!element) return;
    element.classList.add("deleting");

    setTimeout(() => {
        notifications =
            notifications.filter(n => n.id !== id);
        render();
    }, 250);
}

function render() {
    notiList.innerHTML = "";
    notifications.forEach(n => {
        const item = document.createElement("div");
        item.className = "noti-item";
        item.dataset.id = n.id;
        item.textContent =
            `[${n.time}] ${n.message}`;
        item.classList.add(n.type);
        item.addEventListener("click", () => {
            deleteNotification(n.id);
        });
        addSwipeToDelete(item, n.id);
        notiList.appendChild(item);
    });

    updateBadge();
}

function addSwipeToDelete(element, id) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    element.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    element.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;

        if (diff > 0) {
            element.style.transform =
                `translateX(${diff}px)`;
        }
    });
    element.addEventListener("touchend", () => {

        isDragging = false;

        const diff = currentX - startX;

        if (diff > 80) {

            deleteNotification(id);

        } else {

            element.style.transform =
                "translateX(0)";
        }
    });
}

function updateBadge() {
    const count = notifications.length;
    btn.setAttribute("data-count", count);

    if (count === 0) {
        btn.classList.add("no");
    } else {
        btn.classList.remove("no");
    }
}

function updateOperationMode(mode) {
    if(mode === "manual"){
        title.textContent = 'Sistema em Modo Manual'
        modeIcon.innerText = "🕹️";
        modeText.innerText = "MANUAL";
        modeBadge.style.color = "#f59e0b";
    }else if (mode === "automatic"){
        title.textContent = 'Sistema em Modo Automático'
        modeIcon.innerText = "🤖";
        modeText.innerText = "AUTO";
        modeBadge.style.color = "#60a5fa";
    }
}

function clearAllNotifications() {
    notifications = [];
    render();
    updateBadge();
}

function showNoConectionData() {
    voltageElement.innerHTML = "--<span class='u'>V</span>";
    currentElement.innerHTML = "--<span class='u'>mA</span>";
    luminosityElement.innerHTML = "--<span class='u'>Lux</span>";
    powerElement.innerHTML = "--<span class='u'>W</span>";
    efficiencyElement.innerHTML = "--<span class='u'>%</span>";
    locationElement.innerHTML = "--";
    solarEventElement.innerHTML = "--";
    actualAzimuthElement.innerHTML = "--";
    theoreticalAzimuthElement.innerHTML = "--";
    azimuthDifferenceElement.innerHTML = "--";
    azimuthEfficiencyElement.innerHTML = "--";
    azimuthEfficiencyBar.style.width = "0%";
    updateCircle(cirAz, 180);
    actualElevationElement.innerHTML = "--";
    theoreticalElevationElement.innerHTML = "--";
    elevationDifferenceElement.innerHTML = "--";
    elevationEfficiencyElement.innerHTML = "--";
    elevationEfficiencyBar.style.width = "0%";
    updateCircle(circEl, 180);
}

function updateCircle(circle, value) {
    circle.setAttribute("stroke-dashoffset", `${-389.56 * (1 - value / 360)}`);
}

function calculateTrackingEfficiency(actual, theoretical) {
    const difference = Math.abs(actual - theoretical);
    const efficiency = Math.max(0,  Math.cos(difference * Math.PI / 180) * 100);
    
    return efficiency.toFixed(2);
}

function updateDashboard(data) {
    voltageElement.innerHTML =
        `${Number(data.voltage).toFixed(2)}<span class="u">V</span>`;
    currentElement.innerHTML =
        `${Number(data.current).toFixed(2)}<span class="u">mA</span>`;
    luminosityElement.innerHTML =
        `${Number(data.luminosity).toFixed(0)}<span class="u">Lux</span>`;
    powerElement.innerHTML =
        `${Number(data.power).toFixed(2)}<span class="u">W</span>`
}

function updatePosition(data) {
    efficiencyElement.innerHTML =
        `${Number(data.tracking_efficiency).toFixed(2)}<span class="u">%</span>`;

    // Azimuth container
    actualAzimuthElement.innerText =
        `${Number(data.actual_azimuth).toFixed(2)}` + "°";
    theoreticalAzimuthElement.innerText =
        `${Number(data.theoretical_azimuth).toFixed(2)}` + "°";
    azimuthDifferenceElement.innerText =
        `${(Number(data.actual_azimuth) - Number(data.theoretical_azimuth)).toFixed(2)}`;
    azimuthEfficiencyElement.innerText = 
        `${calculateTrackingEfficiency(data.actual_azimuth, data.theoretical_azimuth)}` + "%";
    azimuthEfficiencyBar.style.width = 
        `${calculateTrackingEfficiency(data.actual_azimuth, data.theoretical_azimuth)}` + "%";

    updateCircle(cirAz, data.actual_azimuth);


    // Elevation container
    actualElevationElement.innerText =
        `${Number(data.actual_elevation).toFixed(2)}` + "°";
    theoreticalElevationElement.innerText =
        `${Number(data.theoretical_elevation).toFixed(2)}` + "°";
    elevationDifferenceElement.innerText = 
        `${(Number(data.actual_elevation) - Number(data.theoretical_elevation)).toFixed(2)}`;
    elevationEfficiencyElement.innerText = 
        `${calculateTrackingEfficiency(data.actual_elevation, data.theoretical_elevation)}` + "%";
    document.getElementById("elevation-efficiency-bar").style.width =
        `${calculateTrackingEfficiency(data.actual_elevation, data.theoretical_elevation)}` + "%";

    updateCircle(circEl, data.actual_elevation);

    backendAz = Number(data.theoretical_azimuth).toFixed(1);
    backendEl = Number(data.theoretical_elevation).toFixed(1);
}

function updateLocation(data) {
    getLocation(data.latitude, data.longitude).then((location) => {
        if (location) {
            locationElement.innerText = location;
        }
    });
    
    getSolarEvent(data.latitude, data.longitude).then((event) => {
        if (event) {
            solarEventElement.innerText = event;
        }
    });
}

function onPanelChange(newPanelId) {
    backendAz = 0.0;
    backendEl = 0.0;
    initializeWebSocket(newPanelId);
    getPanelStatus(newPanelId);
}

function initializeWebSocket(panelId) {
    const protocol = 
        window.location.protocol === "https:" ? "wss" : "ws";

    if (socket && currentPanelId === panelId) {
        return;
    }

    if (socket) {
        socket.close();
        socket = null;
    }

    currentPanelId = panelId;

    const selectedPanelName = 
        document.getElementById("sb-panel").querySelector(`option[value="${panelId}"]`).textContent;
    
    socket = new WebSocket(
        `${protocol}://${window.location.host}/ws/dashboard/${panelId}/`
    );

    // SOCKET EVENTS
    socket.onopen = () => {
        addNotification(`WebSocket conectado (Painel ${selectedPanelName})`, "success");
    };

    socket.onmessage = (event) => {        
        try {
            addNotification("Microcontrolador conectado via MQTT", "system");
            const response = JSON.parse(event.data);
            const data = response.data;

            if (response.type === "dashboard_data") {
                updateDashboard(data);
            } else if (response.type === "panel_position") {
                updatePosition(data);
            } else if (response.type === "location") {
                updateLocation(data);         
            } else {
                addNotification(`Tipo de dado desconhecido: ${response.type}`, "error");
            }
        } catch (error) {
            addNotification(`Erro ao processar os dados do WebSocket: ${error}`, "error");
        }
    };

    socket.onerror = (error) => {
        addNotification(`Erro no WebSocket: ${error}`, "error");
    };

    socket.onclose = () => {
        addNotification(`WebSocket disconectado`, "system");
        showNoConectionData();

        socket = null;

        setTimeout(() => {
            if (currentPanelId === panelId) {
                initializeWebSocket(panelId);
            }
        }, 5000);
    };
}

function renderPanelSelector() {
    const selector = document.getElementById("sb-panel");

    if (!selector) return;

    selector.innerHTML = "";

    let count = 0;
    panels.forEach(panel => {
        count++;
        const option = document.createElement("option");
        option.value = panel.id;
        option.textContent = `P${count}`;
        selector.appendChild(option);
    });

    if (panels.length > 0) {
        selectedPanelID = panels[0].id;
        selector.value = selectedPanelID
    }
}

function handlePanelChange(event) {
    selectedPanelID = event.target.value;
    updatePanelName();
    onPanelChange(selectedPanelID)
}

function updatePanelName() {
    const selectedPanel = panels.find(
        panel => panel.id == selectedPanelID
    );

    if (!selectedPanel) {
        document.getElementById("panel-name").textContent = "-";
        return;
    }

    document.getElementById("panel-name").textContent = 
      selectedPanel.name;
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadPanels();

    document.getElementById("sb-panel")?.addEventListener(
        "change", handlePanelChange);
    
    if (selectedPanelID) {
        setInterval(() => {
            getPanelStatus(selectedPanelID);
        }, 30000);
    }

    clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearAllNotifications();
    });

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
        dropdown.classList.remove("open");
    });

    dropdown.addEventListener("click", (e) => {
        e.stopPropagation();
    });
});

window.addNotification = addNotification;
window.getPanelStatus = getPanelStatus;
window.backendAz = backendAz;
window.backendEl = backendEl;