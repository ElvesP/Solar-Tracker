let notifications = [];
let state = {
  az: 145.2,
  el: 42.8,
  mode: 'auto',
  moving: null,
  moveInterval: null,
  calibrating: false
};

const btn = document.getElementById('calibBtn');

async function createPanelPosition(data) {
  try{
    const response = await fetch(`/api/remote-controls/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(
        data.non_field_errors?.[0] ||
        data.detail ||
        "Erro: dados anteriores iguais aos dados enviados"
      );
    }

    const result = await response.json();

    addNotification("Dados enviados com sucesso", "success");

    return result;
  } catch (error) {
    addNotification(`${error.message}`, "error");
  }
}

async function sendPanelPosition() {
  if (state.mode === "auto") {
    const panelId = getSelectedPanelID();
    const panelData = {
      panel: panelId, 
      manual_azimuth: 0.0,
      manual_elevation: 0.0,
      mode: "automatic"
    };

    await createPanelPosition(panelData);

  } else if (state.mode === "manual") {
    const manual_az = document.getElementById('sliderAz').value
    const manual_el = document.getElementById('sliderEl').value
    const panelId = getSelectedPanelID();
    const panelData = {
      panel: panelId,
      manual_azimuth: manual_az,
      manual_elevation: manual_el,
      mode: "manual"
    };

    await createPanelPosition(panelData);

  } else {
    return;
  }
}

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

function setMode(m) {
  state.mode = m;

  document.getElementById('btnAuto').classList.toggle('active', m === 'auto');
  document.getElementById('btnManual').classList.toggle('active', m === 'manual');

  if (m === 'manual') {
    state.az = parseFloat(document.getElementById('sliderAz').value);
    state.el = parseFloat(document.getElementById('sliderEl').value);

    render();
  }
}

function updateReadings() {
  document.getElementById('readAz').textContent = `AZIMUTE: ${state.az.toFixed(1)}°`;
  document.getElementById('readEl').textContent = `ELEVAÇÃO: ${state.el.toFixed(1)}°`;
  document.getElementById('sliderAz').value = state.az;
  document.getElementById('sliderEl').value = state.el;
  draw3D();
}

function onSliderAz(v) {
  if (state.mode !== 'manual') return;

  state.az = parseFloat(v);
  render();
}

function onSliderEl(v) {
  if (state.mode !== 'manual') return;

  state.el = parseFloat(v);
  render();
}

function nudge(axis, delta) {
  if (state.mode !== 'manual') return;

  if (axis === 'az') {
    state.az = Math.max(0, Math.min(180, state.az + delta));
  } else {
    state.el = Math.max(0, Math.min(90, state.el + delta));
  }
  updateReadings();
}

function startMove(dir) {
  if (state.mode !== 'manual') return;

  state.moving = dir;
  if (state.moveInterval) return;
  state.moveInterval = setInterval(() => {
    const step = 0.1;
    if (dir === 'left')  state.az = Math.max(0, state.az - step);
    if (dir === 'right') state.az = Math.min(180, state.az + step);
    if (dir === 'up')    state.el = Math.min(90, state.el + step);
    if (dir === 'down')  state.el = Math.max(0, state.el - step);
    updateReadings();
  }, 125);
}

function stopMove() {
  clearInterval(state.moveInterval);
  state.moving = null;
  state.moveInterval = null;
}

function centerAxes() {
  if (state.mode !== 'manual') return;

  state.az = 90;
  state.el = 45;
  updateReadings();
}

function resetCalibButton() {
  btn.classList.remove('running');
  btn.textContent = 'Enviar Posição';
  btn.style.borderColor = '';
  btn.style.color = '';
  state.calibrating = false;
}

async function calibrate() {
  if (state.calibrating) return;

  state.calibrating = true;
  btn.classList.add('running');
  btn.textContent = 'A enviar...';
  let t = 0;
  const dots = ['...', '.. ', '.  '];

  const iv = setInterval(() => {
    btn.textContent = 'A enviar' + dots[t % 3];
    t++;
  }, 400);

  try {
    await sendPanelPosition();
    clearInterval(iv);
    btn.classList.remove('running');
    btn.textContent = '✓ Posição Enviada';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
  } catch (error) {
    clearInterval(iv);
    btn.classList.remove('running');
    btn.textContent = '✗ Falha ao enviar';
    btn.style.borderColor = 'red';
    btn.style.color = 'red';
    addNotification(error, "error");
  }
  setTimeout(resetCalibButton, 2000);
  const selectedPanelID = document.getElementById("sb-panel").value;
  if (selectedPanelID) {
    await getPanelStatus(selectedPanelID);
  }
}

function render() {
  updateReadings();
  draw3D();
}

function updateBackendAngles(az, el) {
  window.backendAz = az;
  window.backendEl = el;

  if (state.mode === 'auto') {
    state.az = az;
    state.el = el;
    render();
  }
}

// ── 3D CANVAS DRAW ──
const canvas = document.getElementById('antenaCanvas');
const ctx = canvas.getContext('2d');

function draw3D() {
  const isDark =
    document.body.classList.contains('dark');
  const textColor =
    isDark ? "#f5f5f5" : '#0f172a';
  const gridColor =
    isDark ? '#64748b' : '#1e2d45';
  const ground = 
    isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(71, 85, 105, 0.25)';
  const height =
    isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.8)';

  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 20;
  const azRad = -state.az * Math.PI / 180;;
  const elRad = state.el * Math.PI / 180;

  // Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const x = i * W / 4;
    const y = i * H / 4;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Ground circle
  ctx.beginPath();
  ctx.ellipse(cx, cy, 80, 24, 0, 0, Math.PI * 2);
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Azimuth indicator on ground
  const gx = cx + Math.cos(azRad) * 80;
  const gy = cy + Math.sin(azRad) * 24;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(gx, gy);
  ctx.strokeStyle = ground;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mast
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 60);
  ctx.strokeStyle = height;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arm direction from mast tip
  const armLen = 55;
  const dx = Math.cos(azRad) * Math.cos(elRad) * armLen;
  const dz = -Math.sin(elRad) * armLen;
  const dy = Math.sin(azRad) * Math.cos(elRad) * 18;

  const mastTipX = cx;
  const mastTipY = cy - 60;
  const tipX = mastTipX + dx;
  const tipY = mastTipY + dz + dy;

  // Beam cone
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  const coneLen = 50;
  const coneSpread = 14;
  const c1x = tipX + dx / armLen * coneLen + Math.cos(azRad + Math.PI/2) * coneSpread;
  const c1y = tipY + dz / armLen * coneLen - coneSpread;
  const c2x = tipX + dx / armLen * coneLen - Math.cos(azRad + Math.PI/2) * coneSpread;
  const c2y = tipY + dz / armLen * coneLen + coneSpread;
  ctx.lineTo(c1x, c1y);
  ctx.lineTo(c2x, c2y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(249,115,22,0.08)';
  ctx.strokeStyle = 'rgba(249,115,22,0.25)';
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();

  // Arm
  ctx.beginPath();
  ctx.moveTo(mastTipX, mastTipY);
  ctx.lineTo(tipX, tipY);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Dish at tip
  ctx.beginPath();
  ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Labels
  ctx.font = '9px Share Tech Mono';
  ctx.fillStyle = textColor;
  ctx.fillText('N', cx - 4, cy - 100);
  ctx.fillText('S', cx - 3, cy + 38);
  ctx.fillText('E', cx + 86, cy + 4);
  ctx.fillText('O', cx - 100, cy + 4);
}

function autoTick() {
  state.mode = window.stateMode;
  if (state.mode === 'auto' && !state.moving) {
    state.az = window.backendAz;
    state.el = window.backendEl;

    render();
  }
}

// ── INIT ──
render()
setInterval(autoTick, 150);
document.getElementById("themeBtn").addEventListener(
  "click",
  () => {
    render();
  }
)