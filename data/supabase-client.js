// Requires the Supabase UMD script to be loaded first:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

const SUPABASE_URL = 'https://qhnbknselkxwajcwwlcp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nldlCghZat3c3-39KCbvoA_7aNv-NQu';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CarpeDB = (() => {
  const BUCKET = 'media';

  function slugify(name) {
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function fetchProducts() {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function fetchGallery() {
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function insertProduct(product) {
    const { data, error } = await supabaseClient
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateProduct(id, updates) {
    const { data, error } = await supabaseClient
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteProduct(id) {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async function insertGalleryItem(item) {
    const { data, error } = await supabaseClient
      .from('gallery')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteGalleryItem(id) {
    const { error } = await supabaseClient.from('gallery').delete().eq('id', id);
    if (error) throw error;
  }

  async function fetchOrders() {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function insertOrder(order) {
    const { data, error } = await supabaseClient
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateOrder(id, updates) {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteOrder(id) {
    const { error } = await supabaseClient.from('orders').delete().eq('id', id);
    if (error) throw error;
  }

  async function fetchOrderByNumber(orderNumber, email) {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .ilike('order_number', orderNumber)
      .ilike('customer_email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function fetchPromos() {
    const { data, error } = await supabaseClient
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function insertPromo(promo) {
    const { data, error } = await supabaseClient
      .from('promos')
      .insert(promo)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updatePromo(id, updates) {
    const { data, error } = await supabaseClient
      .from('promos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deletePromo(id) {
    const { error } = await supabaseClient.from('promos').delete().eq('id', id);
    if (error) throw error;
  }

  async function fetchCategories() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function insertCategory(category) {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteCategory(id) {
    const { error } = await supabaseClient.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async function fetchShippingSettings() {
    const { data, error } = await supabaseClient
      .from('shipping_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function updateShippingSettings(updates) {
    const { data, error } = await supabaseClient
      .from('shipping_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function fetchAdminSettings() {
    const { data, error } = await supabaseClient
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function updateAdminSettings(updates) {
    const { data, error } = await supabaseClient
      .from('admin_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function fetchApprovedReviews() {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function fetchAllReviews() {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function insertReview(review) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .insert(review)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateReview(id, updates) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteReview(id) {
    const { error } = await supabaseClient.from('reviews').delete().eq('id', id);
    if (error) throw error;
  }

  async function uploadImage(file, folder, slugHint) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${slugify(slugHint || file.name)}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function deleteImage(path) {
    if (!path) return;
    const { error } = await supabaseClient.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }

  return {
    slugify,
    fetchProducts,
    fetchGallery,
    insertProduct,
    updateProduct,
    deleteProduct,
    insertGalleryItem,
    deleteGalleryItem,
    fetchOrders,
    insertOrder,
    updateOrder,
    deleteOrder,
    fetchOrderByNumber,
    fetchPromos,
    insertPromo,
    updatePromo,
    deletePromo,
    fetchCategories,
    insertCategory,
    deleteCategory,
    fetchShippingSettings,
    updateShippingSettings,
    fetchAdminSettings,
    updateAdminSettings,
    fetchApprovedReviews,
    fetchAllReviews,
    insertReview,
    updateReview,
    deleteReview,
    uploadProductImage: (file, slugHint) => uploadImage(file, 'products', slugHint),
    uploadGalleryImage: (file) => uploadImage(file, 'gallery', file.name),
    uploadReviewImage: (file) => uploadImage(file, 'reviews', file.name),
    deleteImage
  };
})();
