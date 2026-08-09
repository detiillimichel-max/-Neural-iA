// ==========================================================
// Neural-iA — Image Tool
// Seleção de imagem robusta para Android / Google Fotos.
// Cada abertura usa um input novo para impedir arquivo antigo.
// ==========================================================

import { askVision } from "./neural-api.js";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VISION_EDGE = 1280;
const MAX_VISION_DATA_URL_LENGTH = 2_400_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getComposerInput() {
    return document.getElementById("chat-input");
}

function getMessages() {
    return document.getElementById("chat-messages");
}

function addMessage(text, type = "ai") {
    const messages = getMessages();
    if (!messages) return null;

    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    return div;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || "");
            if (!result.startsWith("data:image/")) {
                reject(new Error("O arquivo selecionado não é uma imagem válida."));
                return;
            }
            resolve(result);
        };

        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(file);
    });
}

function dataUrlToImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Não foi possível preparar a imagem para análise."));
        image.src = dataUrl;
    });
}

function canvasToDataUrl(canvas, quality) {
    return canvas.toDataURL("image/jpeg", quality);
}

async function prepareVisionImage(dataUrl) {
    const image = await dataUrlToImage(dataUrl);

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const scale = Math.min(1, MAX_VISION_EDGE / Math.max(sourceWidth, sourceHeight));

    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return dataUrl;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    // JPEG comprimido evita enviar imagens gigantes em Base64 para a Edge.
    let prepared = canvasToDataUrl(canvas, 0.78);

    if (prepared.length > MAX_VISION_DATA_URL_LENGTH) {
        prepared = canvasToDataUrl(canvas, 0.64);
    }

    if (prepared.length > MAX_VISION_DATA_URL_LENGTH) {
        const smallerCanvas = document.createElement("canvas");
        smallerCanvas.width = Math.max(1, Math.round(width * 0.75));
        smallerCanvas.height = Math.max(1, Math.round(height * 0.75));
        const smallerContext = smallerCanvas.getContext("2d", { alpha: false });

        if (smallerContext) {
            smallerContext.fillStyle = "#ffffff";
            smallerContext.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height);
            smallerContext.drawImage(image, 0, 0, smallerCanvas.width, smallerCanvas.height);
            prepared = canvasToDataUrl(smallerCanvas, 0.60);
        }
    }

    return prepared;
}

function installImageLayoutStyles() {
    if (document.getElementById("neural-image-layout-styles")) return;

    const style = document.createElement("style");
    style.id = "neural-image-layout-styles";
    style.textContent = `
        .image-preview {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            max-height: 82px;
            margin: 0 0 8px;
            padding: 8px 10px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 14px;
            background: rgba(255,255,255,.04);
            overflow: hidden;
        }

        .image-preview img {
            width: 64px;
            height: 64px;
            flex: 0 0 64px;
            object-fit: cover;
            border-radius: 10px;
            display: block;
        }

        .image-preview-remove {
            width: 30px;
            height: 30px;
            margin-left: auto;
            flex: 0 0 30px;
            border: 0;
            border-radius: 50%;
            background: rgba(255,255,255,.08);
            color: inherit;
            font-size: 20px;
            cursor: pointer;
        }

        .message-image {
            display: block !important;
            width: min(100%, 360px) !important;
            max-width: 360px !important;
            height: auto !important;
            max-height: 360px !important;
            object-fit: contain !important;
            border-radius: 16px;
            margin: 0 0 8px;
        }

        .message.user .message-image {
            width: min(100%, 360px) !important;
            max-width: 360px !important;
            height: auto !important;
            max-height: 360px !important;
        }
    `;
    document.head.appendChild(style);
}

function showPreview(dataUrl) {
    const composer = document.querySelector(".composer");
    if (!composer) return;

    let preview = document.getElementById("imagePreview");

    if (!preview) {
        preview = document.createElement("div");
        preview.id = "imagePreview";
        preview.className = "image-preview";
        composer.prepend(preview);
    }

    preview.innerHTML = "";

    const image = document.createElement("img");
    image.src = dataUrl;
    image.alt = "Imagem selecionada para análise";
    image.width = 64;
    image.height = 64;
    image.style.width = "64px";
    image.style.height = "64px";
    image.style.objectFit = "cover";
    preview.appendChild(image);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "image-preview-remove";
    remove.setAttribute("aria-label", "Remover imagem");
    remove.textContent = "×";
    remove.addEventListener("click", () => {
        clearSelectedImage();
    });
    preview.appendChild(remove);
}

async function handleImage(file) {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
        addMessage("Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.", "ai error");
        return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        addMessage("A imagem é muito grande. Escolha uma imagem de até 8 MB.", "ai error");
        return;
    }

    try {
        const originalDataUrl = await fileToDataUrl(file);
        const dataUrl = await prepareVisionImage(originalDataUrl);

        window.neuralImageDataUrl = dataUrl;
        window.neuralImageFile = {
            name: file.name || "imagem",
            type: "image/jpeg",
            size: file.size,
            lastModified: file.lastModified || 0,
            originalType: file.type
        };

        showPreview(dataUrl);

        const input = getComposerInput();
        if (input && !input.value.trim()) {
            input.placeholder = "Pergunte algo sobre esta imagem...";
            input.focus();
        }
    } catch (error) {
        console.error("Neural-iA image tool:", error);
        addMessage(error?.message || "Não foi possível carregar a imagem.", "ai error");
    }
}

function createFreshImageInput() {
    const oldInput = document.getElementById("imageInput");
    if (oldInput) oldInput.remove();

    const input = document.createElement("input");
    input.type = "file";
    input.id = "imageInput";
    input.accept = ACCEPTED_TYPES.join(",");
    input.hidden = true;

    input.addEventListener("change", async () => {
        const file = input.files?.[0] || null;
        await handleImage(file);
        input.remove();
    }, { once: true });

    document.body.appendChild(input);
    return input;
}

function clearSelectedImage() {
    window.neuralImageDataUrl = null;
    window.neuralImageFile = null;

    const preview = document.getElementById("imagePreview");
    if (preview) preview.remove();

    const input = document.getElementById("imageInput");
    if (input) input.remove();

    const composerInput = getComposerInput();
    if (composerInput) {
        composerInput.placeholder = "Pergunte qualquer coisa...";
    }
}

async function analyzeSelectedImage(prompt) {
    const dataUrl = window.neuralImageDataUrl;

    if (!dataUrl) {
        addMessage("Selecione uma imagem primeiro.", "ai error");
        return null;
    }

    const result = await askVision(prompt, dataUrl);

    if (!result?.success) {
        addMessage(result?.error || "Não foi possível analisar a imagem.", "ai error");
        return null;
    }

    return result;
}

export function openImagePicker() {
    const input = createFreshImageInput();
    input.click();
}

export function setupImageTool() {
    installImageLayoutStyles();

    document.querySelectorAll('[data-tool="image"]').forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openImagePicker();
        });
    });

    window.neuralImage = {
        analyze: analyzeSelectedImage,
        clear: clearSelectedImage
    };
}

setupImageTool();
