let products = CatalogStore.load();
let categories = CatalogStore.loadCategories();
const form = document.querySelector("#productForm");
const dialog = document.querySelector("#productDialog");
const list = document.querySelector("#adminProductList");
const search = document.querySelector("#productSearch");
const categoryFilter = document.querySelector("#productCategoryFilter");
const mediaFilter = document.querySelector("#productMediaFilter");
const visibleCount = document.querySelector("#visibleCount");
const panelMessage = document.querySelector("#panelMessage");
const toolMessage = document.querySelector("#toolMessage");
const photoFiles = document.querySelector("#photoFiles");
const photoPreviewList = document.querySelector("#photoPreviewList");
const photoStatus = document.querySelector("#photoStatus");
const categoryList = document.querySelector("#categoryList");
const categoryMessage = document.querySelector("#categoryMessage");
const settingsDialog = document.querySelector("#siteSettingsDialog");
const settingsForm = document.querySelector("#siteSettingsForm");
const settingsLogoPreview = document.querySelector("#settingsLogoPreview");
const settingsBannerPreview = document.querySelector("#settingsBannerPreview");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const loginButton = loginForm.querySelector('[type="submit"]');
const cloudSyncStatus = document.querySelector("#cloudSyncStatus");
let editingPhotos = [];

function unlockAdmin() {
  document.body.classList.remove("admin-locked");
  document.querySelector("#loginGate").hidden = true;
  document.querySelector("#adminApp").hidden = false;
}

async function authorizeAdmin(userId) {
  const [isAdmin, online] = await Promise.all([
    CloudStore.isAdmin(userId),
    CloudStore.refreshLocal()
  ]);
  if (!isAdmin) throw new Error("Esta conta não tem permissão de administrador.");
  products = CatalogStore.load();
  categories = CatalogStore.loadCategories();
  if (!online) await CloudStore.saveSnapshot();
  CloudStore.bindAdminSync();
  unlockAdmin();
  renderList();
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  loginMessage.textContent = "Entrando com segurança...";
  loginButton.disabled = true;
  loginButton.textContent = "Entrando...";
  try {
    const auth = await CloudStore.signIn(String(data.get("email") || "").trim(), String(data.get("password") || ""));
    await authorizeAdmin(auth.user?.id);
    loginMessage.textContent = "";
  } catch (error) {
    loginMessage.textContent = error.message || "E-mail ou senha incorretos.";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Entrar no painel";
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await CloudStore.signOut();
  location.reload();
});

window.addEventListener("cloud-sync-status", event => {
  if (!cloudSyncStatus) return;
  cloudSyncStatus.dataset.state = event.detail.state;
  cloudSyncStatus.lastChild.textContent = ` ${event.detail.message}`;
});

function renderSettingsPreview(settings) {
  settingsForm.elements.primaryColor.value = settings.primaryColor;
  settingsForm.elements.secondaryColor.value = settings.secondaryColor;
  settingsForm.elements.whatsapp.value = settings.whatsapp;
  settingsForm.elements.logoData.value = settings.logo;
  settingsForm.elements.bannerData.value = settings.banner || "";
  settingsLogoPreview.src = settings.logo || SiteSettings.defaults.logo;
  settingsBannerPreview.style.setProperty("--preview-primary", settings.primaryColor);
  settingsBannerPreview.style.setProperty("--preview-secondary", settings.secondaryColor);
  settingsBannerPreview.style.backgroundImage = settings.banner ? `linear-gradient(90deg,rgba(255,250,247,.88),rgba(255,250,247,.28)),url("${settings.banner}")` : "linear-gradient(135deg,#fff7f1,#eee7f2)";
}

function openSettings() {
  renderSettingsPreview(SiteSettings.load());
  settingsDialog.showModal();
}

async function processSettingsImage(input, targetName) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const [processed] = await PhotoPreview.process([file]);
    settingsForm.elements[targetName].value = processed.dataUrl;
    renderSettingsPreview({
      primaryColor: settingsForm.elements.primaryColor.value,
      secondaryColor: settingsForm.elements.secondaryColor.value,
      whatsapp: settingsForm.elements.whatsapp.value,
      logo: settingsForm.elements.logoData.value,
      banner: settingsForm.elements.bannerData.value
    });
  } catch (error) {
    panelMessage.textContent = error.message || "Não foi possível processar essa imagem.";
  } finally {
    input.value = "";
  }
}

