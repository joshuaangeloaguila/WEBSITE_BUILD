// Single source of truth for the category taxonomy — used by index.html's category
// tiles, shop.html's filter tabs, and admin.html's category picker.
const CARPE_CATEGORIES = [
  { slug: 'hoodies', label: 'Hoodies' },
  { slug: 'jackets', label: 'Jackets' },
  { slug: 'pants', label: 'Pants' },
  { slug: 'shirts', label: 'Shirts' },
  { slug: 'accessories', label: 'Accessories' }
];

// Merges admin-added custom categories (public.categories table) into the taxonomy
// above. Called before anything renders category options/tabs, on any page that
// loads supabase-client.js. Fails soft — falls back to the 5 built-ins — if the
// table doesn't exist yet (e.g. before the Supabase migration is run).
async function syncCategoriesFromDB() {
  if (typeof CarpeDB === 'undefined' || !CarpeDB.fetchCategories) return;
  try {
    const dbCategories = await CarpeDB.fetchCategories();
    dbCategories.forEach(c => {
      if (!CARPE_CATEGORIES.some(existing => existing.slug === c.slug)) {
        CARPE_CATEGORIES.push({ slug: c.slug, label: c.label });
      }
    });
  } catch (err) {
    console.error('Failed to sync categories from Supabase', err);
  }
}

const CARPE_SIZE_OPTIONS = ['One Size', 'S', 'M', 'L', 'XL'];

// Order pipeline stages, in order — used by admin.html's Orders tab (status badge + stepper).
// `color` drives the stage-pill badge on each kanban column header.
const CARPE_ORDER_STAGES = [
  { key: 'paid', label: 'Paid', color: '#4ade80' },
  { key: 'ordered', label: 'Ordered', color: '#38bdf8' },
  { key: 'preparing', label: 'Preparing', color: '#f0b429' },
  { key: 'shipped', label: 'Shipped', color: '#a78bfa' },
  { key: 'delivered', label: 'Delivered', color: '#34d399' }
];
