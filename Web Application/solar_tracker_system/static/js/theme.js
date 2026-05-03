// Carregar o tema salvo
if(localStorage.getItem('theme') === 'dark'){
  document.body.classList.add('dark');
}

// Alternar o tema escuro
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
}