document.querySelector("#openSettings").addEventListener("click", openSettings);
document.querySelector("#closeSettings").addEventListener("click", () => settingsDialog.close());
document.querySelector("#cancelSettings").addEventListener("click", () => settingsDialog.close());
settingsDialog.addEventListener("click", event => { if (event.target === settingsDialog) settingsDialog.close(); });
document.querySelector("#settingsLogoFile").addEventListener("change", event => processSettingsImage(event.currentTarget, "logoData"));
document.querySelector("#settingsBannerFile").addEventListener("change", event => processSettingsImage(event.currentTarget, "bannerData"));
document.querySelector("#clearBanner").addEventListener("click", () => {
  settingsForm.elements.bannerData.value = "";
  renderSettingsPreview({
    primaryColor: settingsForm.elements.primaryColor.value,
    secondaryColor: settingsForm.elements.secondaryColor.value,
    whatsapp: settingsForm.elements.whatsapp.value,
    logo: settingsForm.elements.logoData.value,
    banner: ""
  });
});
settingsForm.querySelectorAll('input[type="color"]').forEach(input => input.addEventListener("input", () => {
  settingsBannerPreview.style.setProperty(input.name === "primaryColor" ? "--preview-primary" : "--preview-secondary", input.value);
}));
document.querySelector("#resetSettings").addEventListener("click", () => {
  if (!confirm("Restaurar logo, cores, banner e WhatsApp para o padrão inicial?")) return;
  const settings = SiteSettings.reset();
  SiteSettings.apply(settings);
  renderSettingsPreview(settings);
  panelMessage.textContent = "Configurações visuais restauradas.";
});
settingsForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(settingsForm);
  const settings = {
    primaryColor: data.get("primaryColor"),
    secondaryColor: data.get("secondaryColor"),
    whatsapp: SiteSettings.phone(data.get("whatsapp")),
    logo: data.get("logoData") || SiteSettings.defaults.logo,
    banner: data.get("bannerData") || ""
  };
  try {
    SiteSettings.save(settings);
    SiteSettings.apply(settings);
    settingsDialog.close();
    panelMessage.textContent = "Configurações do site salvas e aplicadas.";
  } catch {
    panelMessage.textContent = "As imagens ficaram grandes demais para este navegador. Tente arquivos menores.";
  }
});

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[character]);
}

function money(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price.toLocaleString("pt-BR", { style:"currency", currency:"BRL" }) : "Sob consulta";
}

function safeImageUrl(value) {
  const url = String(value || "").trim();
  return /^(data:image\/(webp|png|jpeg);base64,|https?:\/\/|\.?\.?\/|[a-zA-Z0-9_-]+\/)/i.test(url) ? url : "";
}

function fillCategories() {
  const select = document.querySelector("#categorySelect");
  const selected = select.value;
  select.innerHTML = categories.map(category => `<option value="${escapeHTML(category.value)}">${escapeHTML(category.label)}</option>`).join("");
  if (categories.some(category => category.value === selected)) select.value = selected;
  const selectedFilter = categoryFilter.value || "todos";
  categoryFilter.innerHTML = `<option value="todos">Todas</option>${categories.map(category => `<option value="${escapeHTML(category.value)}">${escapeHTML(category.label)}</option>`).join("")}`;
  categoryFilter.value = categories.some(category => category.value === selectedFilter) ? selectedFilter : "todos";
}

function renderCategories() {
  categoryList.innerHTML = categories.map(category => {
    const count = products.filter(product => product.category === category.value).length;
    return `<article class="category-item"><div><strong>${escapeHTML(category.label)}</strong><span>${count} produto${count === 1 ? "" : "s"}</span></div><div><button type="button" data-edit-category="${escapeHTML(category.value)}">Renomear</button><button class="delete" type="button" data-delete-category="${escapeHTML(category.value)}">Excluir</button></div></article>`;
  }).join("");
}

function saveCategoryChanges(message) {
  CatalogStore.saveCategories(categories);
  CatalogStore.save(products);
  fillCategories();
  renderCategories();
  renderList(search.value);
  categoryMessage.textContent = message;
}

function updateSummary() {
  document.querySelector("#productTotal").textContent = products.length;
  document.querySelector("#pricedTotal").textContent = products.filter(product => Number(product.price) > 0).length;
  document.querySelector("#categoryTotal").textContent = new Set(products.map(product => product.category)).size;
}

function productThumbnail(product) {
  const photo = Array.isArray(product.photos) ? product.photos.map(safeImageUrl).find(Boolean) : "";
  if (photo) return `<img src="${escapeHTML(photo)}" alt="">`;
  return `<span>${escapeHTML(String(product.name || "P").trim().charAt(0).toUpperCase())}</span>`;
}

