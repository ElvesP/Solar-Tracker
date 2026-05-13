// Alternar a barra lateral
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// Alternar modo de operação 
function toggleSystem(){
  document.getElementById("statusDot").classList.toggle("off");
  const app = document.getElementById('statusBadge');
  app.classList.toggle('off');
  app.classList.contains('off') ? app.innerHTML = 'OFFLINE'
                                : app.innerHTML = 'ONLINE'
}

// Alternar painel de configurações
function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("open");
}

// Efeito de scroll na barra superior
window.addEventListener('scroll', () => {
  document.getElementById('topbar').classList.toggle('scrolled', window.scrollY > 10);
});