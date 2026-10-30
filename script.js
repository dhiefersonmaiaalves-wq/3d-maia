let products = CatalogStore.load();

const grid = document.querySelector("#productGrid");
const catalogNotice = document.querySelector("#catalogNotice");
const detailDialog = document.querySelector("#productDetailDialog");
const detailMainPhoto = document.querySelector("#detailMainPhoto");
const detailThumbnails = document.querySelector("#detailThumbnails");
const detailQuantity = document.querySelector("#detailQuantity");
const detailUnitPrice = document.querySelector("#detailUnitPrice");
const detailTotal = document.querySelector("#detailTotal");
const detailTiers = document.querySelector("#detailTiers");
const detailNote = document.querySelector("#detailNote");

let currentProduct = null;
let detailPhotoIndex = 0;
let swipeStartX = null;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function safeUrl(value) {
  const url = String(value || "").trim();
  return /^(data:image\/(webp|png|jpeg);base64,|https?:\/\/|\.?\.?\/|[a-zA-Z0-9_-]+\/)/i.test(url) ? url : "";
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) && value > 0 ? `A partir de ${money(value)}` : "Sob consulta";
}

function unitPrice(product, quantity) {
  const amount = Math.max(1, Number(quantity) || 1);
  if (amount >= 100 && Number(product.bulk100) > 0) return Number(product.bulk100);
  if (amount >= 50 && Number(product.bulk50) > 0) return Number(product.bulk50);
  return Number(product.price) || 0;
}

function productPhotos(product) {
  return Array.isArray(product.photos) ? product.photos.map(safeUrl).filter(Boolean) : [];
}

function modelShape(product) {
  if (product.shape) return product.shape;
  if (product.art === "art-ring") return "ring";
  if (product.art === "art-vase") return "vase";
  if (product.art === "art-gear") return "gear";
  if (product.art === "art-stand") return "stand";
  return "plaque";
}

function modelLayers() {
  return Array.from({ length: 18 }, (_, index) => `<span class="spin-layer" style="--depth:${(index - 9) * 2}px"></span>`).join("");
}

function cardMediaMarkup(product) {
  const photos = productPhotos(product);
  if (photos.length) {
    const illustration = photos[0].includes("assets/catalog-sales/");
    return `<img class="product-photo" src="${escapeHTML(photos[0])}" alt="${escapeHTML(product.name)} — ${illustration ? "imagem ilustrativa" : "foto da peça"}">
      <span class="photo-badge">${illustration ? "Imagem ilustrativa" : `${photos.length} foto${photos.length > 1 ? "s" : ""}`}</span>`;
  }
  return `<div class="viewer-360" aria-hidden="true"><div class="spin-object shape-${escapeHTML(modelShape(product))}" style="--model-color:${escapeHTML(product.color || "#705d7d")}">${modelLayers()}</div></div>`;
}

function bulkHint(product) {
  const tiers = [];
  if (Number(product.bulk50) > 0) tiers.push(`50 un. por ${money(product.bulk50)} cada`);
  if (Number(product.bulk100) > 0) tiers.push(`100 un. por ${money(product.bulk100)} cada`);
  return tiers.length ? `<span class="bulk-hint">${tiers.join(" · ")}</span>` : "";
}

function renderFilters(active = "todos") {
  const categories = CatalogStore.loadCategories();
  const validActive = active === "todos" || categories.some(category => category.value === active) ? active : "todos";
  document.querySelector(".filters").innerHTML = [`<button class="filter ${validActive === "todos" ? "is-active" : ""}" type="button" data-filter="todos">Todos</button>`, ...categories.map(category => `<button class="filter ${validActive === category.value ? "is-active" : ""}" type="button" data-filter="${escapeHTML(category.value)}">${escapeHTML(category.label)}</button>`)].join("");
  return validActive;
}

function renderProducts(filter = "todos") {
  const visible = products.filter(product => filter === "todos" || product.category === filter);
  grid.innerHTML = visible.map(product => `
    <article class="product-card" data-open-product="${Number(product.id)}" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeHTML(product.name)}">
      <div class="product-art ${productPhotos(product).length ? "has-photo" : "has-360"}" style="--art-color:${escapeHTML(product.color || "#705d7d")};--art-shadow:${escapeHTML(product.shadow || "#302b30")}">
        ${cardMediaMarkup(product)}
      </div>
      <div class="product-content">
        <div class="product-meta"><span>${escapeHTML(product.label)}</span><span>${escapeHTML(product.material)}</span></div>
        <h3>${escapeHTML(product.name)}</h3>
        <strong class="product-price">${formatPrice(product.price)}</strong>
        ${bulkHint(product)}
        <p>${escapeHTML(product.description)}</p>
        <span class="add-button">Ver fotos e calcular</span>
      </div>
    </article>
  `).join("");
}

