// ==========================================================
// Neural-iA — Image Tool
// Selecao de imagem robusta para Android / Google Fotos.
// Cada abertura usa um input novo para impedir arquivo antigo.
// ==========================================================

import { askVision } from "./neural-api.js";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
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
        // O Data URL é criado diretamente a partir do File entregue
        // pelo seletor. Assim, o preview e o payload usam exatamente
        // os mesmos bytes da imagem escolhida.
        const dataUrl = await fileToDataUrl(file);

        window.neuralImageDataUrl = dataUrl;
        window.neuralImageFile = {
            name: file.name || "imagem",
            type: file.type,
            size: file.size,
            lastModified: file.lastModified || 0
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

    // Um input novo por tentativa evita que o Android/Google Fotos
    // reutilize o File de uma seleção anterior.
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
