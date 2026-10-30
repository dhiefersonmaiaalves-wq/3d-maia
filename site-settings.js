(function () {
  const STORAGE_KEY = "3d-maia-site-settings-v1";
  const defaults = {
    primaryColor: "#df6b3f",
    secondaryColor: "#705d7d",
    whatsapp: "556992761192",
    logo: "assets/logo-3d-maia-original.png",
    banner: ""
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? { ...defaults, ...saved } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function save(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaults, ...settings }));
    window.dispatchEvent(new CustomEvent("site-settings-local-changed"));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("site-settings-local-changed"));
    return { ...defaults };
  }

  function phone(value = load().whatsapp) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    return digits || defaults.whatsapp;
  }

  function shade(hex, amount = -28) {
    const normalized = String(hex || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return hex;
    const value = Number.parseInt(normalized, 16);
    const channel = shift => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
    return `#${[channel(16), channel(8), channel(0)].map(number => number.toString(16).padStart(2, "0")).join("")}`;
  }

  function apply(settings = load()) {
    const root = document.documentElement;
    root.style.setProperty("--orange", settings.primaryColor);
    root.style.setProperty("--orange-dark", shade(settings.primaryColor));
    root.style.setProperty("--violet", settings.secondaryColor);
    document.querySelectorAll("[data-site-logo]").forEach(image => { image.src = settings.logo || defaults.logo; });
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.href = settings.logo || defaults.logo;
    document.querySelectorAll(".catalog-watermark,.admin-watermark").forEach(element => { element.style.backgroundImage = `url("${settings.logo || defaults.logo}")`; });
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.classList.toggle("has-custom-banner", Boolean(settings.banner));
      hero.style.setProperty("--custom-banner", settings.banner ? `url("${settings.banner}")` : "none");
    }
    window.dispatchEvent(new CustomEvent("site-settings-applied", { detail: settings }));
  }

  window.SiteSettings = { STORAGE_KEY, defaults, load, save, reset, phone, apply };
  apply(load());
})();
