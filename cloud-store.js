(function () {
  const config = window.SUPABASE_CONFIG;
  const available = Boolean(config?.url && config?.publishableKey && window.supabase?.createClient);
  const client = available ? window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;
  let syncTimer = null;
  let syncing = false;
  let queued = false;

  function announce(state, message) {
    window.dispatchEvent(new CustomEvent("cloud-sync-status", { detail: { state, message } }));
  }

  async function loadContent() {
    if (!client) throw new Error("Conexão com o banco indisponível.");
    const { data, error } = await client.from("site_content").select("catalog,categories,settings,updated_at").eq("id", "main").maybeSingle();
    if (error) throw error;
    return data;
  }

  function cacheContent(data) {
    if (!data) return false;
    if (Array.isArray(data.catalog)) localStorage.setItem(CatalogStore.STORAGE_KEY, JSON.stringify(data.catalog));
    if (Array.isArray(data.categories)) localStorage.setItem(CatalogStore.CATEGORY_STORAGE_KEY, JSON.stringify(data.categories));
    if (data.settings && typeof data.settings === "object") localStorage.setItem(SiteSettings.STORAGE_KEY, JSON.stringify(data.settings));
    SiteSettings.apply(SiteSettings.load());
    return true;
  }

  async function refreshLocal() {
    const data = await loadContent();
    if (data) cacheContent(data);
    return data;
  }

  async function saveSnapshot() {
    if (!client || syncing) { queued = true; return; }
    syncing = true;
    announce("syncing", "Salvando para todos...");
    const payload = {
      id: "main",
      catalog: CatalogStore.load(),
      categories: CatalogStore.loadCategories(),
      settings: SiteSettings.load(),
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from("site_content").upsert(payload, { onConflict: "id" });
    syncing = false;
    if (error) {
      announce("error", `Não foi possível sincronizar: ${error.message}`);
      throw error;
    }
    announce("saved", "Salvo online — alterações disponíveis para todos.");
    if (queued) { queued = false; await saveSnapshot(); }
  }

  function queueSave() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => saveSnapshot().catch(() => {}), 350);
  }

  function bindAdminSync() {
    window.addEventListener("catalog-local-changed", queueSave);
    window.addEventListener("site-settings-local-changed", queueSave);
  }

  async function signIn(email, password) {
    if (!client) throw new Error("Conexão com o banco indisponível.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() { if (client) await client.auth.signOut(); }
  async function getSession() { return client ? (await client.auth.getSession()).data.session : null; }

  async function isAdmin(userId) {
    if (!userId) return false;
    const { data, error } = await client.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  window.CloudStore = { available, client, loadContent, refreshLocal, cacheContent, saveSnapshot, bindAdminSync, signIn, signOut, getSession, isAdmin };
})();
