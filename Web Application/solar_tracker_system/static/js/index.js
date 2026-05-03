// Carregar o tema salvo
if(localStorage.getItem('theme') === 'dark'){
  document.body.classList.add('dark');
}

// Alternar o tema escuro
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
}

// ══════════════════════════════════
// DASHBOARD CHART
// ══════════════════════════════════
(function buildDashChart(){
  const data=[
    {h:800,a:false},{h:1200,a:false},{h:2000,a:false},{h:3200,a:false},
    {h:4100,a:true},{h:4820,a:true},{h:4700,a:true},{h:4500,a:true},
    {h:4000,a:true},{h:3600,a:false},{h:2800,a:false},{h:1900,a:false},
    {h:1100,a:false},{h:600,a:false}
  ];
  const max=Math.max(...data.map(d=>d.h));
  const chart=document.getElementById('dashChart');
  const cx=chart.querySelector('.cx');
  data.forEach(d=>{
    const w=document.createElement('div');w.className='bc';
    const b=document.createElement('div');
    b.className='bar '+(d.a?'a':'i');
    b.style.height=`${(d.h/max)*100}%`;
    const t=document.createElement('div');t.className='btt';t.textContent=`${d.h.toLocaleString()} W`;
    b.appendChild(t);w.appendChild(b);
    chart.insertBefore(w,cx);
  });
  document.querySelectorAll('.chtab').forEach(tb=>{
    tb.addEventListener('click',()=>{
      document.querySelectorAll('.chtab').forEach(t=>t.classList.remove('active'));
      tb.classList.add('active');
    });
  });
})();

// ══════════════════════════════════
// MONITORING LINE CHART
// ══════════════════════════════════
let lineBuilt=false;
function buildLineChart(){
  if(lineBuilt) return; lineBuilt=true;
  const svg=document.getElementById('lineChart');
  const W=700,H=220,pad={t:20,r:10,b:28,l:10};
  const ds=[
    {c:'#3b82f6',p:[180,220,310,370,430,510,580,650,720,780,842]},
    {c:'#f97316',p:[80,110,140,180,220,280,340,390,440,490,530]},
    {c:'#22c55e',p:[130,170,240,280,350,420,480,530,580,640,700]},
    {c:'#8b5cf6',p:[60,90,120,150,190,230,270,310,350,380,410]},
  ];
  const maxV=900,pts=ds[0].p.length;
  const tx=i=>pad.l+(i/(pts-1))*(W-pad.l-pad.r);
  const ty=v=>pad.t+(1-v/maxV)*(H-pad.t-pad.b);
  [.25,.5,.75,1].forEach(t=>{
    const y=pad.t+(1-t)*(H-pad.t-pad.b);
    const l=document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',pad.l);l.setAttribute('x2',W-pad.r);
    l.setAttribute('y1',y);l.setAttribute('y2',y);
    l.setAttribute('stroke','#e8e8e4');l.setAttribute('stroke-width','1');
    svg.appendChild(l);
  });
  ds.forEach(d=>{
    const area=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    const acoords=d.p.map((v,i)=>`${tx(i)},${ty(v)}`).join(' ');
    area.setAttribute('points',`${tx(0)},${H-pad.b} ${acoords} ${tx(pts-1)},${H-pad.b}`);
    area.setAttribute('fill',d.c);area.setAttribute('opacity','0.07');
    svg.appendChild(area);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    const dd=d.p.map((v,i)=>`${i===0?'M':'L'}${tx(i)},${ty(v)}`).join(' ');
    path.setAttribute('d',dd);path.setAttribute('fill','none');
    path.setAttribute('stroke',d.c);path.setAttribute('stroke-width','2.5');
    path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');
    svg.appendChild(path);
  });
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
  dot.setAttribute('cx',tx(pts-1));dot.setAttribute('cy',ty(ds[0].p[pts-1]));
  dot.setAttribute('r','5');dot.setAttribute('fill','#3b82f6');
  dot.setAttribute('stroke','#fff');dot.setAttribute('stroke-width','2');
  svg.appendChild(dot);
}

