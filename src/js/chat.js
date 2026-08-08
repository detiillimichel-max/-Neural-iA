// ==========================================================
// Neural-iA
// chat.js
// Controlador da interface do chat
// ==========================================================

import { askNeural, NEURAL_MODES } from "./neural-api.js";

const messages = document.getElementById("chat-messages");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");

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

function addMessage(text, type = "ai") {
    if (!messages) return null;

    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.textContent = text;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

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

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    input.style.height = "auto";

    const thinking = addMessage("Pensando...", "ai");
    setBusy(true);

    try {
        // A neural-api.js aprovado recebe o objeto completo.
        const result = await askNeural({
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
    } catch (error) {
        console.error("Neural-iA chat error:", error);

        if (thinking) thinking.remove();

        addMessage("Não foi possível comunicar com o Neural-iA.", "ai error");
    } finally {
        setBusy(false);
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

    if (input) {
        input.value = "";
        input.style.height = "auto";
        input.focus();
    }

    closePanels();
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
            addMessage("Microfone autorizado. O reconhecimento de voz será conectado na próxima etapa.", "ai");
        } catch (error) {
            console.warn("Microphone permission:", error);
        }
    });
}

function setupToolButtons() {
    document.querySelectorAll("[data-close-tools]").forEach((button) => {
        button.addEventListener("click", closePanels);
    });

    document.querySelectorAll("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => {
            const tool = button.dataset.tool;
            closePanels();
            addMessage(`Ferramenta selecionada: ${tool}. A integração será conectada na próxima etapa.`, "ai");
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

setupMicrophone();
setupToolButtons();
selectMode("chat");
