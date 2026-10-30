(function () {
  const STORAGE_KEY = "3d-maia-catalog-v1";
  const CATEGORY_STORAGE_KEY = "3d-maia-categories-v1";
  const PRICE_MIGRATION_KEY = "3d-maia-symbolic-prices-v1";
  const CONTENT_MIGRATION_KEY = "3d-maia-toy-modpack-v1";
  const PREVIEW_MIGRATION_KEY = "3d-maia-spectre-preview-v1";
  const PACK_PRODUCTS_MIGRATION_KEY = "3d-maia-modpack-products-v2";
  const COMPLETE_PACK_MIGRATION_KEY = "3d-maia-modpack-products-v3";
  const VISUAL_STYLE_MIGRATION_KEY = "3d-maia-studio-previews-v4";
  const GRAPHITE_STYLE_MIGRATION_KEY = "3d-maia-graphite-previews-v5";
  const OPEN_CATALOG_MIGRATION_KEY = "3d-maia-open-catalog-v6";
  const SALES_CATALOG_MIGRATION_KEY = "3d-maia-sales-catalog-v7";
  const SALES_MEDIA_MIGRATION_KEY = "3d-maia-sales-media-v8";
  const ILLUSTRATIVE_MEDIA_MIGRATION_KEY = "3d-maia-illustrative-media-v10";
  const PAPER_EXPANSION_MIGRATION_KEY = "3d-maia-paper-expansion-v13";
  const REMOVE_CATEGORIES_MIGRATION_KEY = "3d-maia-remove-categories-v14";
  const CATEGORY_REORGANIZATION_MIGRATION_KEY = "3d-maia-category-reorganization-v15";
  const SEAL_PRODUCT_MIGRATION_KEY = "3d-maia-seal-product-v17";
  const BULK_PRICING_MIGRATION_KEY = "3d-maia-bulk-pricing-v17";
  const BOOKMARK_CATEGORY_MIGRATION_KEY = "3d-maia-bookmark-category-v18";
  const graphitePreviews = {
    16: "assets/models-preview/spectre-360.webp?v=studio3", 17: "assets/models-preview/crossight-360.webp?v=studio3",
    18: "assets/models-preview/spectre-360.webp?v=studio3", 19: "assets/models-preview/rk1-360.webp?v=studio3",
    20: "assets/models-preview/ergo5-360.webp?v=studio3", 21: "assets/models-preview/wpr45-360.webp?v=studio3",
    22: "assets/models-preview/crossight-riser-360.webp?v=studio3", 23: "assets/models-preview/crossight-lopro-360.webp?v=studio3"
  };
  const symbolicPrices = { 1: 12.90, 2: 19.90, 3: 14.90, 4: 39.90, 5: 69.90, 6: 49.90, 7: 59.90, 8: 19.90, 9: 34.90, 10: 44.90, 11: 14.90, 12: 39.90, 13: 149.90, 14: 119.90, 15: 29.90, 16: 349.90, 17: 79.90, 18: 189.90, 19: 89.90, 20: 99.90, 21: 49.90, 22: 39.90, 23: 34.90, 24: 14.90, 25: 44.90, 26: 18.90, 27: 16.90, 28: 18.90, 29: 29.90, 30: 59.90, 31: 39.90, 32: 49.90, 33: 29.90, 34: 24.90, 35: 79.90, 36: 49.90, 37: 19.90, 38: 16.90, 39: 14.90, 40: 29.90, 41: 69.90, 42: 109.90, 43: 79.90, 44: 39.90, 45: 159.90, 46: 24.90, 47: 49.90, 48: 59.90, 49: 34.90, 50: 19.90, 51: 49.90, 52: 1.50, 53: 0.90, 54: 4.50, 55: 2.00, 56: 2.50, 57: 69.90, 58: 7.00, 59: 149.90, 60: 119.90, 61: 299.90, 62: 169.90, 63: 49.90 };

  const bulkPricing = {
    52: { bulk50: 1.10, bulk100: 0.85 },
    53: { bulk50: 0.70, bulk100: 0.55 },
    54: { bulk50: 3.50, bulk100: 2.90 },
    55: { bulk50: 1.50, bulk100: 1.20 },
    56: { bulk50: 1.90, bulk100: 1.50 },
    58: { bulk50: 5.50, bulk100: 4.50 }
  };

  const defaultCategories = [
    { value: "chaveiros", label: "Chaveiros" },
    { value: "personalizado", label: "Personalizados" },
    { value: "marcapaginas", label: "Marca-páginas" },
    { value: "letras", label: "Nomes & letras 3D" },
    { value: "figures", label: "Action Figures" },
    { value: "airsoft", label: "Airsoft" },
    { value: "casa", label: "Casa & organização" },
    { value: "decoracao", label: "Decoração" },
    { value: "papelaria", label: "Papelaria & eventos" },
    { value: "empresarial", label: "Kits empresariais" }
  ];

  function loadCategories() {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY));
      if (!Array.isArray(saved) || !saved.length) return structuredClone(defaultCategories);
      return saved.filter(category => category && category.value && category.label);
    } catch {
      return structuredClone(defaultCategories);
    }
  }

  function saveCategories(categories) {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent("catalog-local-changed", { detail: { type: "categories" } }));
  }

  function categorySlug(label, categories = loadCategories()) {
    const base = String(label || "categoria").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "categoria";
    let value = base;
    let suffix = 2;
    while (categories.some(category => category.value === value)) value = `${base}-${suffix++}`;
    return value;
  }

  const defaultProducts = [
    { id: 1, name: "Chaveiro com nome", category: "chaveiros", label: "Chaveiros", material: "PLA", price: null, art: "art-ring", shape: "ring", color: "#e85a24", shadow: "#231f20", modelUrl: "", description: "Nome em relevo, duas cores e diferentes formatos para lembranças ou uso pessoal." },
    { id: 2, name: "Chaveiro com QR Code", category: "chaveiros", label: "Chaveiros", material: "PLA", price: null, art: "art-ring", shape: "ring", color: "#242424", shadow: "#e85a24", modelUrl: "", description: "Direcione para rede social, cardápio, contato ou página da empresa." },
    { id: 3, name: "Tag de identificação pet", category: "personalizado", label: "Personalizados", material: "PLA / PETG", price: null, art: "", shape: "plaque", color: "#4f3a73", shadow: "#e85a24", modelUrl: "", description: "Nome do animal e telefone em uma peça leve, colorida e personalizada." },
    { id: 4, name: "Letreiro personalizado com nome", category: "letras", label: "Nomes & letras 3D", material: "PLA", price: null, art: "art-stand", shape: "stand", color: "#e85a24", shadow: "#242424", modelUrl: "", description: "Nome ou frase em letras 3D para mesa, parede, balcão, quarto ou decoração de evento." },
    { id: 5, name: "Expositor para airsoft", category: "airsoft", label: "Airsoft", material: "PETG", price: null, art: "art-stand", shape: "stand", color: "#242424", shadow: "#4f3a73", modelUrl: "", description: "Suporte de exposição para organizar equipamentos de airsoft com visual limpo." },
    { id: 6, name: "Organizador de acessórios", category: "airsoft", label: "Airsoft", material: "PETG", price: null, art: "art-gear", shape: "gear", color: "#4f3a73", shadow: "#171717", modelUrl: "", description: "Bandeja modular para patches, baterias, ferramentas e pequenos acessórios." },
    { id: 9, name: "Organizador modular", category: "casa", label: "Casa & organização", material: "PLA", price: null, art: "art-stand", shape: "stand", color: "#262626", shadow: "#4f3a73", modelUrl: "", description: "Módulos combináveis para escritório, bancada, cozinha ou coleção." },
    { id: 10, name: "Vaso paramétrico", category: "decoracao", label: "Decoração", material: "PLA", price: null, art: "art-vase", shape: "vase", color: "#e85a24", shadow: "#231f20", modelUrl: "", description: "Forma geométrica produzida em camadas, com tamanho e cor personalizáveis." },
    { id: 13, name: "Action figure personalizada", category: "figures", label: "Action Figures", material: "Resina / PLA", price: null, art: "", shape: "figure", color: "#4f3a73", shadow: "#171717", modelUrl: "", description: "Personagem personalizado a partir de uma ideia, referência ou modelo 3D autorizado." },
    { id: 14, name: "Busto colecionável", category: "figures", label: "Action Figures", material: "Resina", price: null, art: "", shape: "figure", color: "#e85a24", shadow: "#242424", modelUrl: "", description: "Busto decorativo com base, produzido para coleção, presente ou exposição." },
    { id: 15, name: "Base para miniaturas", category: "figures", label: "Action Figures", material: "PLA / Resina", price: null, art: "art-stand", shape: "stand", color: "#242424", shadow: "#e85a24", modelUrl: "", description: "Base com nome, cenário ou encaixe personalizado para destacar a coleção." },
    { id: 16, name: "Pacote completo Toy Guns — Modpack #1", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/spectre-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Luneta Spectre incluída no pacote", description: "Pacote com 7 conjuntos cenográficos: Crossight, elevador Crossight, base baixa Crossight, Spectre, RK-1, Ergo5 e WPR45. São 24 arquivos STL no total, incluindo as peças necessárias para montagem. Compatibilidade confirmada antes da produção." },
    { id: 17, name: "Mira cenográfica Crossight", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/crossight-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real da mira Crossight", description: "Mira decorativa modular com corpo, tampa e lente cenográfica. Produzida sob encomenda para brinquedo ou airsoft; montagem com parafusos M2x8 e encaixe verificado antes da impressão." },
    { id: 18, name: "Luneta cenográfica Spectre", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/spectre-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real da luneta Spectre", description: "Luneta cenográfica de visual tático, formada por corpo, anéis, torres e alavanca de zoom. Impressa em componentes para melhor acabamento; montagem pode exigir parafusos e adesivo." },
    { id: 19, name: "Grip cenográfico RK-1", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/rk1-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real do grip RK-1", description: "Grip cenográfico compacto com peça principal, base e retentor. Indicado somente para brinquedos e equipamentos de airsoft, com encaixe e medidas confirmados antes da produção." },
    { id: 20, name: "Empunhadura cenográfica Ergo5", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/ergo5-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real da empunhadura Ergo5", description: "Empunhadura cenográfica com formato ergonômico e acabamento em camadas. Disponível em cores sob consulta; a compatibilidade com o brinquedo ou airsoft é conferida antes da impressão." },
    { id: 21, name: "Suporte cenográfico WPR45", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/wpr45-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real do suporte WPR45", description: "Suporte cenográfico angular formado por base e retentor. Feito sob encomenda para brinquedo ou airsoft, com montagem por parafusos M2x8 e verificação prévia de medidas." },
    { id: 22, name: "Elevador cenográfico Crossight", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/crossight-riser-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real do elevador Crossight", description: "Base elevada para o conjunto Crossight, composta por suporte e retentor. Impressa sob encomenda para brinquedo ou airsoft, com encaixe e altura conferidos antes da produção." },
    { id: 23, name: "Base baixa cenográfica Crossight", category: "airsoft", label: "Airsoft / brinquedo", material: "PETG recomendado", price: null, art: "art-gear", shape: "gear", color: "#f04400", shadow: "#171717", modelUrl: "", previewSprite: "assets/models-preview/crossight-lopro-360.webp?v=studio2", previewFrames: 36, previewColumns: 6, previewLabel: "Modelo real da base baixa Crossight", description: "Suporte de perfil baixo para o conjunto Crossight, formado por base e retentor. Indicado somente para brinquedo ou airsoft, com compatibilidade verificada antes da impressão." },
    { id: 24, name: "Chaveiro 3D MAIA personalizável", category: "chaveiros", label: "Chaveiros", material: "PLA", price: null, color: "#e85a24", shadow: "#202124", previewSprite: "assets/catalog-open/chaveiro-maia-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Chaveiro original 3D MAIA", description: "Base exclusiva da 3D MAIA, leve e compacta. Pode receber nome, telefone, frase curta ou cores escolhidas pelo cliente.", license: "Design próprio 3D MAIA" },
    { id: 25, name: "Suporte de celular para mesa", category: "casa", label: "Casa & organização", material: "PLA / PETG", price: null, color: "#3b3e43", shadow: "#171717", previewSprite: "assets/catalog-open/suporte-celular-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Suporte de celular", description: "Suporte inclinado com passagem para cabo. Mede aproximadamente 78 × 90 × 76 mm e cabe na Bambu Lab A1 e A1 mini.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 26, name: "Organizador de cabos — 5 vias", category: "casa", label: "Casa & organização", material: "TPU / PETG", price: null, color: "#44474d", shadow: "#171717", previewSprite: "assets/catalog-open/organizador-cabos-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Organizador de cabos", description: "Pente compacto para separar os cabos da mesa. Mede cerca de 58 × 18 × 12 mm e imprime rápido.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 27, name: "Gancho compacto para fone", category: "casa", label: "Casa & organização", material: "PETG", price: null, color: "#303338", shadow: "#171717", previewSprite: "assets/catalog-open/gancho-fone-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Gancho para fone", description: "Gancho pequeno para organizar fones e cabos. Peça de 24 mm, adequada para produção rápida em lote.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 28, name: "Presilha de cabo para borda da mesa", category: "casa", label: "Casa & organização", material: "PETG", price: null, color: "#3b3e43", shadow: "#171717", previewSprite: "assets/catalog-open/presilha-cabo-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Presilha de cabo", description: "Mantém o cabo de carregamento ao alcance, preso à borda da mesa. Confirme a espessura do móvel antes do pedido.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 29, name: "Suporte para fones earbuds", category: "casa", label: "Casa & organização", material: "PLA", price: null, color: "#4f3a73", shadow: "#171717", previewSprite: "assets/catalog-open/suporte-earbuds-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Suporte para earbuds", description: "Base compacta para deixar fones pequenos organizados na mesa, com formato limpo e opção de várias cores.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 30, name: "Porta-chaves e correspondências", category: "casa", label: "Casa & organização", material: "PETG", price: null, color: "#34373c", shadow: "#171717", previewSprite: "assets/catalog-open/porta-chaves-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Organizador de parede", description: "Organizador de parede com espaço para cartas e ganchos para chaves. Mede cerca de 110 × 42 × 95 mm.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 31, name: "Dock para carregador de celular", category: "casa", label: "Casa & organização", material: "PLA / PETG", price: null, color: "#3b3e43", shadow: "#171717", previewSprite: "assets/catalog-open/dock-carregador-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Dock para carregador", description: "Dock compacto para apoiar o celular enquanto carrega. O encaixe do cabo é confirmado antes da impressão.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 32, name: "Suporte de ferramentas e canetas", category: "casa", label: "Casa & organização", material: "PETG", price: null, color: "#34373c", shadow: "#171717", previewSprite: "assets/catalog-open/suporte-ferramentas-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Suporte de ferramentas", description: "Rack de parede para canetas, marcadores e ferramentas leves. Mede aproximadamente 92 × 46 × 72 mm.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 33, name: "Cesto para painel perfurado", category: "casa", label: "Casa & organização", material: "PETG", price: null, color: "#44474d", shadow: "#171717", previewSprite: "assets/catalog-open/cesto-painel-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Cesto para pegboard", description: "Cesto compacto para painel perfurado, ideal para parafusos e pequenos acessórios. Confirme o padrão do painel antes do pedido.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 34, name: "Caixa modular Gridfinity 2 × 1", category: "casa", label: "Casa & organização", material: "PLA / PETG", price: null, color: "#3b3e43", shadow: "#171717", previewSprite: "assets/catalog-open/caixa-gridfinity-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Caixa Gridfinity", description: "Caixa modular de 83,5 × 41,5 × 34 mm para gavetas e bancadas compatíveis com o padrão Gridfinity.", sourceUrl: "https://github.com/zohebzma2-cmyk/zohebalvi-open-source", author: "Zoheb Alvi", license: "CC BY 4.0" },
    { id: 35, name: "Gaveteiro modular compacto", category: "casa", label: "Casa & organização", material: "PLA", price: null, color: "#34373c", shadow: "#171717", previewSprite: "assets/catalog-open/gaveteiro-modular-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Gaveteiro modular", description: "Conjunto com caixa e gaveta para peças pequenas. O maior componente mede aproximadamente 111 mm e cabe na A1 mini.", sourceUrl: "https://github.com/sabersingh/3D-Printable-Modular-Drawers", author: "Saber Singh", license: "CC0 1.0" },
    { id: 36, name: "Vaso geométrico Hex Twist", category: "decoracao", label: "Decoração", material: "PLA", price: null, color: "#4f3a73", shadow: "#171717", previewSprite: "assets/catalog-open/vaso-hex-twist-360.webp", previewFrames: 18, previewColumns: 6, previewLabel: "Vaso Hex Twist", description: "Vaso decorativo de linhas torcidas, com cerca de 53 × 53 × 65 mm. Pode ser ampliado e produzido em várias cores.", sourceUrl: "https://github.com/DrLex0/print3d-hex-twist-surface-vase", author: "DrLex", license: "CC BY 4.0" },
    { id: 37, name: "Chaveiro temático de personagem", category: "chaveiros", label: "Chaveiros", material: "PLA multicolor", price: null, color: "#f04400", shadow: "#242424", shape: "ring", photos: ["assets/catalog-sales/37-chaveiro-personagem.jpg?v=8"], description: "Chaveiro com personagem, nome ou número. Temas como Pokémon são produzidos somente com arte ou modelo autorizado pelo cliente; cores e tamanho sob consulta.", license: "Sob encomenda · arte autorizada" },
    { id: 38, name: "Chaveiro nome gamer", category: "chaveiros", label: "Chaveiros", material: "PLA multicolor", price: null, color: "#34373c", shadow: "#f04400", shape: "ring", photos: ["assets/catalog-sales/38-chaveiro-gamer.jpg?v=8"], description: "Nome ou nickname em relevo, com duas cores e tipografia de estilo gamer. Ótimo para presente e produção em quantidade.", license: "Design personalizado 3D MAIA" },
    { id: 39, name: "Chaveiro controle retrô", category: "chaveiros", label: "Chaveiros", material: "PLA", price: null, color: "#4f3a73", shadow: "#171717", shape: "ring", photos: ["assets/catalog-sales/39-chaveiro-controle.jpg?v=8"], description: "Mini controle em estilo retrô, leve e resistente, com combinação de cores escolhida pelo cliente.", license: "Design genérico 3D MAIA" },
    { id: 40, name: "Chaveiro inteligente com NFC", category: "chaveiros", label: "Chaveiros", material: "PLA + tag NFC", price: null, color: "#242424", shadow: "#f04400", shape: "ring", photos: ["assets/catalog-sales/40-chaveiro-nfc.jpg?v=8"], description: "Aproxime do celular para abrir contato, Instagram, cardápio ou link. Personalização frontal e gravação do NFC incluídas.", sourceUrl: "https://github.com/patrikpolyak/github-nfc-keychain", author: "Patrik Polyak", license: "Base aberta CC BY 4.0" },
    { id: 44, name: "Base personalizada para colecionável", category: "figures", label: "Action Figures", material: "PLA / Resina", price: null, color: "#242424", shadow: "#f04400", shape: "stand", photos: ["assets/catalog-sales/44-base-colecionavel.jpg?v=8"], description: "Base com nome, logotipo ou cenário para valorizar miniaturas e action figures já existentes." },
    { id: 45, name: "Action figure sob encomenda", category: "figures", label: "Action Figures", material: "Resina / PLA", price: null, color: "#4f3a73", shadow: "#171717", shape: "figure", photos: ["assets/catalog-sales/45-action-figure.jpg?v=8"], description: "Figura produzida a partir de modelo próprio ou licenciado. O orçamento considera tamanho, nível de detalhe, pintura e acabamento.", license: "Modelo próprio ou autorizado" },
    { id: 50, name: "Marca-página 3D personalizado", category: "marcapaginas", label: "Marca-páginas", material: "PLA", price: null, color: "#34373c", shadow: "#f04400", shape: "plaque", photos: ["assets/catalog-sales/50-marca-pagina-3d.jpg?v=11"], description: "Marca-página leve com nome, frase curta ou desenho vazado. Pode receber tassel e combinação de duas cores." },
    { id: 51, name: "Inicial com nome do bebê", category: "letras", label: "Nomes & letras 3D", material: "PLA", price: null, color: "#d7b8ef", shadow: "#f7f0e8", shape: "stand", photos: ["assets/catalog-sales/51-inicial-nome-bebe.jpg?v=12"], description: "Decoração com a letra inicial grande e o nome do bebê em destaque na frente. Ideal para quarto, chá de bebê, mesversário e mesa de festa." },
    { id: 52, name: "Tag personalizada em papel kraft", category: "papelaria", label: "Papelaria & eventos", material: "Papel kraft", price: null, color: "#8b5e3c", shadow: "#242424", shape: "plaque", photos: ["assets/catalog-sales/52-tag-kraft.jpg?v=11"], description: "Tags para embalagens, lembrancinhas e presentes, com arte personalizada, furo e opção de cordão. Valor inicial para pequenos lotes." },
    { id: 53, name: "Cartão de visita personalizado", category: "papelaria", label: "Papelaria & eventos", material: "Papel couchê", price: null, color: "#242424", shadow: "#f04400", shape: "plaque", photos: ["assets/catalog-sales/53-cartao-visita.jpg?v=11"], description: "Cartão de visita com impressão colorida frente ou frente e verso. Quantidade, gramatura e acabamento definidos no orçamento." },
    { id: 54, name: "Marca-página tradicional", category: "marcapaginas", label: "Marca-páginas", material: "Papel couchê / fotográfico", price: null, color: "#4f3a73", shadow: "#f04400", shape: "plaque", photos: ["assets/catalog-sales/54-marca-pagina-papel.jpg?v=11"], description: "Marca-página em papel com arte personalizada, opção de laminação, cantos arredondados e tassel." },
    { id: 55, name: "Adesivo personalizado", category: "papelaria", label: "Papelaria & eventos", material: "Vinil adesivo", price: null, color: "#f04400", shadow: "#242424", shape: "plaque", photos: ["assets/catalog-sales/55-adesivo-personalizado.jpg?v=11"], description: "Adesivos com nome, marca, frase ou desenho, disponíveis em cartela ou corte individual conforme o formato." },
    { id: 56, name: "Pulseira personalizada para festas", category: "papelaria", label: "Papelaria & eventos", material: "Tyvek / papel sintético", price: null, color: "#4f3a73", shadow: "#f04400", shape: "ring", photos: ["assets/catalog-sales/56-pulseira-evento-tyvek.jpg?v=12"], description: "Pulseiras retas de identificação em Tyvek ou papel sintético, com fechamento adesivo, cores vivas e personalização com nome, data ou tema do evento." },
    { id: 57, name: "Caixa cartonada personalizada", category: "papelaria", label: "Papelaria & eventos", material: "Papelão rígido / cartão", price: null, color: "#8b5e3c", shadow: "#242424", shape: "plaque", photos: ["assets/catalog-sales/57-caixa-cartonada.jpg?v=13"], description: "Caixas para presentes, lembrancinhas, kits e produtos, personalizadas com cores, adesivos, cinta ou identidade da marca." },
    { id: 58, name: "Sacola personalizada", category: "papelaria", label: "Papelaria & eventos", material: "Papel kraft / cartão", price: null, color: "#242424", shadow: "#f04400", shape: "plaque", photos: ["assets/catalog-sales/58-sacola-personalizada.jpg?v=13"], description: "Sacolas de papel com alça e personalização para lojas, presentes, eventos e lembrancinhas. Tamanho e quantidade definidos no orçamento." },
    { id: 59, name: "Kit Festa Personalizado", category: "papelaria", label: "Papelaria & eventos", material: "Papel + adesivo + opcionais 3D", price: null, color: "#f04400", shadow: "#4f3a73", shape: "plaque", photos: ["assets/catalog-sales/59-kit-festa.jpg?v=13"], description: "Kit montado conforme o tema, podendo incluir tags, adesivos, pulseiras, marca-páginas, caixas, sacolas e decoração 3D. Valor inicial sujeito à quantidade." },
    { id: 60, name: "Kit Empresarial Essencial", category: "empresarial", label: "Kits empresariais", material: "Papel couchê + kraft + vinil", price: null, color: "#242424", shadow: "#f04400", shape: "plaque", photos: ["assets/catalog-sales/60-kit-empresarial-essencial.jpg?v=13"], description: "Pacote inicial para pequenos negócios com cartões de visita, tags kraft e adesivos personalizados. Quantidades são combinadas no orçamento." },
    { id: 61, name: "Kit Empresarial Completo", category: "empresarial", label: "Kits empresariais", material: "Papel + embalagem + peça 3D", price: null, color: "#34373c", shadow: "#4f3a73", shape: "plaque", photos: ["assets/catalog-sales/61-kit-empresarial-completo.jpg?v=13"], description: "Identidade aplicada em cartões, tags, adesivos, sacolas, caixas cartonadas e expositor com QR Code. Montagem personalizada para cada empresa." },
    { id: 62, name: "Kit Bebê e Mesversário", category: "personalizado", label: "Personalizados", material: "Papel + PLA", price: null, color: "#d7b8ef", shadow: "#f7f0e8", shape: "stand", photos: ["assets/catalog-sales/62-kit-bebe-mesversario.jpg?v=13"], description: "Conjunto para quarto, chá de bebê ou mesversário com inicial e nome 3D, tags, adesivos, marca-páginas e embalagens combinando." },
    { id: 63, name: "Sinete personalizado 3D", category: "personalizado", label: "Personalizados", material: "Resina / PLA de alta definição", price: null, color: "#34373c", shadow: "#f04400", shape: "stand", photos: ["assets/catalog-sales/63-sinete-personalizado.jpg?v=17"], description: "Sinete para lacre de cera com inicial, monograma, nome ou logotipo. Inclui cabo e matriz personalizada; a arte e o tamanho são confirmados antes da produção." }
  ];

  function withSymbolicPrices(products) {
    return products.map(product => Number(product.price) > 0 ? product : { ...product, price: symbolicPrices[product.id] ?? null });
  }

  function withBulkPricing(products) {
    return products.map(product => bulkPricing[product.id] ? { ...product, ...bulkPricing[product.id] } : product);
  }

  function withGraphitePreviews(products) {
    return products.map(product => graphitePreviews[product.id] ? { ...product, color: "#34373c", previewSprite: graphitePreviews[product.id] } : product);
  }

  const illustrativePhotos = {
    chaveiros: "assets/catalog-sales/categoria-chaveiros.jpg?v=11",
    personalizado: "assets/catalog-sales/categoria-personalizados.jpg?v=11",
    letras: "assets/catalog-sales/51-inicial-nome-bebe.jpg?v=12",
    figures: "assets/catalog-sales/categoria-figures.jpg?v=11",
    airsoft: "assets/catalog-sales/categoria-airsoft.jpg?v=11",
    casa: "assets/catalog-sales/categoria-casa.jpg?v=11",
    decoracao: "assets/catalog-sales/categoria-decoracao.jpg?v=11",
    papelaria: "assets/catalog-sales/categoria-papelaria.jpg?v=13",
    empresarial: "assets/catalog-sales/61-kit-empresarial-completo.jpg?v=13"
  };

  const illustrativePhotoOverrides = {
    1: "assets/catalog-sales/38-chaveiro-gamer.jpg?v=11",
    2: "assets/catalog-sales/categoria-personalizados.jpg?v=11",
    3: "assets/catalog-sales/categoria-personalizados.jpg?v=11",
    4: "assets/catalog-sales/categoria-personalizados.jpg?v=11",
    13: "assets/catalog-sales/45-action-figure.jpg?v=11",
    14: "assets/catalog-sales/45-action-figure.jpg?v=11",
    15: "assets/catalog-sales/44-base-colecionavel.jpg?v=11"
  };

  function withIllustrativePhotos(products) {
    return products.map(product => {
      const fallback = illustrativePhotoOverrides[product.id] || illustrativePhotos[product.category];
      const photos = Array.isArray(product.photos) && product.photos.length ? product.photos : fallback ? [fallback] : [];
      const { previewSprite, previewFrames, previewColumns, previewLabel, ...cleanProduct } = product;
      return { ...cleanProduct, photos };
    });
  }

  function withoutRemovedCategories(products) {
    return products.filter(product => !["adulto", "games", "automotivo"].includes(product.category));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return withBulkPricing(withIllustrativePhotos(withGraphitePreviews(withSymbolicPrices(structuredClone(defaultProducts)))));
      let migrated = saved;
      let changed = false;
      if (!localStorage.getItem(PRICE_MIGRATION_KEY)) {
        migrated = withSymbolicPrices(migrated);
        localStorage.setItem(PRICE_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(CONTENT_MIGRATION_KEY)) {
        const product = defaultProducts.find(item => item.id === 16);
        if (product && !migrated.some(item => Number(item.id) === product.id)) {
          migrated = [...migrated, withSymbolicPrices([structuredClone(product)])[0]];
          changed = true;
        }
        localStorage.setItem(CONTENT_MIGRATION_KEY, "done");
      }
      if (!localStorage.getItem(PREVIEW_MIGRATION_KEY)) {
        const preview = defaultProducts.find(item => item.id === 16);
        migrated = migrated.map(item => Number(item.id) === 16 ? {
          ...item,
          previewSprite: preview.previewSprite,
          previewFrames: preview.previewFrames,
          previewColumns: preview.previewColumns,
          previewLabel: preview.previewLabel
        } : item);
        localStorage.setItem(PREVIEW_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(PACK_PRODUCTS_MIGRATION_KEY)) {
        const packProducts = defaultProducts.filter(item => item.id >= 16 && item.id <= 21);
        const pack = packProducts.find(item => item.id === 16);
        migrated = migrated.map(item => Number(item.id) === 16 ? {
          ...item,
          name: pack.name,
          label: pack.label,
          material: pack.material,
          description: pack.description,
          previewSprite: pack.previewSprite,
          previewFrames: pack.previewFrames,
          previewColumns: pack.previewColumns,
          previewLabel: pack.previewLabel
        } : item);
        for (const product of packProducts.filter(item => item.id !== 16)) {
          if (!migrated.some(item => Number(item.id) === product.id)) {
            migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
          }
        }
        localStorage.setItem(PACK_PRODUCTS_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(COMPLETE_PACK_MIGRATION_KEY)) {
        const pack = defaultProducts.find(item => item.id === 16);
        migrated = migrated.map(item => Number(item.id) === 16 ? {
          ...item,
          description: pack.description
        } : item);
        for (const product of defaultProducts.filter(item => item.id === 22 || item.id === 23)) {
          if (!migrated.some(item => Number(item.id) === product.id)) {
            migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
          }
        }
        localStorage.setItem(COMPLETE_PACK_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(VISUAL_STYLE_MIGRATION_KEY)) {
        const styledPreviews = new Map(defaultProducts.filter(item => item.id >= 16 && item.id <= 23).map(item => [item.id, item]));
        migrated = migrated.map(item => {
          const styled = styledPreviews.get(Number(item.id));
          return styled ? { ...item, previewSprite: styled.previewSprite, previewFrames: styled.previewFrames, previewColumns: styled.previewColumns, previewLabel: styled.previewLabel } : item;
        });
        localStorage.setItem(VISUAL_STYLE_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(GRAPHITE_STYLE_MIGRATION_KEY)) {
        migrated = withGraphitePreviews(migrated);
        localStorage.setItem(GRAPHITE_STYLE_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(OPEN_CATALOG_MIGRATION_KEY)) {
        for (const product of defaultProducts.filter(item => item.id >= 24 && item.id <= 36)) {
          if (!migrated.some(item => Number(item.id) === product.id)) {
            migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
          }
        }
        localStorage.setItem(OPEN_CATALOG_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(SALES_CATALOG_MIGRATION_KEY)) {
        for (const product of defaultProducts.filter(item => item.id >= 37 && item.id <= 49)) {
          if (!migrated.some(item => Number(item.id) === product.id)) {
            migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
          }
        }
        localStorage.setItem(SALES_CATALOG_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(SALES_MEDIA_MIGRATION_KEY)) {
        const mediaProducts = new Map(defaultProducts.filter(item => item.id >= 37 && item.id <= 49).map(item => [item.id, item]));
        migrated = migrated.map(item => {
          const updated = mediaProducts.get(Number(item.id));
          return updated ? { ...item, photos: structuredClone(updated.photos) } : item;
        });
        localStorage.setItem(SALES_MEDIA_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(PAPER_EXPANSION_MIGRATION_KEY)) {
        for (const product of defaultProducts.filter(item => item.id >= 50 && item.id <= 62)) {
          if (!migrated.some(item => Number(item.id) === product.id)) {
            migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
          }
        }
        localStorage.setItem(PAPER_EXPANSION_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(ILLUSTRATIVE_MEDIA_MIGRATION_KEY)) {
        migrated = withIllustrativePhotos(migrated);
        localStorage.setItem(ILLUSTRATIVE_MEDIA_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(REMOVE_CATEGORIES_MIGRATION_KEY)) {
        migrated = withoutRemovedCategories(migrated);
        localStorage.setItem(REMOVE_CATEGORIES_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(CATEGORY_REORGANIZATION_MIGRATION_KEY)) {
        migrated = migrated.map(product => {
          if ([4, 51].includes(Number(product.id))) return { ...product, category: "letras", label: "Nomes & letras 3D" };
          if ([60, 61].includes(Number(product.id))) return { ...product, category: "empresarial", label: "Kits empresariais" };
          return product;
        });
        localStorage.setItem(CATEGORY_REORGANIZATION_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(SEAL_PRODUCT_MIGRATION_KEY)) {
        const product = defaultProducts.find(item => item.id === 63);
        if (product && !migrated.some(item => Number(item.id) === 63)) {
          migrated.push(withSymbolicPrices([structuredClone(product)])[0]);
        }
        localStorage.setItem(SEAL_PRODUCT_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(BULK_PRICING_MIGRATION_KEY)) {
        migrated = withBulkPricing(migrated).map(product => bulkPricing[product.id] ? { ...product, price: symbolicPrices[product.id] } : product);
        localStorage.setItem(BULK_PRICING_MIGRATION_KEY, "done");
        changed = true;
      }
      if (!localStorage.getItem(BOOKMARK_CATEGORY_MIGRATION_KEY)) {
        migrated = migrated.map(product => [50, 54].includes(Number(product.id)) ? { ...product, category: "marcapaginas", label: "Marca-páginas" } : product);
        localStorage.setItem(BOOKMARK_CATEGORY_MIGRATION_KEY, "done");
        changed = true;
      }
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return withBulkPricing(withIllustrativePhotos(withoutRemovedCategories(migrated)));
    } catch {
      return withBulkPricing(withIllustrativePhotos(withGraphitePreviews(withSymbolicPrices(structuredClone(defaultProducts)))));
    }
  }

  function save(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("catalog-local-changed", { detail: { type: "products" } }));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PRICE_MIGRATION_KEY);
    localStorage.removeItem(CONTENT_MIGRATION_KEY);
    localStorage.removeItem(PREVIEW_MIGRATION_KEY);
    localStorage.removeItem(PACK_PRODUCTS_MIGRATION_KEY);
    localStorage.removeItem(COMPLETE_PACK_MIGRATION_KEY);
    localStorage.removeItem(VISUAL_STYLE_MIGRATION_KEY);
    localStorage.removeItem(GRAPHITE_STYLE_MIGRATION_KEY);
    localStorage.removeItem(OPEN_CATALOG_MIGRATION_KEY);
    localStorage.removeItem(SALES_CATALOG_MIGRATION_KEY);
    localStorage.removeItem(SALES_MEDIA_MIGRATION_KEY);
    localStorage.removeItem(ILLUSTRATIVE_MEDIA_MIGRATION_KEY);
    localStorage.removeItem(PAPER_EXPANSION_MIGRATION_KEY);
    localStorage.removeItem(REMOVE_CATEGORIES_MIGRATION_KEY);
    localStorage.removeItem(CATEGORY_REORGANIZATION_MIGRATION_KEY);
    localStorage.removeItem(SEAL_PRODUCT_MIGRATION_KEY);
    localStorage.removeItem(BULK_PRICING_MIGRATION_KEY);
    localStorage.removeItem(BOOKMARK_CATEGORY_MIGRATION_KEY);
    const products = withBulkPricing(withIllustrativePhotos(withoutRemovedCategories(withGraphitePreviews(withSymbolicPrices(structuredClone(defaultProducts))))));
    window.dispatchEvent(new CustomEvent("catalog-local-changed", { detail: { type: "reset" } }));
    return products;
  }

  function nextId(products) {
    return products.reduce((largest, product) => Math.max(largest, Number(product.id) || 0), 0) + 1;
  }

  function categoryLabel(value) {
    return loadCategories().find(category => category.value === value)?.label || value;
  }

  window.CatalogStore = { STORAGE_KEY, CATEGORY_STORAGE_KEY, get categories() { return loadCategories(); }, defaultProducts, load, save, reset, nextId, categoryLabel, loadCategories, saveCategories, categorySlug };
})();
