// ==========================================================
// Neural-iA
// chat.js
// Controle básico da interface do chat
// ==========================================================

const messages = document.getElementById("chat-messages");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");

function addMessage(text, type = "ai") {
    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.textContent = text;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    // Placeholder temporário.
    // No próximo passo será conectado ao ai-server_chat.
    setTimeout(() => {
        addMessage("Pensando...", "ai");
    }, 400);
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});
