(function () {
  const MAX_PHOTOS = 5;
  const MAX_SIDE = 1200;

  async function compress(file) {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} não é uma imagem válida.`);
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#f3f1ed";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.78));
    if (!blob) throw new Error(`Não foi possível processar ${file.name}.`);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, bytes: blob.size };
  }

  async function process(files) {
    const selected = Array.from(files || []).slice(0, MAX_PHOTOS);
    if (!selected.length) return [];
    const photos = [];
    for (const file of selected) photos.push(await compress(file));
    return photos;
  }

  window.PhotoPreview = { process, MAX_PHOTOS };
})();
