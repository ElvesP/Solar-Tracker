// Carregar o tema salvo
if(localStorage.getItem('theme') === 'dark'){
  document.body.classList.add('dark');
}

// Alternar o tema escuro
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
}

const toast = document.getElementById('toast');
toast.classList.remove('hidden');
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            toast.classList.add('hidden');
            resolve();
        }, ms);
    });
}
async function executar() {
    await wait(3000);
    window.location.href = "/home/";
}
executar();