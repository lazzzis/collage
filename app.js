const preview = document.getElementById("preview");
const bottomLabel = document.getElementById("bottomLabel");
const borderColor = document.getElementById("borderColor");
const borderSize = document.getElementById("borderSize");
const borderSizeValue = document.getElementById("borderSizeValue");
const caption = document.getElementById("caption");
const captionColor = document.getElementById("captionColor");
const captionFont = document.getElementById("captionFont");
const bottomBorderSize = document.getElementById("bottomBorderSize");
const bottomBorderValue = document.getElementById("bottomBorderValue");
const exportButton = document.getElementById("exportButton");

const slots = Array.from(preview.querySelectorAll(".panel"));
const images = [null, null, null];

function updateBorderSize() {
  const value = Number(borderSize.value);
  preview.style.setProperty("--border-size", `${value}px`);
  borderSizeValue.textContent = `${value} px`;
}

function updateBorderColor() {
  preview.style.setProperty("--border-color", borderColor.value);
}

function updateBottomBorder() {
  const value = Number(bottomBorderSize.value);
  preview.style.setProperty("--bottom-border-size", `${value}px`);
  bottomBorderValue.textContent = `${value} px`;
}

function updateCaption() {
  const text = caption.value.trim();
  bottomLabel.textContent = text;
}

function updateCaptionColor() {
  preview.style.setProperty("--caption-color", captionColor.value);
}

function updateCaptionFont() {
  const value = captionFont.value.trim();
  if (value) {
    preview.style.setProperty("--caption-font", value);
  } else {
    preview.style.removeProperty("--caption-font");
  }
}

function handleUpload(event) {
  const input = event.target;
  const slotIndex = Number(input.dataset.slot);
  const file = input.files && input.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      images[slotIndex] = image;
    };
    image.src = reader.result;
    const panel = slots[slotIndex];
    const img = panel.querySelector("img");
    img.src = reader.result;
    panel.classList.add("has-image");
  };
  reader.readAsDataURL(file);
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = x + (w - drawWidth) / 2;
  const dy = y + (h - drawHeight) / 2;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
}

function exportCollage() {
  if (images.some((img) => !img)) {
    window.alert("请先上传三张图片后再导出。");
    return;
  }

  const previewRect = preview.getBoundingClientRect();
  const computed = getComputedStyle(preview);
  const borderSizeValue = parseFloat(computed.getPropertyValue("--border-size")) || 0;
  const bottomBorderValue = parseFloat(computed.getPropertyValue("--bottom-border-size")) || 0;

  const outputWidth = 1800;
  const scale = outputWidth / previewRect.width;
  const outputHeight = Math.round(outputWidth * (previewRect.height / previewRect.width));
  const border = borderSizeValue * scale;
  const gap = border;
  const bottomExtra = bottomBorderValue * scale;
  const bottomArea = border + bottomExtra;
  const innerWidth = outputWidth - border * 2;
  const innerHeight = outputHeight - border * 2 - bottomExtra;
  const panelsHeight = innerHeight - gap * 2;
  const panelHeight = panelsHeight / 3;
  const panelWidth = innerWidth;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = computed.getPropertyValue("--border-color").trim();
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  images.forEach((img, index) => {
    const x = border;
    const y = border + index * (panelHeight + gap);
    drawCover(ctx, img, x, y, panelWidth, panelHeight);
  });

  const text = caption.value.trim();
  if (text) {
    const fontSize = Math.max(16, Math.round(bottomArea * 0.38));
    ctx.fillStyle = computed.getPropertyValue("--caption-color").trim();
    const fontStack =
      captionFont.value.trim() || computed.getPropertyValue("--caption-font").trim();
    ctx.font = `${fontSize}px ${fontStack}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textY = outputHeight - bottomArea / 2;
    ctx.fillText(text, outputWidth / 2, textY);
  }

  const link = document.createElement("a");
  link.download = "collage.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

borderColor.addEventListener("input", updateBorderColor);
borderSize.addEventListener("input", updateBorderSize);
bottomBorderSize.addEventListener("input", updateBottomBorder);
caption.addEventListener("input", updateCaption);
captionColor.addEventListener("input", updateCaptionColor);
captionFont.addEventListener("input", updateCaptionFont);
exportButton.addEventListener("click", exportCollage);

Array.from(document.querySelectorAll("input[type=\"file\"]")).forEach((input) => {
  input.addEventListener("change", handleUpload);
});

updateBorderColor();
updateBorderSize();
updateBottomBorder();
updateCaptionColor();
updateCaptionFont();
