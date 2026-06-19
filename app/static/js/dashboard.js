/**
 * dashboard.js - Chart.js 3 charts + stat cards
 */

let macroChart, trendChart, mealChart;

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboard();
});

async function loadDashboard() {
  const [summary, trend, distribution] = await Promise.all([
    api.get('/dashboard/summary'),
    api.get('/dashboard/trend?days=7'),
    api.get('/dashboard/distribution'),
  ]);

  if (!summary || !trend || !distribution) return;

  updateStatCards(summary);
  renderMacroChart(summary.macro_percentages, summary.totals);
  renderTrendChart(trend.trend);
  renderMealChart(distribution.distribution);
}

// ── Stat Cards ─────────────────────────────────────
function updateStatCards(summary) {
  const { totals, goals } = summary;

  function setCard(suffix, val, goal) {
    const statEl  = document.getElementById(`stat-${suffix}`);
    const goalEl  = document.getElementById(`goal-${suffix}`);
    const progEl  = document.getElementById(`prog-${suffix}`);
    if (statEl) statEl.textContent = utils.round1(val);
    if (goalEl) goalEl.textContent = `Goal: ${goal}${suffix === 'cal' ? ' kcal' : 'g'}`;
    if (progEl) {
      const pct = utils.clamp(Math.round(val / goal * 100), 0, 100);
      progEl.style.width = pct + '%';
    }
  }

  setCard('cal',  totals.calories, goals.calories);
  setCard('prot', totals.protein,  goals.protein);
  setCard('carb', totals.carbs,    goals.carbs);
  setCard('fat',  totals.fat,      goals.fat);

  const hasData = totals.calories > 0;
  document.getElementById('dashboard-empty')?.classList[hasData ? 'add' : 'remove']('hidden');
}

// ── Helpers ────────────────────────────────────────
function getThemeColors() {
  const isDark = document.body.classList.contains('dark');
  return {
    text:    isDark ? '#f5ede8' : '#1a1310',
    muted:   isDark ? '#8a7060' : '#9a8878',
    grid:    isDark ? '#2d2419' : '#e8ddd4',
    surface: isDark ? '#1e1813' : '#ffffff',
  };
}

function baseChartOptions(tc) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: tc.text, font: { family: 'Inter', size: 12 }, padding: 16 }
      },
      tooltip: {
        backgroundColor: tc.surface,
        titleColor: tc.text,
        bodyColor: tc.muted,
        borderColor: tc.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    }
  };
}

// ── Macro Donut Chart ──────────────────────────────
function renderMacroChart(macros, totals) {
  const ctx = document.getElementById('chart-macro')?.getContext('2d');
  if (!ctx) return;

  const tc = getThemeColors();
  const hasData = totals.calories > 0;
  const labels = ['Protein', 'Carbohydrates', 'Fat'];
  const values = hasData
    ? [macros.protein, macros.carbs, macros.fat]
    : [33, 34, 33];

  if (macroChart) macroChart.destroy();
  macroChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#27ae60', '#2980b9', '#f39c12'],
        borderColor: tc.surface,
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      ...baseChartOptions(tc),
      cutout: '65%',
      plugins: {
        ...baseChartOptions(tc).plugins,
        legend: { position: 'bottom', labels: { color: tc.text, font: { family: 'Inter', size: 12 }, padding: 16 } },
        tooltip: {
          ...baseChartOptions(tc).plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw}%`
          }
        }
      }
    }
  });
}

// ── 7-Day Trend Chart ──────────────────────────────
function renderTrendChart(trend) {
  const ctx = document.getElementById('chart-trend')?.getContext('2d');
  if (!ctx) return;

  const tc = getThemeColors();
  const labels = trend.map(d => {
    const date = new Date(d.date + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  });
  const calories = trend.map(d => d.calories);

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Calories',
          data: calories,
          backgroundColor: calories.map((_, i) => i === calories.length - 1 ? '#e8541a' : 'rgba(232,84,26,0.5)'),
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      ...baseChartOptions(tc),
      scales: {
        x: { ticks: { color: tc.muted, font: { size: 11 } }, grid: { color: tc.grid } },
        y: {
          ticks: { color: tc.muted, font: { size: 11 } },
          grid: { color: tc.grid },
          beginAtZero: true,
          title: { display: true, text: 'kcal', color: tc.muted, font: { size: 11 } }
        }
      },
      plugins: {
        ...baseChartOptions(tc).plugins,
        legend: { display: false },
        tooltip: {
          ...baseChartOptions(tc).plugins.tooltip,
          callbacks: { label: ctx => ` ${ctx.raw} kcal` }
        }
      }
    }
  });
}

// ── Meal Distribution Chart ────────────────────────
function renderMealChart(distribution) {
  const ctx = document.getElementById('chart-meals')?.getContext('2d');
  if (!ctx) return;

  const tc = getThemeColors();
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const icons  = ['🌅', '☀️', '🌙', '🍎'];
  const colors = ['#f39c12', '#27ae60', '#8e44ad', '#2980b9'];
  const values = meals.map(m => distribution[m] || 0);

  if (mealChart) mealChart.destroy();
  mealChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meals.map((m, i) => `${icons[i]} ${m}`),
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      ...baseChartOptions(tc),
      indexAxis: 'y',
      scales: {
        x: {
          ticks: { color: tc.muted, font: { size: 11 } },
          grid: { color: tc.grid },
          beginAtZero: true,
          title: { display: true, text: 'kcal', color: tc.muted, font: { size: 11 } }
        },
        y: {
          ticks: { color: tc.text, font: { size: 12 } },
          grid: { display: false }
        }
      },
      plugins: {
        ...baseChartOptions(tc).plugins,
        legend: { display: false },
        tooltip: {
          ...baseChartOptions(tc).plugins.tooltip,
          callbacks: { label: ctx => ` ${ctx.raw} kcal` }
        }
      }
    }
  });
}

// Theme-aware chart updates
window.updateChartsTheme = function() {
  // Destroy and re-render all charts when theme changes
  loadDashboard();
};
