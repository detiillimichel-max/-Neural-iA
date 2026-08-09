// ==========================================================
// Neural-iA
// chat.js
// Controlador da interface do chat
// ==========================================================

import { askNeural, NEURAL_MODES } from "./neural-api.js";
import "./image-tool.js";

const messages = document.getElementById("chat-messages");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const composer = document.querySelector(".composer");

const modelSelector = document.getElementById("modelSelector");
const modelPanel = document.getElementById("modelPanel");
const modelOptions = document.querySelectorAll("[data-model]");
const selectedModelLabel = document.getElementById("selectedModel");

const toolsButton = document.getElementById("toolsButton");
const toolsPanel = document.getElementById("toolsPanel");
const microphoneButton = document.getElementById("microphoneButton");
const newChatButton = document.getElementById("newChat");
const backButton = document.getElementById("backButton");

let selectedMode = NEURAL_MODES.chat.id;
let isBusy = false;

function syncComposerSpace() {
    if (!messages || !composer) return;

    const composerHeight = composer.getBoundingClientRect().height;
    const safeSpace = Math.ceil(composerHeight + 32);

    messages.style.paddingBottom = `${safeSpace}px`;
}

function scrollToLatest() {
    if (!messages) return;

    requestAnimationFrame(() => {
        messages.scrollTop = messages.scrollHeight;
    });
}

function addMessage(text, type = "ai", imageDataUrl = null) {
    if (!messages) return null;

    const div = document.createElement("div");
    div.className = `message ${type}`;

    if (imageDataUrl) {
        const image = document.createElement("img");
        image.className = "message-image";
        image.src = imageDataUrl;
        image.alt = "Imagem enviada para análise";
        image.loading = "lazy";

        // Limite visual explícito para não depender apenas do CSS externo.
        image.style.display = "block";
        image.style.width = "min(100%, 360px)";
        image.style.maxWidth = "360px";
        image.style.height = "auto";
        image.style.maxHeight = "360px";
        image.style.objectFit = "contain";
        image.style.borderRadius = "16px";

        div.appendChild(image);
    }

    if (text) {
        const textNode = document.createElement("div");
        textNode.className = "message-text";
        textNode.textContent = text;
        div.appendChild(textNode);
    }

    messages.appendChild(div);
    scrollToLatest();

    return div;
}

function setBusy(value) {
    isBusy = value;

    if (sendButton) {
        sendButton.disabled = value;
        sendButton.setAttribute("aria-busy", String(value));
    }

    if (input) input.disabled = value;
}

function closePanels() {
    if (modelPanel) modelPanel.hidden = true;
    if (toolsPanel) toolsPanel.hidden = true;

    if (modelSelector) modelSelector.setAttribute("aria-expanded", "false");
    if (toolsButton) toolsButton.setAttribute("aria-expanded", "false");
}

function togglePanel(panel, trigger) {
    if (!panel) return;

    const willOpen = panel.hidden;
    closePanels();
    panel.hidden = !willOpen;

    if (trigger) trigger.setAttribute("aria-expanded", String(willOpen));
}

function getMode(mode) {
    return Object.values(NEURAL_MODES).find((item) => item.id === mode) || NEURAL_MODES.chat;
}

function selectMode(mode) {
    const selected = getMode(String(mode || "chat").toLowerCase());
    selectedMode = selected.id;

    if (selectedModelLabel) {
        selectedModelLabel.textContent =
            selected.id === "chat" ? "Qwen" :
            selected.id === "code" ? "Qwen Coder" :
            selected.id === "reasoning" ? "QwQ" :
            "Qwen Vision";
    }

    modelOptions.forEach((option) => {
        const active = option.dataset.model === selected.id;
        option.classList.toggle("is-selected", active);
        option.setAttribute("aria-selected", String(active));
    });

    closePanels();
}

