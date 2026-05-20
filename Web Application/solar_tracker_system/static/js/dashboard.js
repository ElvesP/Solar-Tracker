async function getLocation(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
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

    // DIA
    if (now >= sunrise && now < sunset) {
        message = `Pôr do sol às ${sunset.toLocaleTimeString()}`;
    }

    // 🌙 NOITE
    else {
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
    const cirAz = document.getElementById("azimuth-circle");
    const circEl = document.getElementById("elevation-circle");

    efficiencyElement.innerHTML =
        `${Number(data.tracking_efficiency).toFixed(2)}<span class="u">%</span>`;

    // Azimuth container
    document.getElementById("actual-azimuth").innerText =
        `${Number(data.actual_azimuth).toFixed(2)}` + "°";
    document.getElementById("theoretical-azimuth").innerText =
        `${Number(data.theoretical_azimuth).toFixed(2)}` + "°";
    document.getElementById("azimuth-difference").innerText =
        `${Number(data.actual_azimuth).toFixed(2) - Number(data.theoretical_azimuth).toFixed(2)}`;
    document.getElementById("eff-azimuth").innerText = 
        `${calculateTrackingEfficiency(data.actual_azimuth, data.theoretical_azimuth)}` + "%";
    document.getElementById("eff-azimuthG").style.width = 
        `${calculateTrackingEfficiency(data.actual_azimuth, data.theoretical_azimuth)}` + "%";

    updateCircle(cirAz, data.actual_azimuth);


    // Elevation container
    document.getElementById("actual-elevation").innerText =
        `${Number(data.actual_elevation).toFixed(2)}` + "°";
    document.getElementById("theoretical-elevation").innerText =
        `${Number(data.theoretical_elevation).toFixed(2)}` + "°";
    document.getElementById("elevation-difference").innerText = 
        `${Number(data.actual_elevation).toFixed(2) - Number(data.theoretical_elevation).toFixed(2)}`;
    document.getElementById("eff-elevation").innerText = 
        `${calculateTrackingEfficiency(data.actual_elevation, data.theoretical_elevation)}` + "%";
    document.getElementById("eff-elevationG").style.width =
        `${calculateTrackingEfficiency(data.actual_elevation, data.theoretical_elevation)}` + "%";

    updateCircle(circEl, data.actual_elevation);
}

function updateLocation(data) {
    console.log("📡 Location data:", data);

    //Location parameters
    getLocation(data.latitude, data.longitude).then((location) => {
        if (location) {
            document.getElementById("location").innerText = location;
        }
    });
    
    getSolarEvent(data.latitude, data.longitude).then((event) => {
        if (event) {
            document.getElementById("solar-event").innerText = event;
        }
    });
}

const protocol = window.location.protocol === "https:" ? "wss" : "ws";

const socket = new WebSocket(
    `${protocol}://${window.location.host}/ws/dashboard/`
);


// =========================
// DOM ELEMENTS
// =========================
const dataType = ["dashboard_data", "panel_position", "location"];
const voltageElement = document.getElementById("voltage");
const currentElement = document.getElementById("current");
const luminosityElement = document.getElementById("luminosity");
const powerElement = document.getElementById("power");
const efficiencyElement = document.getElementById("trackingEfficiency");
const statusBadge = document.getElementById("statusBadge");


// =========================
// SOCKET EVENTS
// =========================
socket.onopen = () => {
    console.log("✅ WebSocket connected");
    statusBadge.innerText = "ONLINE";
    statusBadge.classList.add("on");
};


socket.onmessage = (event) => {
    
    try {
        const response = JSON.parse(event.data);
        const data = response.data;

        if (statusBadge.classList.contains("on")) {
            if (response.type === "dashboard_data") {
                updateDashboard(data);
            } else if (response.type === "panel_position") {
                updatePosition(data);
            } else if (response.type === "location") {
                updateLocation(data);         
            } else {
                console.warn("⚠️ Unknown data type:", response.type);
            }
        };
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
};