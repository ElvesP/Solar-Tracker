// Alternar a barra lateral
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// Alternar painel de configurações
function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("open");
}

// Efeito de scroll na barra superior
window.addEventListener('scroll', () => {
  document.getElementById('topbar').classList.toggle('scrolled', window.scrollY > 10);
});