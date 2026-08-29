// Shared DOM builders for product cards / gallery tiles, used by index.html,
// shop.html, and admin.html's live preview — keeps one source of truth for the
// markup the site's existing CSS, filter-tab, and quick-view code expect.

function formatPeso(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH');
}

function parsePrice(text) {
  return Number(String(text).replace(/[^\d.]/g, '')) || 0;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function badgeFor(product) {
  if (product.best_seller) return 'Best Seller';
  if (product.new_arrival) return 'New';
  return '';
}

// Shared <img onerror="handleImgError(this)"> fallback for every page that renders
// Supabase Storage photos — swaps in a neutral placeholder instead of a broken-image
// icon, and clears the handler first so a bad placeholder path can't loop.
const IMG_FALLBACK_SRC = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#1a1a1a"/><g fill="none" stroke="#555" stroke-width="1.5"><path d="M100 150h100v100H100z"/><path d="M100 250l30-35 25 28 20-22 25 29"/><circle cx="180" cy="175" r="8"/></g></svg>'
);
function handleImgError(img) {
  img.onerror = null;
  img.src = IMG_FALLBACK_SRC;
}

// Builds the same .product-card markup shop.html's cards already use, so the
// existing CSS, delegated Quick View / product-page-link click handler, and (on
// shop.html) the category filter tabs keep working unchanged against it.
function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = product.id;
  card.dataset.category = product.category;
  card.dataset.sizes = (product.sizes || []).join(',');
  card.dataset.desc = product.description || '';
  card.dataset.img = product.image_url || '';
  const gallery = (product.image_urls && product.image_urls.length) ? product.image_urls : [product.image_url].filter(Boolean);
  card.dataset.images = JSON.stringify(gallery);

  const badge = badgeFor(product);
  const swatches = (product.swatch_colors || [])
    .map(hex => `<span class="swatch" style="background:${escapeHtml(hex)}"></span>`)
    .join('');

  card.innerHTML = `
    <div class="ph">
      ${badge ? `<span class="badge">${escapeHtml(badge)}</span>` : ''}
      <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" onerror="handleImgError(this)">
      <div class="quick-view-btn">Quick View</div>
    </div>
    <div class="product-info">
      <div class="p-cat">${escapeHtml(categoryLabel(product.category))}</div>
      <div class="p-name">${escapeHtml(product.name)}</div>
      <div class="p-price">${formatPeso(product.price)}</div>
      ${swatches ? `<div class="swatches">${swatches}</div>` : ''}
    </div>`;
  return card;
}

function categoryLabel(slug) {
  const match = (typeof CARPE_CATEGORIES !== 'undefined' ? CARPE_CATEGORIES : [])
    .find(c => c.slug === slug);
  return match ? match.label : slug;
}

// Matches index.html's existing #customer-gallery markup exactly.
function renderGalleryTile(entry) {
  const div = document.createElement('div');
  div.className = 'gallery-item';
  div.innerHTML = `
    <div class="ph light"><img src="${escapeHtml(entry.image_url)}" alt="${escapeHtml(entry.caption || 'Customer photo')}" onerror="handleImgError(this)"></div>
    <svg class="ig-icon" width="22" height="22" viewBox="0 0 24 24" stroke="#fff" fill="none" stroke-width="1.6">
      <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>
    </svg>`;
  return div;
}

// Clears `container` and appends one card per item in `items` via `renderFn`.
function mountGrid(container, items, renderFn) {
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => container.appendChild(renderFn(item)));
}
