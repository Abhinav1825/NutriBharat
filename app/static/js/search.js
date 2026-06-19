/**
 * search.js - Manual food search, catalog browse, and add to log
 */

let selectedFood = null;
let allFoods = [];
let activeCategory = null;

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('food-search-input');
  const autocompleteList = document.getElementById('search-autocomplete');
  const resultsGrid = document.getElementById('results-grid');
  const noResults = document.getElementById('no-results');
  const searchPrompt = document.getElementById('search-prompt');

  // ── Load initial foods & categories ──────────────
  const [foodData, catData] = await Promise.all([
    api.get('/food/all'),
    api.get('/food/categories')
  ]);
  if (!foodData || !catData) return;

  allFoods = foodData.foods || [];
  renderCategories(catData.categories || []);
  renderGrid(allFoods.slice(0, 20)); // Show first 20 by default

  // ── Search ───────────────────────────────────────
  searchInput.addEventListener('input', utils.debounce(async () => {
    const q = searchInput.value.trim();
    searchPrompt.classList.add('hidden');

    if (!q) {
      autocompleteList.classList.remove('show');
      const filtered = activeCategory
        ? allFoods.filter(f => f.category === activeCategory)
        : allFoods.slice(0, 20);
      renderGrid(filtered);
      return;
    }

    const data = await api.get(`/food/search?q=${encodeURIComponent(q)}`);
    if (!data) return;

    renderGrid(data.results);
    renderAutocomplete(data.results);
  }, 220));

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { autocompleteList.classList.remove('show'); }
    if (e.key === 'Enter') { autocompleteList.classList.remove('show'); }
  });

  document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
      autocompleteList.classList.remove('show');
    }
  });

  function renderAutocomplete(results) {
    autocompleteList.innerHTML = '';
    if (!results.length) { autocompleteList.classList.remove('show'); return; }
    results.slice(0, 8).forEach(food => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span class="food-name">${food.name}</span><span class="food-cal">${food.calories} kcal</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        searchInput.value = food.name;
        autocompleteList.classList.remove('show');
        selectFood(food);
      });
      autocompleteList.appendChild(item);
    });
    autocompleteList.classList.add('show');
  }

  // ── Categories ───────────────────────────────────
  function renderCategories(cats) {
    const container = document.getElementById('category-chips');
    if (!container) return;
    // "All" chip
    const allChip = document.createElement('button');
    allChip.className = 'badge badge-accent';
    allChip.style.cursor = 'pointer';
    allChip.textContent = 'All';
    allChip.style.padding = '5px 12px';
    allChip.dataset.cat = '';
    allChip.classList.add('active-cat');
    allChip.addEventListener('click', () => filterByCategory('', allChip));
    container.appendChild(allChip);

    cats.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'badge badge-accent';
      chip.style.cssText = 'cursor:pointer;padding:5px 12px;background:var(--surface-2);color:var(--text-2);border:1px solid var(--border);';
      chip.textContent = cat;
      chip.dataset.cat = cat;
      chip.addEventListener('click', () => filterByCategory(cat, chip));
      container.appendChild(chip);
    });
  }

  function filterByCategory(cat, chipEl) {
    activeCategory = cat;
    document.querySelectorAll('#category-chips button').forEach(b => {
      b.style.background = 'var(--surface-2)';
      b.style.color = 'var(--text-2)';
      b.style.borderColor = 'var(--border)';
    });
    chipEl.style.background = 'var(--accent-light)';
    chipEl.style.color = 'var(--accent)';
    chipEl.style.borderColor = 'var(--accent)';

    const q = searchInput.value.trim();
    let filtered = cat ? allFoods.filter(f => f.category === cat) : allFoods;
    if (q) filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(q.toLowerCase()) ||
      (f.tags || []).some(t => t.includes(q.toLowerCase()))
    );
    renderGrid(filtered);
  }

  // ── Food Grid ─────────────────────────────────────
  function renderGrid(foods) {
    resultsGrid.innerHTML = '';
    searchPrompt.classList.add('hidden');

    if (!foods.length) {
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    foods.forEach((food, i) => {
      const card = document.createElement('div');
      card.className = 'food-result-card fade-in';
      card.style.animationDelay = `${Math.min(i * 40, 300)}ms`;
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="food-title">${food.name}</div>
        <div class="food-category">${food.category}</div>
        <div class="macro-chips">
          <span class="macro-chip cal">🔥 ${food.calories}</span>
          <span class="macro-chip prot">💪 ${food.protein}g</span>
          <span class="macro-chip carb">🌾 ${food.carbs}g</span>
          <span class="macro-chip fat">🫒 ${food.fat}g</span>
        </div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('#results-grid .food-result-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectFood(food);
      });
      resultsGrid.appendChild(card);
    });
  }

  // ── Select Food ───────────────────────────────────
  function selectFood(food) {
    selectedFood = food;
    document.getElementById('search-placeholder').classList.add('hidden');
    document.getElementById('food-detail-panel').classList.remove('hidden');

    // Update detail card
    document.getElementById('detail-food-name').textContent = food.name;
    document.getElementById('detail-food-category').textContent = `${food.category} · per ${food.serving || 100}${food.unit ? ' ' + food.unit : 'g'}`;

    updateNutritionPreview();
  }

  // ── Quantity ──────────────────────────────────────
  const qtySlider = document.getElementById('search-qty-slider');
  const qtyInput  = document.getElementById('search-qty-input');
  const qtyLabel  = document.getElementById('search-qty-label');

  if (qtySlider) {
    qtySlider.addEventListener('input', () => {
      qtyInput.value = qtySlider.value;
      updateNutritionPreview();
    });
    qtyInput.addEventListener('change', () => {
      const v = Math.max(0.25, Math.min(20, parseFloat(qtyInput.value) || 1));
      qtyInput.value = v;
      qtySlider.value = Math.min(v, 5);
      updateNutritionPreview();
    });
  }

  function getQty() { return parseFloat(qtyInput?.value) || 1; }

  function updateNutritionPreview() {
    if (!selectedFood) return;
    const qty = getQty();
    const f = selectedFood;

    const r1 = utils.round1;
    document.getElementById('detail-cal').textContent = r1(f.calories);
    document.getElementById('detail-prot').textContent = r1(f.protein);
    document.getElementById('detail-carb').textContent = r1(f.carbs);
    document.getElementById('detail-fat').textContent = r1(f.fat);

    if (qtyLabel) qtyLabel.textContent = `${qty} serving${qty !== 1 ? 's' : ''}`;

    document.getElementById('pr-cal').textContent = r1(f.calories * qty);
    document.getElementById('pr-prot').textContent = r1(f.protein * qty) + 'g';
    document.getElementById('pr-carb').textContent = r1(f.carbs * qty) + 'g';
    document.getElementById('pr-fat').textContent = r1(f.fat * qty) + 'g';
  }

  // ── Add to Log ─────────────────────────────────────
  document.getElementById('btn-search-add-log')?.addEventListener('click', async () => {
    if (!selectedFood) { showToast('Please select a food.', 'error'); return; }
    const qty = getQty();
    const mealType = document.getElementById('search-meal-type')?.value || 'Lunch';
    const f = selectedFood;

    const btn = document.getElementById('btn-search-add-log');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const result = await api.post('/logs/add', {
      food_name: f.name,
      meal_type: mealType,
      quantity: qty,
      unit: f.unit || 'serving',
      calories: utils.round1(f.calories * qty),
      protein:  utils.round1(f.protein * qty),
      carbs:    utils.round1(f.carbs * qty),
      fat:      utils.round1(f.fat * qty),
    });

    btn.disabled = false;
    btn.textContent = '✅ Add to Log';

    if (result?.success) {
      showToast(`${f.name} added to ${mealType}! 🎉`, 'success');
      if (qtySlider) qtySlider.value = 1;
      if (qtyInput) qtyInput.value = 1;
      updateNutritionPreview();
    } else {
      showToast(result?.error || 'Failed to add entry.', 'error');
    }
  });
});
