//  Navegação entre páginas
const pages = ['dashboard','monitoring','control','reports'];
function navigate(p) {
  pages.forEach(id => {
    document.getElementById('page-'+id).classList.toggle('active', id===p);
    document.getElementById('nav-'+id).classList.toggle('active', id===p);
  });
  window.scrollTo(0,0);
}