function renderDetailGallery() {
  if (!currentProduct) return;
  const photos = productPhotos(currentProduct);
  detailPhotoIndex = Math.max(0, Math.min(detailPhotoIndex, Math.max(photos.length - 1, 0)));
  if (photos.length) {
    detailMainPhoto.innerHTML = `<img src="${escapeHTML(photos[detailPhotoIndex])}" alt="${escapeHTML(currentProduct.name)} — foto ${detailPhotoIndex + 1}" draggable="false">`;
    detailThumbnails.innerHTML = photos.map((photo, index) => `<button class="detail-thumb ${index === detailPhotoIndex ? "is-active" : ""}" type="button" data-detail-photo="${index}" aria-label="Mostrar foto ${index + 1}"><img src="${escapeHTML(photo)}" alt=""></button>`).join("");
    document.querySelector("#swipeHint").hidden = photos.length < 2;
  } else {
    detailMainPhoto.innerHTML = `<div class="detail-placeholder"><div class="spin-object shape-${escapeHTML(modelShape(currentProduct))}" style="--model-color:${escapeHTML(currentProduct.color || "#705d7d")}">${modelLayers()}</div><span>Prévia demonstrativa</span></div>`;
    detailThumbnails.innerHTML = "";
    document.querySelector("#swipeHint").hidden = true;
  }
}

function renderDetailTiers() {
  if (!currentProduct) return;
  const tiers = [];
  if (Number(currentProduct.bulk50) > 0) tiers.push({ quantity: 50, price: Number(currentProduct.bulk50) });
  if (Number(currentProduct.bulk100) > 0) tiers.push({ quantity: 100, price: Number(currentProduct.bulk100) });
  detailTiers.innerHTML = tiers.length ? `<span class="tiers-title">Economize por quantidade</span>${tiers.map(tier => `<button type="button" data-tier-quantity="${tier.quantity}"><strong>${tier.quantity}+ unidades</strong><span>${money(tier.price)} cada</span></button>`).join("")}` : "";
}

function updateDetailPricing() {
  if (!currentProduct) return;
  const quantity = Math.max(1, Math.min(10000, Math.floor(Number(detailQuantity.value) || 1)));
  detailQuantity.value = quantity;
  const price = unitPrice(currentProduct, quantity);
  detailUnitPrice.textContent = price > 0 ? `${money(price)} cada` : "Sob consulta";
  detailTotal.textContent = price > 0 ? money(price * quantity) : "Sob consulta";
  detailNote.textContent = price > 0 ? "Estimativa automática. Arte, tamanho e acabamento são confirmados no WhatsApp." : "Envie a quantidade pelo WhatsApp para receber o valor.";
}

function openProductDetail(id) {
  currentProduct = products.find(product => Number(product.id) === Number(id));
  if (!currentProduct) return;
  detailPhotoIndex = 0;
  detailQuantity.value = 1;
  document.querySelector("#detailCategory").textContent = `${currentProduct.label} · ${currentProduct.material}`;
  document.querySelector("#detailName").textContent = currentProduct.name;
  document.querySelector("#detailDescription").textContent = currentProduct.description;
  renderDetailGallery();
  renderDetailTiers();
  updateDetailPricing();
  detailDialog.showModal();
}

function stepDetailPhoto(direction) {
  const photos = productPhotos(currentProduct || {});
  if (photos.length < 2) return;
  detailPhotoIndex = (detailPhotoIndex + direction + photos.length) % photos.length;
  renderDetailGallery();
}

document.querySelector(".filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  document.querySelectorAll(".filter").forEach(item => item.classList.remove("is-active"));
  button.classList.add("is-active");
  const notices = {
    airsoft: "Itens cenográficos destinados exclusivamente a brinquedos e airsoft. Não produzimos componentes para armas reais.",
    figures: "Personagens e marcas são produzidos somente a partir de modelo próprio, licenciado ou autorizado pelo cliente.",
    chaveiros: "Chaveiros de personagens conhecidos são feitos sob encomenda com arte ou modelo autorizado."
  };
  const notice = notices[button.dataset.filter];
  catalogNotice.hidden = !notice;
  if (notice) catalogNotice.textContent = notice;
  renderProducts(button.dataset.filter);
});

grid.addEventListener("click", event => {
  if (event.target.closest("a")) return;
  const target = event.target.closest("[data-open-product]");
  if (target) openProductDetail(target.dataset.openProduct);
});