// ══════════════════════════════════
// REPORTS BAR CHART
// ══════════════════════════════════
let repBuilt=false;
function buildRepChart(){
  if(repBuilt) return; repBuilt=true;
  const data=[
    {l:'SEG',v:540,t:'gy'},{l:'TER',v:610,t:'gy'},{l:'QUA',v:700,t:'gy'},
    {l:'QUI',v:820,t:'dk'},{l:'SEX',v:760,t:'am'},{l:'SAB',v:695,t:'am'},{l:'DOM',v:640,t:'am'}
  ];
  const max=Math.max(...data.map(d=>d.v));
  const chart=document.getElementById('repChart');
  const gl=chart.querySelector('.rgl');
  data.forEach(d=>{
    const col=document.createElement('div');col.className='rbc';
    const bar=document.createElement('div');bar.className=`rb ${d.t}`;
    bar.style.height=`${(d.v/max)*100}%`;
    const tip=document.createElement('div');tip.className='rt';tip.textContent=`${d.v} kWh`;
    bar.appendChild(tip);
    const lbl=document.createElement('div');lbl.className=`rbl${d.t==='dk'?' bld':''}`;lbl.textContent=d.l;
    col.appendChild(bar);col.appendChild(lbl);
    chart.insertBefore(col,gl);
  });
}

// ══════════════════════════════════
// CONTROL LOGIC
// ══════════════════════════════════
let az=145.2,el=42.8;
function updAz(v){az=parseFloat(v);document.getElementById('azBadge').textContent=`AZIMUTE: ${az.toFixed(1)}°`;upd3D()}
function updEl(v){el=parseFloat(v);document.getElementById('elBadge').textContent=`ELEVAÇÃO: ${el.toFixed(1)}°`;upd3D()}
function upd3D(){
  const p=document.getElementById('panel3d');
  p.style.transform=`rotateX(${20-(el/90)*30}deg) rotateZ(${-8+(az/360)*16-8}deg)`;
}
function adjSl(axis,d){
  if(axis==='hz'){const s=document.getElementById('slHz');s.value=Math.min(360,Math.max(0,+s.value+d));updAz(s.value)}
  else{const s=document.getElementById('slVt');s.value=Math.min(90,Math.max(0,+s.value+d));updEl(s.value)}
}
function move(dir){
  if(dir==='left') adjSl('hz',-5);
  else if(dir==='right') adjSl('hz',5);
  else if(dir==='up') adjSl('vt',5);
  else adjSl('vt',-5);
}
function setMode(m){
  const isAuto=m==='auto';
  document.getElementById('btnAuto').classList.toggle('active',isAuto);
  document.getElementById('btnManual').classList.toggle('active',!isAuto);
  const mt=document.getElementById('modeText');
  mt.textContent=isAuto?'Automático':'Manual';
  mt.style.color=isAuto?'var(--accent)':'var(--blue)';
  const ind=document.getElementById('modeInd');
  ind.style.background=isAuto?'var(--green)':'var(--blue)';
  ind.style.boxShadow=isAuto?'0 0 0 2px #bbf7d0':'0 0 0 2px #bfdbfe';
}
function calibrate(){
  const b=document.getElementById('calBtn');
  b.textContent='⟳ CALIBRANDO...';b.style.opacity='.7';
  setTimeout(()=>{b.textContent='✔ CALIBRAÇÃO CONCLUÍDA';setTimeout(()=>{b.textContent='CALIBRAR POSIÇÃO';b.style.opacity='1'},1500)},1800);
}
function adjInt(d){const i=document.getElementById('intInp');i.value=Math.max(100,Math.min(5000,+i.value+d))}
function saveP(b){const o=b.innerHTML;b.innerHTML='✔ SALVO';b.style.opacity='.7';setTimeout(()=>{b.innerHTML=o;b.style.opacity='1'},1500)}

// ══════════════════════════════════
// SHARED
// ══════════════════════════════════
let liveOn=true;
function toggleLive(){
  liveOn=!liveOn;
  const b=document.getElementById('liveBtn');
  b.innerHTML=liveOn?'<span style="width:7px;height:7px;border-radius:50%;background:var(--green);display:inline-block;animation:blink 1.5s infinite"></span> Live Sync':'⏸ Paused';
  b.style.background=liveOn?'var(--dark)':'#666';
}
function exportCSV(b){const o=b.innerHTML;b.innerHTML='✔ Exportado';b.style.opacity='.7';setTimeout(()=>{b.innerHTML=o;b.style.opacity='1'},1800)}
function exportData(b,t){exportCSV(b)}
function emergencyStop(){if(confirm('⚠️ Confirmar PARADA DE EMERGÊNCIA?')){document.body.style.filter='saturate(0)';alert('Sistema parado.')}}

// Style blink
const s=document.createElement('style');
s.textContent='@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}';
document.head.appendChild(s);