function renderList(query = "") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const visible = products.filter(product => {
    const matchesSearch = `${product.name} ${product.label} ${product.material}`.toLocaleLowerCase("pt-BR").includes(normalized);
    const matchesCategory = categoryFilter.value === "todos" || product.category === categoryFilter.value;
    const photos = Array.isArray(product.photos) ? product.photos.filter(Boolean) : [];
    const matchesMedia = mediaFilter.value === "todos" || (mediaFilter.value === "fotos" && photos.length > 0) || (mediaFilter.value === "sem-fotos" && photos.length === 0);
    return matchesSearch && matchesCategory && matchesMedia;
  });
  visibleCount.textContent = `(${visible.length})`;
  list.innerHTML = visible.length ? visible.map(product => `
    <article class="admin-product">
      <div class="admin-product-media">${productThumbnail(product)}</div>
      <div class="admin-product-copy"><div class="product-badges"><span>${escapeHTML(CatalogStore.categoryLabel(product.category))}</span><span>${product.photos?.length ? `${product.photos.length} foto(s)` : "Sem foto"}</span></div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.material || "Material não informado")}${Number(product.bulk50) > 0 || Number(product.bulk100) > 0 ? " · Preço por quantidade configurado" : ""}</p></div>
      <strong class="admin-price">${money(product.price)}</strong>
      <div class="item-actions"><button type="button" data-edit="${Number(product.id)}">Editar</button><button class="delete" type="button" data-delete="${Number(product.id)}">Excluir</button></div>
    </article>`).join("") : `<p class="empty-list">Nenhum produto encontrado.</p>`;
  updateSummary();
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  form.elements.color.value = "#34373c";
  clearPreview();
  showPhotos([]);
  document.querySelector("#formTitle").textContent = "Novo produto";
}

function showPhotos(photos) {
  editingPhotos = Array.isArray(photos) ? photos.filter(safeImageUrl).slice(0, PhotoPreview.MAX_PHOTOS) : [];
  form.elements.photosJson.value = JSON.stringify(editingPhotos);
  photoPreviewList.innerHTML = editingPhotos.map((photo, index) => `<div class="photo-thumb"><img src="${escapeHTML(photo)}" alt="Foto ${index + 1}"><button type="button" data-remove-photo="${index}" aria-label="Remover foto ${index + 1}">×</button></div>`).join("");
  photoStatus.textContent = editingPhotos.length ? `${editingPhotos.length} foto(s) pronta(s). Fotos reais aparecem antes da prévia 360°.` : "Nenhuma foto adicionada.";
}

function showPreview(dataUrl, frames = 24, columns = 6, label = "") {
  form.elements.previewSprite.value = dataUrl || "";
  form.elements.previewFrames.value = dataUrl ? frames : "";
  form.elements.previewColumns.value = dataUrl ? columns : "";
  form.elements.previewLabel.value = dataUrl ? label : "";
}

function clearPreview() {
  showPreview("");
}

function openNewProduct() {
  resetForm();
  dialog.showModal();
  form.elements.name.focus();
}

function openEditProduct(id) {
  const product = products.find(item => Number(item.id) === Number(id));
  if (!product) return;
  resetForm();
  Object.entries(product).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value ?? ""; });
  showPreview(product.previewSprite || "", Number(product.previewFrames) || 24, Number(product.previewColumns) || 6, product.previewLabel || product.name);
  showPhotos(product.photos || []);
  document.querySelector("#formTitle").textContent = "Editar produto";
  dialog.showModal();
}

photoFiles.addEventListener("change", async event => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  photoStatus.textContent = "Otimizando fotos para WebP…";
  photoFiles.disabled = true;
  try {
    const processed = await PhotoPreview.process(files);
    const remaining = PhotoPreview.MAX_PHOTOS - editingPhotos.length;
    showPhotos([...editingPhotos, ...processed.slice(0, remaining).map(photo => photo.dataUrl)]);
    const addedKb = processed.reduce((sum, photo) => sum + photo.bytes, 0) / 1024;
    photoStatus.textContent = `${editingPhotos.length} foto(s) pronta(s) · ${addedKb.toFixed(0)} KB adicionados.`;
  } catch (error) {
    photoStatus.textContent = error.message || "Não foi possível processar as fotos.";
  } finally {
    photoFiles.disabled = false;
    photoFiles.value = "";
  }
});

photoPreviewList.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-photo]");
  if (!button) return;
  showPhotos(editingPhotos.filter((_, index) => index !== Number(button.dataset.removePhoto)));
});

