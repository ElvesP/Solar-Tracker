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

async function getLocation(latitude, longitude) {
    const url = 
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.display_name || "Localização desconhecida";
    }    catch (error) {
        console.error("Error fetching location data:", error);

        return "Localização desconhecida";
    }
}

async function getSolarEvent(latitude, longitude) {
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
    console.log("📡 Dashboard data:", data);

    //Electrical parameters
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
    console.log("📡 Position data:", data);

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
}

function updateLocation(data) {
    console.log("📡 Location data:", data);

    //Location parameters
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

function initializeWebSocket(panelId) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(
        `${protocol}://${window.location.host}/ws/dashboard/${panelId}/`
    );

    // SOCKET EVENTS
    socket.onopen = () => {
        console.log("✅ WebSocket connected");
        statusBadge.innerText = "ONLINE";
        statusBadge.classList.add("on");
    };

    socket.onmessage = (event) => {        
        try {
            const response = JSON.parse(event.data);
            const data = response.data;

            if (response.panel === selectedPanelID) {
                if (response.type === "dashboard_data") {
                    updateDashboard(data);
                } else if (response.type === "panel_position") {
                    updatePosition(data);
                } else if (response.type === "location") {
                    updateLocation(data);         
                } else {
                    console.warn("⚠️ Unknown data type:", response.type);
                }
            } else {
                showNoConectionData();
            }
        } catch (error) {
            console.error("❌ Error processing WebSocket data:", error);
        }
    };

    socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
    };

    socket.onclose = () => {
        console.warn("⚠️ WebSocket disconnected");
        statusBadge.innerText = "OFFLINE";
        statusBadge.classList.remove("on");
        showNoConectionData();
        setTimeout(() => initializeWebSocket(selectedPanelID), 5000);
    };
}

async function loadPanels() {
    try {
        const res = await fetch("/api/solar-panels/");
        panels = await res.json();

        renderPanelSelector();
        updatePanelName();

        if (selectedPanelID) {
            initializeWebSocket(selectedPanelID);
        }

    } catch (error) {
        console.error("Erro ao carregar painéis:", error);
    }
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
        selector.value = selectedPanelID;
    }
}

function handlePanelChange(event) {
    selectedPanelID = event.target.value;
    updatePanelName();
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
});