grid.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".product-card[data-open-product]");
  if (!card || event.target.closest("button,a")) return;
  event.preventDefault();
  openProductDetail(card.dataset.openProduct);
});

detailThumbnails.addEventListener("click", event => {
  const button = event.target.closest("[data-detail-photo]");
  if (!button) return;
  detailPhotoIndex = Number(button.dataset.detailPhoto);
  renderDetailGallery();
});

detailMainPhoto.addEventListener("pointerdown", event => {
  swipeStartX = event.clientX;
  detailMainPhoto.classList.add("is-swiping");
  try { detailMainPhoto.setPointerCapture(event.pointerId); } catch {}
});

detailMainPhoto.addEventListener("pointerup", event => {
  if (swipeStartX === null) return;
  const distance = event.clientX - swipeStartX;
  if (Math.abs(distance) > 38) stepDetailPhoto(distance < 0 ? 1 : -1);
  swipeStartX = null;
  detailMainPhoto.classList.remove("is-swiping");
});

detailMainPhoto.addEventListener("pointercancel", () => {
  swipeStartX = null;
  detailMainPhoto.classList.remove("is-swiping");
});

detailQuantity.addEventListener("input", updateDetailPricing);
document.querySelector("#quantityMinus").addEventListener("click", () => { detailQuantity.value = Math.max(1, Number(detailQuantity.value) - 1); updateDetailPricing(); });
document.querySelector("#quantityPlus").addEventListener("click", () => { detailQuantity.value = Math.min(10000, Number(detailQuantity.value) + 1); updateDetailPricing(); });

detailTiers.addEventListener("click", event => {
  const button = event.target.closest("[data-tier-quantity]");
  if (!button) return;
  detailQuantity.value = button.dataset.tierQuantity;
  updateDetailPricing();
});

document.querySelector("#closeProductDetail").addEventListener("click", () => detailDialog.close());
detailDialog.addEventListener("click", event => { if (event.target === detailDialog) detailDialog.close(); });

function openWhatsApp(message) {
  window.open(`https://wa.me/${SiteSettings.phone()}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

document.querySelector("#detailWhatsApp").addEventListener("click", () => {
  if (!currentProduct) return;
  const quantity = Math.max(1, Number(detailQuantity.value) || 1);
  const price = unitPrice(currentProduct, quantity);
  const estimate = price > 0 ? `\nValor unitário estimado: ${money(price)}\nTotal estimado: ${money(price * quantity)}` : "\nValor: sob consulta";
  openWhatsApp(`Olá, 3D MAIA! Gostaria de pedir:\n\n${currentProduct.name}\nQuantidade: ${quantity} unidade(s)${estimate}\n\nPodemos confirmar personalização, acabamento e prazo?`);
  detailNote.textContent = "WhatsApp aberto com o pedido pronto. Revise a mensagem e toque em enviar.";
});

document.querySelector("#ideaForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const file = data.get("reference");
  const attachment = file && file.name ? `\nArquivo de referência: ${file.name} (vou anexar separadamente)` : "";
  openWhatsApp(`Olá, 3D MAIA! Meu nome é ${data.get("name")}.\n\nGostaria de solicitar um orçamento:\n${data.get("idea")}${attachment}`);
  document.querySelector("#formNote").textContent = "WhatsApp aberto com sua ideia. Revise a mensagem e toque em enviar.";
});

window.addEventListener("storage", event => {
  if (event.key !== CatalogStore.STORAGE_KEY && event.key !== CatalogStore.CATEGORY_STORAGE_KEY) return;
  const activeFilter = renderFilters(document.querySelector(".filter.is-active")?.dataset.filter || "todos");
  products = CatalogStore.load();
  renderProducts(activeFilter);
  if (event.key === CatalogStore.CATEGORY_STORAGE_KEY) return;
  if (!currentProduct) return;
  const updatedProduct = products.find(product => Number(product.id) === Number(currentProduct.id));
  if (!updatedProduct) {
    detailDialog.close();
    currentProduct = null;
    return;
  }
  if (detailDialog.open) detailDialog.close();
  openProductDetail(updatedProduct.id);
});

renderFilters();
renderProducts();

async function loadOnlineCatalog() {
  if (!window.CloudStore?.available) return;
  try {
    const online = await CloudStore.refreshLocal();
    if (!online) return;
    products = CatalogStore.load();
    const activeFilter = renderFilters(document.querySelector(".filter.is-active")?.dataset.filter || "todos");
    renderProducts(activeFilter);
  } catch (error) {
    console.warn("Catálogo online temporariamente indisponível.", error);
  }
}

loadOnlineCatalog();
