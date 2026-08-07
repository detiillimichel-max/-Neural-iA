// ==========================================================
// Neural-iA
// neural-api.js
// Camada de comunicação com as Edge Functions
// ==========================================================

// Será configurado quando o Supabase for integrado.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

/**
 * Envia uma mensagem para a Edge Function ai-server_chat
 */
async function askNeural(prompt) {

    console.log("Pergunta:", prompt);

    // Temporário.
    // No próximo passo entra fetch() para o Supabase.
    return {
        success: true,
        answer: "Neural-iA conectado. Em breve responderá pela Edge Function."
    };

}