document.querySelector("#newProduct").addEventListener("click", openNewProduct);
document.querySelector("#closeForm").addEventListener("click", () => dialog.close());
document.querySelector("#cancelEdit").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const existingId = Number(data.get("id"));
  const category = data.get("category");
  const existing = products.find(item => Number(item.id) === existingId) || {};
  const product = { ...existing, id:existingId || CatalogStore.nextId(products), name:data.get("name").trim(), category, label:CatalogStore.categoryLabel(category), material:data.get("material").trim(), price:data.get("price") ? Number(data.get("price")) : null, bulk50:data.get("bulk50") ? Number(data.get("bulk50")) : null, bulk100:data.get("bulk100") ? Number(data.get("bulk100")) : null, description:data.get("description").trim(), color:data.get("color"), shadow:existing.shadow || "#171717", shape:data.get("shape"), art:existing.art || "", modelUrl:data.get("modelUrl").trim(), photos:JSON.parse(data.get("photosJson") || "[]"), previewSprite:data.get("previewSprite"), previewFrames:Number(data.get("previewFrames")) || undefined, previewColumns:Number(data.get("previewColumns")) || undefined, previewLabel:data.get("previewLabel") || data.get("name").trim() };
  products = existingId ? products.map(item => Number(item.id) === existingId ? product : item) : [product, ...products];
  try { CatalogStore.save(products); }
  catch { panelMessage.textContent = "A prévia ficou grande demais para o armazenamento deste navegador. Tente um STL menor ou remova backups antigos."; return; }
  renderList(search.value);
  renderCategories();
  dialog.close();
  panelMessage.textContent = existingId ? "Produto atualizado com sucesso." : "Produto adicionado ao catálogo.";
});

list.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) openEditProduct(editButton.dataset.edit);
  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    const product = products.find(item => Number(item.id) === id);
    if (!product || !confirm(`Excluir “${product.name}” do catálogo?`)) return;
    products = products.filter(item => Number(item.id) !== id);
    CatalogStore.save(products);
    renderList(search.value);
    panelMessage.textContent = "Produto excluído.";
  }
});

search.addEventListener("input", () => renderList(search.value));
categoryFilter.addEventListener("change", () => renderList(search.value));
mediaFilter.addEventListener("change", () => renderList(search.value));
document.querySelector("#categoryCreateForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = event.currentTarget.elements.categoryName;
  const label = input.value.trim();
  if (!label) return;
  if (categories.some(category => category.label.toLocaleLowerCase("pt-BR") === label.toLocaleLowerCase("pt-BR"))) {
    categoryMessage.textContent = "Essa categoria já existe.";
    return;
  }
  categories.push({ value: CatalogStore.categorySlug(label, categories), label });
  input.value = "";
  saveCategoryChanges("Categoria adicionada e disponível no formulário e no catálogo.");
});

categoryList.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-category]");
  const deleteButton = event.target.closest("[data-delete-category]");
  if (editButton) {
    const category = categories.find(item => item.value === editButton.dataset.editCategory);
    if (!category) return;
    const label = prompt("Novo nome da categoria:", category.label)?.trim();
    if (!label || label === category.label) return;
    if (categories.some(item => item.value !== category.value && item.label.toLocaleLowerCase("pt-BR") === label.toLocaleLowerCase("pt-BR"))) {
      categoryMessage.textContent = "Já existe outra categoria com esse nome.";
      return;
    }
    category.label = label;
    products = products.map(product => product.category === category.value ? { ...product, label } : product);
    saveCategoryChanges("Categoria renomeada em todos os produtos e filtros.");
  }
  if (deleteButton) {
    const value = deleteButton.dataset.deleteCategory;
    const category = categories.find(item => item.value === value);
    const count = products.filter(product => product.category === value).length;
    if (!category) return;
    if (count > 0) {
      categoryMessage.textContent = `Não é possível excluir “${category.label}”: mova primeiro os ${count} produto(s) para outra categoria.`;
      return;
    }
    if (!confirm(`Excluir a categoria “${category.label}”?`)) return;
    categories = categories.filter(item => item.value !== value);
    saveCategoryChanges("Categoria excluída.");
  }
});
document.querySelector("#exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(products,null,2)], { type:"application/json" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `catalogo-3d-maia-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url); toolMessage.textContent = "Backup exportado.";
});
document.querySelector("#importData").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try { const imported = JSON.parse(await file.text()); if (!Array.isArray(imported) || imported.some(item => !item.name || !item.category)) throw new Error(); products = imported; CatalogStore.save(products); renderList(); toolMessage.textContent = "Backup importado com sucesso."; }
  catch { toolMessage.textContent = "Arquivo inválido. Use um backup criado por este painel."; }
  event.target.value = "";
});
document.querySelector("#resetData").addEventListener("click", () => {
  if (!confirm("Restaurar os produtos e preços demonstrativos? Os cadastros atuais serão substituídos.")) return;
  products = CatalogStore.reset(); renderList(); panelMessage.textContent = "Produtos demonstrativos restaurados.";
});

fillCategories();
renderList();

(async function restoreAdminSession() {
  if (!window.CloudStore?.available) {
    loginMessage.textContent = "O banco online não carregou. Verifique sua conexão e atualize a página.";
    return;
  }
  try {
    const session = await CloudStore.getSession();
    if (session) await authorizeAdmin(session.user?.id);
  } catch (error) {
    loginMessage.textContent = error.message || "Não foi possível validar sua sessão.";
  }
})();
renderCategories();
