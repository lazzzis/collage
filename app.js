const preview = document.getElementById("preview");
const bottomLabel = document.getElementById("bottomLabel");
const borderColor = document.getElementById("borderColor");
const borderSize = document.getElementById("borderSize");
const borderSizeValue = document.getElementById("borderSizeValue");
const caption = document.getElementById("caption");
const captionColor = document.getElementById("captionColor");
const captionFont = document.getElementById("captionFont");
const toggleRadius = document.getElementById("toggleRadius");
const toggleInnerBorder = document.getElementById("toggleInnerBorder");
const bottomBorderSize = document.getElementById("bottomBorderSize");
const bottomBorderValue = document.getElementById("bottomBorderValue");
const exportButton = document.getElementById("exportButton");
const addThirdBtn = document.getElementById("addThirdBtn");

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

function updateRadius() {
  preview.style.setProperty("--panel-radius", toggleRadius.checked ? "8px" : "0px");
}

function updateInnerBorder() {
  if (toggleInnerBorder.checked) {
    preview.style.removeProperty("--gap-size");
  } else {
    preview.style.setProperty("--gap-size", "0px");
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
    if (slotIndex === 2) {
      preview.classList.add("has-third");
    }
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

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function exportCollage() {
  if (!images[0] || !images[1]) {
    window.alert("请先上传前两张图片后再导出。");
    return;
  }

  const activeImages = images.filter(Boolean);
  const panelCount = activeImages.length;

  const previewRect = preview.getBoundingClientRect();
  const computed = getComputedStyle(preview);
  const borderSizeValue = parseFloat(computed.getPropertyValue("--border-size")) || 0;
  const bottomBorderValue = parseFloat(computed.getPropertyValue("--bottom-border-size")) || 0;
  const gapValue = parseFloat(computed.getPropertyValue("--gap-size")) || borderSizeValue;
  const panelRadius = parseFloat(computed.getPropertyValue("--panel-radius")) || 0;

  const outputWidth = 1800;
  const scale = outputWidth / previewRect.width;
  const outputHeight = Math.round(outputWidth * (previewRect.height / previewRect.width));
  const border = borderSizeValue * scale;
  const gap = gapValue * scale;
  const bottomExtra = bottomBorderValue * scale;
  const bottomArea = border + bottomExtra;
  const innerWidth = outputWidth - border * 2;
  const innerHeight = outputHeight - border * 2 - bottomExtra;
  const panelsHeight = innerHeight - gap * (panelCount - 1);
  const panelHeight = panelsHeight / panelCount;
  const panelWidth = innerWidth;
  const radius = panelRadius * scale;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = computed.getPropertyValue("--border-color").trim();
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  activeImages.forEach((img, index) => {
    const x = border;
    const y = border + index * (panelHeight + gap);
    ctx.save();
    roundedRectPath(ctx, x, y, panelWidth, panelHeight, radius);
    ctx.clip();
    drawCover(ctx, img, x, y, panelWidth, panelHeight);
    ctx.restore();
  });

  // Repaint borders to guarantee visibility even if image draw bleeds by a pixel.
  ctx.fillStyle = computed.getPropertyValue("--border-color").trim();
  const bottomAreaHeight = border + bottomExtra;
  ctx.fillRect(0, 0, outputWidth, border);
  ctx.fillRect(0, 0, border, outputHeight);
  ctx.fillRect(outputWidth - border, 0, border, outputHeight);
  ctx.fillRect(0, outputHeight - bottomAreaHeight, outputWidth, bottomAreaHeight);

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
toggleRadius.addEventListener("change", updateRadius);
toggleInnerBorder.addEventListener("change", updateInnerBorder);
exportButton.addEventListener("click", exportCollage);
addThirdBtn.addEventListener("click", () => {
  document.querySelector('.panel-input[data-slot="2"]').click();
});

Array.from(document.querySelectorAll(".panel-input")).forEach((input) => {
  input.addEventListener("change", handleUpload);
});

updateBorderColor();
updateBorderSize();
updateBottomBorder();
updateCaptionColor();
updateCaptionFont();
updateRadius();
updateInnerBorder();
