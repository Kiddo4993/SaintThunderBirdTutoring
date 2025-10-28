/* ====== Saint Thunderbird - Theme Toggle (Load First) ====== */

window.toggleTheme = function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  
  if (isLight) {
    try { localStorage.setItem('st-theme', 'light'); } catch {}
  } else {
    try { localStorage.setItem('st-theme', 'dark'); } catch {}
  }

  // Update theme button
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = isLight ? '☀️' : '🌓';
  }
};

// Load saved theme immediately
try {
  const saved = localStorage.getItem('st-theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light-mode');
    document.body.classList.add('light-mode');
  }
} catch (e) {
  console.warn('Could not load theme');
}

// Update button when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn && document.body.classList.contains('light-mode')) {
    themeBtn.textContent = '☀️';
  }
});