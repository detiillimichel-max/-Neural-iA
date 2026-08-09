// ==========================================================
// Neural-iA — Image Tool
// Conecta o botão Imagem à camada neural-api.js.
// Não altera a Edge Function nem expõe nenhuma API key.
// ==========================================================

import { askVision } from "./neural-api.js";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getImageInput() {
    let input = document.getElementById("imageInput");

    if (input) return input;

    input = document.createElement("input");
    input.type = "file";
    input.id = "imageInput";
    input.accept = ACCEPTED_TYPES.join(",");
    input.hidden = true;
    document.body.appendChild(input);

    return input;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));

        reader.readAsDataURL(file);
    });
}

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
        preview.remove();
        const input = document.getElementById("imageInput");
        if (input) input.value = "";
        window.neuralImageDataUrl = null;
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
        const dataUrl = await fileToDataUrl(file);
        window.neuralImageDataUrl = dataUrl;
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
    getImageInput().click();
}

export function setupImageTool() {
    const input = getImageInput();

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        handleImage(file);
    });

    document.querySelectorAll('[data-tool="image"]').forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openImagePicker();
        });
    });

    window.neuralImage = {
        analyze: analyzeSelectedImage,
        clear: () => {
            window.neuralImageDataUrl = null;
            const preview = document.getElementById("imagePreview");
            if (preview) preview.remove();
            input.value = "";
        }
    };
}

setupImageTool();
