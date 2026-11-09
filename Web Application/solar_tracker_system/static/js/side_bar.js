//  Navegação entre páginas
const pages = ['dashboard','monitoring','control','reports'];
function navigate(p) {
  pages.forEach(id => {
    document.getElementById('page-'+id).classList.toggle('active', id===p);
    document.getElementById('nav-'+id).classList.toggle('active', id===p);
  });
  window.scrollTo(0,0);
}

document.addEventListener("DOMContentLoaded", () => {
  sidebar = document.getElementById("sidebar");

  sidebar.addEventListener("mouseenter", () => {
    sidebar.classList.remove("collapsed");
  });
  sidebar.addEventListener("mouseleave", () => {
    if (sidebar.classList.contains("toggled")) {
      sidebar.classList.add("collapsed");
    }
  });
});