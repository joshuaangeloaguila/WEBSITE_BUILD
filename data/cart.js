// Shared cart logic for index.html and shop.html (previously copy-pasted in both).
// Depends on data/render.js being loaded first for formatPeso().
// Requires elements with ids: cartCount, cartDrawerOverlay, cartDrawerItems,
// cartDrawerEmpty, cartDrawerSubtotal, cartBtn, cartDrawerClose — pages without a
// cart UI (e.g. admin.html) can still load this file safely; it no-ops if absent.

const CART_KEY = 'carpeCart';

// Drops any entry that doesn't look like a real cart item (corrupted localStorage,
// or a hand-edited ?cart= URL param) so a bad entry can't render as literal
// "undefined"/NaN downstream instead of just being silently skipped.
function sanitizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  return cart
    .filter(item => item && typeof item === 'object' && item.id != null && item.name && Number.isFinite(Number(item.price)))
    .map(item => ({ ...item, price: Number(item.price), qty: Math.max(1, Number(item.qty) || 1) }));
}

function loadCart() {
  try { return sanitizeCart(JSON.parse(localStorage.getItem(CART_KEY))); }
  catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function encodeCart(cart) { return encodeURIComponent(JSON.stringify(cart)); }
function decodeCart(str) {
  try { const c = JSON.parse(decodeURIComponent(str)); return Array.isArray(c) ? sanitizeCart(c) : null; }
  catch (e) { return null; }
}

// carry the cart across page loads via the URL, since file:// pages don't share localStorage
function withCart(href) {
  const url = new URL(href, window.location.href);
  // Always attach the cart, even when empty — the destination page has its own
  // isolated localStorage (file:// origin) and only overwrites it when this param
  // is present, so an empty cart needs to travel too (e.g. right after checkout
  // clears it) or the destination keeps showing its own stale, older cart.
  url.searchParams.set('cart', encodeCart(loadCart()));
  return url.href;
}

(function importCartFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const cartParam = params.get('cart');
  if (!cartParam) return;
  const imported = decodeCart(cartParam);
  if (imported) saveCart(imported);
  params.delete('cart');
  const cleanSearch = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash);
})();

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return;
  if (!/\.html/i.test(href)) return;
  e.preventDefault();
  window.location.href = withCart(href);
});

function cartCountTotal(cart) { return cart.reduce((n, c) => n + c.qty, 0); }
function cartSubtotal(cart) { return cart.reduce((n, c) => n + c.price * c.qty, 0); }

function addToCart(item) {
  const cart = loadCart();
  const existing = cart.find(c => c.id === item.id && c.size === item.size && c.color === item.color);
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
  renderCart();
  bumpCartIcon();
}
function removeFromCart(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

const cartBadge = document.getElementById('cartCount');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const cartDrawerItems = document.getElementById('cartDrawerItems');
const cartDrawerEmpty = document.getElementById('cartDrawerEmpty');
const cartDrawerSubtotal = document.getElementById('cartDrawerSubtotal');
const cartBtn = document.getElementById('cartBtn');
const cartDrawerClose = document.getElementById('cartDrawerClose');
const cartDrawerCheckout = document.getElementById('cartDrawerCheckout');
const cartDrawerCountPill = document.getElementById('cartDrawerCountPill');

function bumpCartIcon() {
  if (!cartBtn) return;
  cartBtn.classList.remove('bump');
  void cartBtn.offsetWidth;
  cartBtn.classList.add('bump');
}

// product images now live in Supabase Storage as normal short URLs, so (unlike the old
// base64-embedded-photo version of this site) the cart can just store item.img directly —
// no need for a DOM-scraped image lookup map to keep the ?cart= URL from ballooning.
function renderCart() {
  if (!cartDrawerItems) return;
  const cart = loadCart();
  if (cartBadge) cartBadge.textContent = String(cartCountTotal(cart));
  if (cartDrawerCountPill) cartDrawerCountPill.textContent = String(cartCountTotal(cart));
  cartDrawerItems.innerHTML = '';
  if (cartDrawerEmpty) cartDrawerEmpty.classList.toggle('show', cart.length === 0);
  cart.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const metaParts = [];
    if (item.size) metaParts.push('Size ' + item.size);
    const colorDot = item.color
      ? `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${item.color};border:1px solid rgba(255,255,255,.4);vertical-align:middle;margin:0 2px 0 4px;"></span>`
      : '';
    row.innerHTML = `
      <div class="cart-item-img"><img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" onerror="handleImgError(this)"></div>
      <div class="cart-item-info">
        <div class="cart-item-top">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <button class="cart-item-remove" aria-label="Remove">&times;</button>
        </div>
        <div class="cart-item-meta">${metaParts.join(' &middot; ')}${colorDot}</div>
        <div class="cart-item-bottom">
          <div class="qty-stepper">
            <button class="qty-btn qty-dec" aria-label="Decrease quantity"><svg viewBox="0 0 10 10"><path d="M1 5h8"/></svg></button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn qty-inc" aria-label="Increase quantity"><svg viewBox="0 0 10 10"><path d="M5 1v8M1 5h8"/></svg></button>
          </div>
          <div class="cart-item-price">${formatPeso(item.price * item.qty)}</div>
        </div>
      </div>
    `;
    row.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(i));
    row.querySelector('.qty-dec').addEventListener('click', () => updateQty(i, -1));
    row.querySelector('.qty-inc').addEventListener('click', () => updateQty(i, 1));
    cartDrawerItems.appendChild(row);
  });
  if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = formatPeso(cartSubtotal(cart));
}

function updateQty(index, delta) {
  const cart = loadCart();
  const item = cart[index];
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
}

function openCartDrawer() {
  renderCart();
  cartDrawerOverlay.classList.add('open');
  document.body.classList.add('modal-open');
}
function closeCartDrawer() {
  cartDrawerOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
}

if (cartBtn && cartDrawerOverlay && cartDrawerClose) {
  cartBtn.addEventListener('click', openCartDrawer);
  cartDrawerClose.addEventListener('click', closeCartDrawer);
  cartDrawerOverlay.addEventListener('click', (e) => { if (e.target === cartDrawerOverlay) closeCartDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCartDrawer(); });
}

if (cartDrawerCheckout) {
  cartDrawerCheckout.addEventListener('click', () => {
    window.location.href = withCart('checkout.html');
  });
}

renderCart();
