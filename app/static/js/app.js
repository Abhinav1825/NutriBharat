/**
 * app.js - Core utilities: theme, toast, nav, auth
 */

// ─── Theme Management ────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark');
  }
})();

function updateThemeIcon() {
  const isDark = document.body.classList.contains('dark');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcon();
      // Update Chart.js charts if present
      if (window.updateChartsTheme) window.updateChartsTheme();
    });
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.textContent = '☰';
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/auth/login';
    });
  }

  // Mark active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    }
  });
});

// ─── Toast Notifications ─────────────────────────
window.showToast = function(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ─── Loading Overlay ──────────────────────────────
window.showLoading = function(text = 'Processing...') {
  const overlay = document.getElementById('loading-overlay');
  const textEl = document.getElementById('loading-text');
  if (overlay) { overlay.classList.add('show'); overlay.setAttribute('aria-hidden', 'false'); }
  if (textEl) textEl.textContent = text;
};
window.hideLoading = function() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden', 'true'); }
};

// ─── API Helpers ──────────────────────────────────
window.api = {
  async get(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/auth/login'; return null; }
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
    if (res.status === 401) { window.location.href = '/auth/login'; return null; }
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/auth/login'; return null; }
    return res.json();
  },
  async postForm(url, formData) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });
    if (res.status === 401) { window.location.href = '/auth/login'; return null; }
    return res.json();
  }
};

// ─── Utility Functions ────────────────────────────
window.utils = {
  formatDate(date = new Date()) {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  },
  round1(n) { return Math.round(n * 10) / 10; },
  clamp(val, min, max) { return Math.min(Math.max(val, min), max); },
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};