async function sendMessage() {
    if (isBusy || !input) return;

    const imageDataUrl = window.neuralImageDataUrl || null;
    const typedText = input.value.trim();
    const text = typedText || (
        imageDataUrl
            ? "Analise esta imagem e descreva o que você encontra nela."
            : ""
    );

    if (!text) return;

    addMessage(
        typedText || "Analisei a imagem selecionada.",
        "user",
        imageDataUrl
    );

    input.value = "";
    input.style.height = "auto";

    const thinking = addMessage("Pensando...", "ai");
    setBusy(true);

    try {
        const result = imageDataUrl
            ? await askNeural({
                prompt: text,
                type: "vision",
                imageBase64: imageDataUrl
            })
            : await askNeural({
                prompt: text,
                type: selectedMode
            });

        if (thinking) thinking.remove();

        if (!result?.success) {
            addMessage(
                result?.error || "Não foi possível obter uma resposta agora.",
                "ai error"
            );
            return;
        }

        addMessage(
            result.answer || "O Neural-iA recebeu a solicitação, mas não retornou texto.",
            "ai"
        );

        if (imageDataUrl && window.neuralImage?.clear) {
            window.neuralImage.clear();
        }
    } catch (error) {
        console.error("Neural-iA chat error:", error);

        if (thinking) thinking.remove();

        addMessage(
            error?.message || "Não foi possível comunicar com o Neural-iA.",
            "ai error"
        );
    } finally {
        setBusy(false);
        syncComposerSpace();
        scrollToLatest();
        input.focus();
    }
}

function startNewChat() {
    if (!messages) return;

    messages.innerHTML = `
        <section class="welcome" aria-label="Boas-vindas">
            <div class="neural-mark" aria-hidden="true">
                <i data-lucide="sparkles"></i>
            </div>
            <h2>Neural-iA</h2>
            <p>O que você quer fazer hoje?</p>
        </section>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (window.neuralImage?.clear) window.neuralImage.clear();

    if (input) {
        input.value = "";
        input.style.height = "auto";
        input.placeholder = "Pergunte qualquer coisa...";
        input.focus();
    }

    closePanels();
    syncComposerSpace();
    scrollToLatest();
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = "../../index.html";
}

function setupMicrophone() {
    if (!microphoneButton) return;

    microphoneButton.addEventListener("click", async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            addMessage("O microfone não está disponível neste navegador.", "ai error");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            addMessage(
                "Microfone autorizado. O reconhecimento de voz será conectado na próxima etapa.",
                "ai"
            );
        } catch (error) {
            console.warn("Microphone permission:", error);
        }
    });
}

function setupToolButtons() {
    document.querySelectorAll("[data-close-tools]").forEach((button) => {
        button.addEventListener("click", closePanels);
    });

    document.querySelectorAll("[data-tool]:not([data-tool=\"image\"])").forEach((button) => {
        button.addEventListener("click", () => {
            const tool = button.dataset.tool;
            closePanels();
            addMessage(
                `Ferramenta selecionada: ${tool}. A integração será conectada na próxima etapa.`,
                "ai"
            );
        });
    });
}

if (sendButton) sendButton.addEventListener("click", sendMessage);

if (input) {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
        syncComposerSpace();
    });
}

if (modelSelector) {
    modelSelector.addEventListener("click", () => togglePanel(modelPanel, modelSelector));
}

modelOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectMode(option.dataset.model);
    });
});

if (toolsButton) {
    toolsButton.addEventListener("click", () => togglePanel(toolsPanel, toolsButton));
}

if (newChatButton) newChatButton.addEventListener("click", startNewChat);
if (backButton) backButton.addEventListener("click", goBack);

document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.closest("[data-close-panel]") || target.closest("[data-close-tools]")) {
        closePanels();
        return;
    }

    if (
        modelPanel &&
        !modelPanel.hidden &&
        !modelPanel.contains(target) &&
        !modelSelector?.contains(target)
    ) {
        modelPanel.hidden = true;
        modelSelector?.setAttribute("aria-expanded", "false");
    }

    if (
        toolsPanel &&
        !toolsPanel.hidden &&
        !toolsPanel.contains(target) &&
        !toolsButton?.contains(target)
    ) {
        toolsPanel.hidden = true;
        toolsButton?.setAttribute("aria-expanded", "false");
    }
});

window.addEventListener("resize", syncComposerSpace);
window.addEventListener("orientationchange", syncComposerSpace);

if (typeof ResizeObserver !== "undefined" && composer) {
    const composerObserver = new ResizeObserver(syncComposerSpace);
    composerObserver.observe(composer);
}

setupMicrophone();
setupToolButtons();
selectMode("chat");
syncComposerSpace();
