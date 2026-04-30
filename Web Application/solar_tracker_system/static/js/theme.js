// SIDEBAR TOGGLE
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// DARK MODE
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
}

// LOAD THEME
if(localStorage.getItem('theme') === 'dark'){
  document.body.classList.add('dark');
}