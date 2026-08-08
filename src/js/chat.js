// ==========================================================
// Neural-iA
// chat.js
// Controlador da interface do chat
// ==========================================================

import { askNeural } from "./neural-api.js";

const messages = document.getElementById("chat-messages");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");

const modelButton = document.getElementById("model-button");
const modelPanel = document.getElementById("model-panel");
const modelOptions = document.querySelectorAll("[data-model]");
const modelLabel = document.getElementById("model-label");

const toolsButton = document.getElementById("tools-button");
const toolsPanel = document.getElementById("tools-panel");

const newChatButton = document.getElementById("new-chat-button");
const backButton = document.getElementById("back-button");
const micButton = document.getElementById("mic-button");

let selectedModel = "CHAT";
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

    if (input) {
        input.disabled = value;
    }
}

function closePanels() {
    if (modelPanel) modelPanel.hidden = true;
    if (toolsPanel) toolsPanel.hidden = true;
}

function togglePanel(panel) {
    if (!panel) return;

    const willOpen = panel.hidden;
    closePanels();
    panel.hidden = !willOpen;
}

function selectModel(model, label) {
    selectedModel = model;

    if (modelLabel && label) {
        modelLabel.textContent = label;
    }

    modelOptions.forEach((option) => {
        const active = option.dataset.model === model;
        option.classList.toggle("active", active);
        option.setAttribute("aria-selected", String(active));
    });

    if (modelPanel) modelPanel.hidden = true;
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
        const result = await askNeural(text, {
            model: selectedModel
        });

        if (thinking) thinking.remove();

        const answer = extractAnswer(result);
        addMessage(answer, "ai");
    } catch (error) {
        console.error("Neural-iA chat error:", error);

        if (thinking) thinking.remove();

        addMessage(
            "Não foi possível obter uma resposta agora. Verifique a conexão com o Neural-iA.",
            "ai error"
        );
    } finally {
        setBusy(false);
        input.focus();
    }
}

function extractAnswer(result) {
    if (!result) {
        return "O Neural-iA não retornou uma resposta.";
    }

    if (typeof result === "string") {
        return result;
    }

    if (result.answer) return result.answer;
    if (result.response) return result.response;
    if (result.message) return result.message;

    if (result.data) {
        if (typeof result.data === "string") return result.data;
        if (result.data.answer) return result.data.answer;
        if (result.data.response) return result.data.response;
    }

    return "Recebi uma resposta, mas não consegui interpretar o formato retornado pela Edge Function.";
}

function startNewChat() {
    if (!messages) return;

    messages.innerHTML = `
        <div class="welcome">
            <h2>Olá 👋</h2>
            <p>Como posso ajudar você hoje?</p>
        </div>
    `;

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
    if (!micButton) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        micButton.disabled = true;
        micButton.title = "Microfone não disponível neste navegador";
        return;
    }

    micButton.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());

            addMessage("Microfone autorizado. O reconhecimento de voz será conectado na próxima etapa.", "ai");
        } catch (error) {
            console.warn("Microphone permission:", error);
        }
    });
}

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

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

if (modelButton) {
    modelButton.addEventListener("click", () => togglePanel(modelPanel));
}

modelOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectModel(option.dataset.model, option.dataset.label || option.textContent.trim());
    });
});

if (toolsButton) {
    toolsButton.addEventListener("click", () => togglePanel(toolsPanel));
}

if (newChatButton) {
    newChatButton.addEventListener("click", startNewChat);
}

if (backButton) {
    backButton.addEventListener("click", goBack);
}

document.addEventListener("click", (event) => {
    const target = event.target;

    if (
        modelPanel &&
        !modelPanel.hidden &&
        modelButton &&
        !modelPanel.contains(target) &&
        !modelButton.contains(target)
    ) {
        modelPanel.hidden = true;
    }

    if (
        toolsPanel &&
        !toolsPanel.hidden &&
        toolsButton &&
        !toolsPanel.contains(target) &&
        !toolsButton.contains(target)
    ) {
        toolsPanel.hidden = true;
    }
});

setupMicrophone();

if (modelOptions.length > 0) {
    const defaultOption = Array.from(modelOptions).find(
        (option) => option.dataset.model === selectedModel
    ) || modelOptions[0];

    selectModel(
        defaultOption.dataset.model,
        defaultOption.dataset.label || defaultOption.textContent.trim()
    );
}
