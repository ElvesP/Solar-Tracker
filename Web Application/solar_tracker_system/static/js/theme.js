const themePreference = 'theme';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function getActiveTheme() {
  const savedTheme = localStorage.getItem(themePreference);

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return systemTheme.matches ? 'dark' : 'light';
}

function applyTheme() {
  const activeTheme = getActiveTheme();

  document.body.classList.toggle('dark', activeTheme === 'dark');
  document.documentElement.style.colorScheme = activeTheme;
}

function toggleTheme() {
  const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';

  localStorage.setItem(themePreference, nextTheme);
  applyTheme();
}

function useSystemTheme() {
  localStorage.setItem(themePreference, 'system');
  applyTheme();
}

systemTheme.addEventListener('change', () => {
  const savedTheme = localStorage.getItem(themePreference);

  if (!savedTheme || savedTheme === 'system') {
    applyTheme();
  }
});

applyTheme();
useSystemTheme();

window.useSystemTheme = useSystemTheme;