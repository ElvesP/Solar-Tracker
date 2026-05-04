let state = {
  az: 145.2,
  el: 42.8,
  mode: 'auto',
  moving: null,
  moveInterval: null,
  rssi: -64,
  temp: 38,
  uptime: 0,
  calibrating: false
};

// ── MODE TOGGLE ──
function setMode(m) {
  state.mode = m;
  document.getElementById('btnAuto').classList.toggle('active', m === 'auto');
  document.getElementById('btnManual').classList.toggle('active', m === 'manual');
  const title = document.getElementById('headerTitle');
  m === 'auto' ? title.textContent = 'Sistema em Modo Automático'
    : title.textContent = 'Sistema em Modo Manual';
}

// ── READINGS ──
function updateReadings() {
  document.getElementById('readAz').textContent = `AZIMUTE: ${state.az.toFixed(1)}°`;
  document.getElementById('readEl').textContent = `ELEVAÇÃO: ${state.el.toFixed(1)}°`;
  document.getElementById('sliderAz').value = state.az;
  document.getElementById('sliderEl').value = state.el;
  draw3D();
}

// ── SLIDERS ──
function onSliderAz(v) {
  state.az = parseFloat(v);
  updateReadings();
}

function onSliderEl(v) {
  state.el = parseFloat(v);
  updateReadings();
}

function nudge(axis, delta) {
  if (axis === 'az') {
    state.az = Math.max(0, Math.min(360, state.az + delta));
  } else {
    state.el = Math.max(0, Math.min(90, state.el + delta));
  }
  updateReadings();
}

// ── JOYSTICK ──
function startMove(dir) {
  state.moving = dir;
  state.moveInterval = setInterval(() => {
    const step = 0.5;
    if (dir === 'left')  state.az = Math.max(0, state.az - step);
    if (dir === 'right') state.az = Math.min(360, state.az + step);
    if (dir === 'up')    state.el = Math.min(90, state.el + step);
    if (dir === 'down')  state.el = Math.max(0, state.el - step);
    updateReadings();
  }, 50);
}

function stopMove() {
  clearInterval(state.moveInterval);
  state.moving = null;
}

function centerAxes() {
  state.az = 180;
  state.el = 45;
  updateReadings();
  flash('Eixos Centralizados');
}

// ── CALIBRATE ──
function calibrate() {
  if (state.calibrating) return;
  state.calibrating = true;
  const btn = document.getElementById('calibBtn');
  btn.classList.add('running');
  btn.textContent = 'A calibrar...';
  let t = 0;
  const dots = ['...', '.. ', '.  '];
  const iv = setInterval(() => {
    btn.textContent = 'A calibrar' + dots[t % 3];
    t++;
  }, 400);
  setTimeout(() => {
    clearInterval(iv);
    btn.classList.remove('running');
    btn.textContent = '✓ Calibração Concluída';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    setTimeout(() => {
      btn.textContent = 'Calibrar Posição';
      btn.style.borderColor = '';
      btn.style.color = '';
      state.calibrating = false;
    }, 2000);
  }, 3000);
}

// ── FLASH MESSAGE ──
function flash(msg) {
  const el = document.getElementById('tooltip');
  el.textContent = msg;
  el.style.opacity = 1;
  el.style.left = '50%';
  el.style.top = '80px';
  el.style.transform = 'translateX(-50%)';
  setTimeout(() => { el.style.opacity = 0; }, 1500);
}

// ── 3D CANVAS DRAW ──
const canvas = document.getElementById('antenaCanvas');
const ctx = canvas.getContext('2d');

function draw3D() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 20;
  const azRad = (state.az - 90) * Math.PI / 180;
  const elRad = state.el * Math.PI / 180;

  // Grid
  ctx.strokeStyle = '#1e2d45';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const x = i * W / 4;
    const y = i * H / 4;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Ground circle
  ctx.beginPath();
  ctx.ellipse(cx, cy, 80, 24, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#1e2d45';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Azimuth indicator on ground
  const gx = cx + Math.cos(azRad) * 80;
  const gy = cy + Math.sin(azRad) * 24;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(gx, gy);
  ctx.strokeStyle = 'rgba(249,115,22,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mast
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 60);
  ctx.strokeStyle = '#64748b';
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
  ctx.fillStyle = '#64748b';
  ctx.fillText('N', cx - 4, cy - 100);
  ctx.fillText('S', cx - 3, cy + 38);
  ctx.fillText('E', cx + 86, cy + 4);
  ctx.fillText('W', cx - 100, cy + 4);
}

// ── AUTO MODE ANIMATION ──
function autoTick() {
  if (state.mode === 'auto' && !state.moving) {
    state.az += 0.08;
    if (state.az > 360) state.az -= 360;
    state.el = 45 + Math.sin(Date.now() / 4000) * 15;
    updateReadings();
  }
}

// ── INIT ──
updateReadings();
draw3D();
setInterval(autoTick, 50);