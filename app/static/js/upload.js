/**
 * upload.js - Image upload + food identification
 */

let selectedFood = null;
let selectedFoodData = null;
let uploadedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput  = document.getElementById('file-input');
  const previewSection = document.getElementById('preview-section');
  const previewImg = document.getElementById('preview-img');
  const btnIdentify = document.getElementById('btn-identify');
  const btnClear = document.getElementById('btn-clear-upload');

  // ── Drag & Drop ──────────────────────────────────
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Please upload an image file (PNG, JPG, WEBP)', 'error');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      showToast('File too large. Max 16MB.', 'error');
      return;
    }
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewSection.classList.remove('hidden');
      // Reset results
      document.getElementById('results-section').classList.add('hidden');
      document.getElementById('result-placeholder').classList.remove('hidden');
      selectedFood = null;
      selectedFoodData = null;
    };
    reader.readAsDataURL(file);
  }

  // ── Clear ────────────────────────────────────────
  btnClear.addEventListener('click', () => {
    previewSection.classList.add('hidden');
    previewImg.src = '';
    uploadedFile = null;
    fileInput.value = '';
    selectedFood = null;
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('result-placeholder').classList.remove('hidden');
  });

  // ── Identify Food ────────────────────────────────
  btnIdentify.addEventListener('click', async () => {
    if (!uploadedFile) { showToast('Please select an image first.', 'error'); return; }

    const spinner = document.getElementById('identify-spinner');
    const textEl  = document.getElementById('identify-text');
    btnIdentify.disabled = true;
    spinner.classList.remove('hidden');
    textEl.textContent = 'Identifying...';

    const formData = new FormData();
    formData.append('image', uploadedFile);

    const data = await api.postForm('/food/upload', formData);

    btnIdentify.disabled = false;
    spinner.classList.add('hidden');
    textEl.textContent = '🔍 Identify Food';

    if (!data) return;
    if (data.error && !data.matched_foods?.length) {
      showToast('Error: ' + data.error, 'error');
      return;
    }

    renderResults(data);
  });

  // ── Render Detection Results ─────────────────────
  function renderResults(data) {
    document.getElementById('result-placeholder').classList.add('hidden');
    const section = document.getElementById('results-section');
    section.classList.remove('hidden');

    const badge = document.getElementById('detection-badge');
    const container = document.getElementById('food-matches');
    container.innerHTML = '';

    const foods = data.matched_foods || [];
    const unmatched = data.unmatched_labels || [];

    badge.textContent = `${foods.length} match${foods.length !== 1 ? 'es' : ''}`;

    if (foods.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-2);">
          <p>No Indian foods recognized. Try manual search below.</p>
        </div>`;
      document.getElementById('fallback-section').classList.remove('hidden');
    } else {
      foods.forEach((m, i) => {
        const food = m.food;
        const card = document.createElement('div');
        card.className = 'food-result-card fade-in';
        card.style.animationDelay = `${i * 80}ms`;
        card.dataset.foodName = food.name;
        card.innerHTML = `
          <div class="confidence-badge">${Math.round(m.confidence * 100)}%</div>
          <div class="food-title">${food.name}</div>
          <div class="food-category">${food.category} · ${food.unit}</div>
          <div class="macro-chips">
            <span class="macro-chip cal">🔥 ${food.calories} kcal</span>
            <span class="macro-chip prot">💪 ${food.protein}g protein</span>
            <span class="macro-chip carb">🌾 ${food.carbs}g carbs</span>
            <span class="macro-chip fat">🫒 ${food.fat}g fat</span>
          </div>
        `;
        card.addEventListener('click', () => selectFood(card, food));
        container.appendChild(card);

        // Auto-select first match
        if (i === 0) selectFood(card, food);
      });

      if (unmatched.length > 0) {
        document.getElementById('fallback-section').classList.remove('hidden');
      }
    }
  }

  // ── Select Food ───────────────────────────────────
  function selectFood(card, food) {
    document.querySelectorAll('.food-result-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedFoodData = food;

    const addSection = document.getElementById('add-to-log-section');
    addSection.classList.remove('hidden');

    // Show selected food info
    const infoEl = document.getElementById('selected-food-info');
    infoEl.innerHTML = `
      <div style="background:var(--accent-light);border-radius:var(--radius-md);padding:12px 14px;">
        <p style="font-size:0.78rem;color:var(--text-3);margin-bottom:2px;">Selected Food</p>
        <p style="font-weight:600;color:var(--text);">${food.name}</p>
        <p style="font-size:0.78rem;color:var(--text-2);">${food.calories} kcal · ${food.protein}g protein / ${food.carbs}g carbs / ${food.fat}g fat per serving</p>
      </div>`;

    updateNutritionPreview();
  }

  // ── Fallback Search ───────────────────────────────
  const fallbackSearch = document.getElementById('fallback-search');
  const fallbackAC = document.getElementById('fallback-autocomplete');

  if (fallbackSearch) {
    fallbackSearch.addEventListener('input', utils.debounce(async () => {
      const q = fallbackSearch.value.trim();
      if (!q) { fallbackAC.classList.remove('show'); return; }
      const data = await api.get(`/food/search?q=${encodeURIComponent(q)}`);
      if (!data) return;
      renderAutocomplete(fallbackAC, data.results, fallbackSearch);
    }, 250));

    document.addEventListener('click', e => {
      if (!fallbackSearch.contains(e.target)) fallbackAC.classList.remove('show');
    });
  }

  function renderAutocomplete(list, results, input) {
    list.innerHTML = '';
    if (!results.length) { list.classList.remove('show'); return; }
    results.forEach(food => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span class="food-name">${food.name}</span><span class="food-cal">${food.calories} kcal</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = food.name;
        list.classList.remove('show');
        // Create a fake card for selection
        const fakeCard = document.createElement('div');
        fakeCard.className = 'food-result-card';
        selectFood(fakeCard, food);
        document.getElementById('fallback-section').appendChild(fakeCard);
      });
      list.appendChild(item);
    });
    list.classList.add('show');
  }

  // ── Quantity Slider ────────────────────────────────
  const qtySlider = document.getElementById('qty-slider');
  const qtyInput  = document.getElementById('qty-input');
  const qtyLabel  = document.getElementById('qty-label');

  if (qtySlider) {
    qtySlider.addEventListener('input', () => {
      qtyInput.value = qtySlider.value;
      updateNutritionPreview();
      updateLabel();
    });
    qtyInput.addEventListener('change', () => {
      const v = Math.max(0.25, Math.min(20, parseFloat(qtyInput.value) || 1));
      qtyInput.value = v;
      qtySlider.value = Math.min(v, 5);
      updateNutritionPreview();
      updateLabel();
    });
  }

  function updateLabel() {
    const qty = parseFloat(qtyInput.value) || 1;
    if (qtyLabel) qtyLabel.textContent = `${qty} serving${qty !== 1 ? 's' : ''}`;
  }

  function updateNutritionPreview() {
    if (!selectedFoodData) return;
    const qty = parseFloat(qtyInput?.value) || 1;
    const f = selectedFoodData;
    const preview = document.getElementById('nutrition-preview');
    if (!preview) return;
    preview.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">
        <div style="background:var(--accent-light);border-radius:var(--radius-md);padding:10px;">
          <div style="font-weight:700;color:var(--accent);">${utils.round1(f.calories * qty)}</div>
          <div style="font-size:0.72rem;color:var(--text-3);">kcal</div>
        </div>
        <div style="background:var(--green-light);border-radius:var(--radius-md);padding:10px;">
          <div style="font-weight:700;color:var(--green);">${utils.round1(f.protein * qty)}g</div>
          <div style="font-size:0.72rem;color:var(--text-3);">protein</div>
        </div>
        <div style="background:var(--blue-light);border-radius:var(--radius-md);padding:10px;">
          <div style="font-weight:700;color:var(--blue);">${utils.round1(f.carbs * qty)}g</div>
          <div style="font-size:0.72rem;color:var(--text-3);">carbs</div>
        </div>
        <div style="background:var(--yellow-light);border-radius:var(--radius-md);padding:10px;">
          <div style="font-weight:700;color:var(--yellow);">${utils.round1(f.fat * qty)}g</div>
          <div style="font-size:0.72rem;color:var(--text-3);">fat</div>
        </div>
      </div>`;
  }

  // ── Add to Log ─────────────────────────────────────
  document.getElementById('btn-add-log')?.addEventListener('click', async () => {
    if (!selectedFoodData) { showToast('Please select a food first.', 'error'); return; }
    const qty = parseFloat(qtyInput?.value) || 1;
    const mealType = document.getElementById('meal-type-select')?.value || 'Lunch';
    const f = selectedFoodData;

    const payload = {
      food_name: f.name,
      meal_type: mealType,
      quantity: qty,
      unit: f.unit || 'serving',
      calories: utils.round1(f.calories * qty),
      protein:  utils.round1(f.protein * qty),
      carbs:    utils.round1(f.carbs * qty),
      fat:      utils.round1(f.fat * qty),
    };

    const btn = document.getElementById('btn-add-log');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const result = await api.post('/logs/add', payload);
    btn.disabled = false;
    btn.textContent = '✅ Add to Log';

    if (result?.success) {
      showToast(`${f.name} added to ${mealType}! 🎉`, 'success');
      // Reset quantity after add
      if (qtySlider) qtySlider.value = 1;
      if (qtyInput) qtyInput.value = 1;
      updateNutritionPreview();
      updateLabel();
    } else {
      showToast(result?.error || 'Failed to add entry.', 'error');
    }
  });
});
