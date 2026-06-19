/**
 * tracker.js - Meal Tracker: load logs, render meal sections, delete entries
 */

const MEAL_CONFIG = {
  'Breakfast': { icon: '🌅', class: 'breakfast' },
  'Lunch':     { icon: '☀️', class: 'lunch' },
  'Dinner':    { icon: '🌙', class: 'dinner' },
  'Snacks':    { icon: '🍎', class: 'snacks' },
};

document.addEventListener('DOMContentLoaded', async () => {
  // Set today's date
  const dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = utils.formatDate();

  await loadLogs();
});

async function loadLogs() {
  const data = await api.get('/logs/today');
  if (!data) return;

  const logs = data.logs;
  const container = document.getElementById('meals-container');
  const emptyState = document.getElementById('empty-state');

  // Check if any entries exist
  const totalEntries = Object.values(logs).reduce((sum, entries) => sum + entries.length, 0);

  container.innerHTML = '';

  if (totalEntries === 0) {
    emptyState.classList.remove('hidden');
    updateBanner({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    return;
  }

  emptyState.classList.add('hidden');

  // Aggregate totals
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Render each meal section
  ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].forEach(mealType => {
    const entries = logs[mealType] || [];
    const meal_cal = entries.reduce((sum, e) => sum + e.calories, 0);

    const cfg = MEAL_CONFIG[mealType];
    const section = document.createElement('div');
    section.className = `meal-section ${entries.length > 0 ? 'open' : ''}`;
    section.id = `meal-${mealType.toLowerCase()}`;

    section.innerHTML = `
      <div class="meal-header" role="button" tabindex="0" aria-expanded="${entries.length > 0}">
        <div class="meal-name">
          <div class="meal-icon ${cfg.class}">${cfg.icon}</div>
          <span>${mealType}</span>
          <span class="badge badge-accent" style="font-size:0.7rem;">${entries.length} item${entries.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="meal-cal">${utils.round1(meal_cal)} kcal</span>
          <span class="meal-chevron">▼</span>
        </div>
      </div>
      <div class="meal-entries" id="entries-${mealType}">
        ${entries.length === 0 ? '<div class="meal-empty">No entries for this meal.</div>' : ''}
      </div>
    `;

    const header = section.querySelector('.meal-header');
    header.addEventListener('click', () => toggleMeal(section));
    header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMeal(section); }});

    const entriesEl = section.querySelector(`#entries-${mealType}`);
    entries.forEach(entry => {
      entriesEl.appendChild(renderEntry(entry, mealType));
      totals.calories += entry.calories;
      totals.protein  += entry.protein;
      totals.carbs    += entry.carbs;
      totals.fat      += entry.fat;
    });

    container.appendChild(section);
  });

  updateBanner(totals);
}

function renderEntry(entry, mealType) {
  const el = document.createElement('div');
  el.className = 'log-entry fade-in';
  el.id = `entry-${entry._id}`;
  el.innerHTML = `
    <div style="flex:1;min-width:0;">
      <div class="log-entry-name">${entry.food_name}</div>
      <div class="log-entry-detail">${entry.quantity} ${entry.unit} · ${entry.protein}g P · ${entry.carbs}g C · ${entry.fat}g F</div>
    </div>
    <div class="log-entry-cal">${utils.round1(entry.calories)} kcal</div>
    <button class="btn-delete" data-id="${entry._id}" title="Delete entry" aria-label="Delete ${entry.food_name}">✕</button>
  `;
  el.querySelector('.btn-delete').addEventListener('click', () => deleteEntry(entry._id, entry.food_name));
  return el;
}

function toggleMeal(section) {
  section.classList.toggle('open');
  const header = section.querySelector('.meal-header');
  header.setAttribute('aria-expanded', section.classList.contains('open'));
}

async function deleteEntry(id, name) {
  if (!confirm(`Remove "${name}" from your log?`)) return;

  const el = document.getElementById(`entry-${id}`);
  if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.2s ease'; }

  const result = await api.delete(`/logs/${id}`);
  if (result?.success) {
    showToast(`${name} removed.`, 'info');
    setTimeout(() => loadLogs(), 300);
  } else {
    showToast('Failed to remove entry.', 'error');
    if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
  }
}

function updateBanner(totals) {
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('banner-cal',  utils.round1(totals.calories));
  set('banner-prot', utils.round1(totals.protein)  + 'g');
  set('banner-carb', utils.round1(totals.carbs)    + 'g');
  set('banner-fat',  utils.round1(totals.fat)      + 'g');
}
