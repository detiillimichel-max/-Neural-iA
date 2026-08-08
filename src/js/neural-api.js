// ==========================================================
// Neural-iA
// neural-api.js
// Camada central de comunicação com as Edge Functions
// ==========================================================

import { supabase } from "./supabase-config.js";
import { EDGE, SUPABASE } from "./core/constants.js";

// ----------------------------------------------------------
// Modos de IA suportados pela Edge Function ai-server_chat
// ----------------------------------------------------------

export const AI_MODES = Object.freeze({
    CHAT: "chat",
    CODE: "code",
    REASONING: "reasoning",
    VISION: "vision"
});

// ----------------------------------------------------------
// Erro padronizado
// ----------------------------------------------------------

export class NeuralAPIError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = "NeuralAPIError";
        this.status = status;
        this.details = details;
    }
}

// ----------------------------------------------------------
// Validação
// ----------------------------------------------------------

function normalizePrompt(prompt) {
    if (typeof prompt !== "string") {
        throw new NeuralAPIError("O prompt precisa ser um texto.");
    }

    const value = prompt.trim();

    if (!value) {
        throw new NeuralAPIError("O prompt não pode estar vazio.");
    }

    return value;
}

function normalizeMode(type) {
    const mode = String(type || AI_MODES.CHAT).toLowerCase();

    if (!Object.values(AI_MODES).includes(mode)) {
        throw new NeuralAPIError(
            `Modo de IA inválido: ${mode}. Use chat, code, reasoning ou vision.`
        );
    }

    return mode;
}

function buildPayload(prompt, type, imageBase64) {
    const mode = normalizeMode(type);

    const payload = {
        prompt: normalizePrompt(prompt),
        type: mode
    };

    if (mode === AI_MODES.VISION && imageBase64) {
        if (typeof imageBase64 !== "string") {
            throw new NeuralAPIError(
                "A imagem precisa estar em Base64 ou Data URL."
            );
        }

        payload.imageBase64 = imageBase64;
    }

    return payload;
}

// ----------------------------------------------------------
// Normalização da resposta
// ----------------------------------------------------------

function extractAnswer(data) {
    if (!data) return "";

    // Resposta padrão do OpenRouter usada atualmente pela Edge.
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string") {
        return content;
    }

    // Compatibilidade com futuras respostas normalizadas.
    if (typeof data.answer === "string") {
        return data.answer;
    }

    if (typeof data.message === "string") {
        return data.message;
    }

    return "";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------------------------------
// Chamada à Edge Function com timeout
// ----------------------------------------------------------

async function invokeAI(payload, timeout) {

    const request = supabase.functions.invoke(
        EDGE.AI,
        {
            body: payload
        }
    );

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(
                new NeuralAPIError(
                    "Tempo limite excedido ao comunicar com o Neural-iA.",
                    408
                )
            );
        }, timeout);
    });

    const { data, error } = await Promise.race([
        request,
        timeoutPromise
    ]);

    if (error) {
        throw new NeuralAPIError(
            error.message || "Erro ao chamar a Edge Function.",
            error.status || 0,
            error
        );
    }

    return {
        success: true,
        data,
        answer: extractAnswer(data)
    };
}

// ----------------------------------------------------------
// Função principal
// ----------------------------------------------------------

/**
 * Envia uma solicitação para a Edge Function ai-server_chat.
 *
 * Modos disponíveis:
 * - chat       -> Qwen de texto/conversação
 * - code       -> Qwen Coder
 * - reasoning  -> QwQ
 * - vision     -> Qwen Vision / OCR
 *
 * A escolha final do modelo permanece no backend.
 * Isso mantém as chaves e regras do provedor fora do frontend.
 *
 * @param {string} prompt
 * @param {object} options
 * @param {"chat"|"code"|"reasoning"|"vision"} options.type
 * @param {string|null} options.imageBase64
 * @param {number} options.timeout
 * @param {number} options.retries
 */
export async function askNeural(prompt, options = {}) {

    const type = normalizeMode(options.type || AI_MODES.CHAT);
    const imageBase64 = options.imageBase64 || null;
    const timeout = Number(
        options.timeout || SUPABASE.FUNCTION_TIMEOUT
    );
    const retries = Math.max(
        0,
        Number(options.retries ?? SUPABASE.RETRY)
    );

    const payload = buildPayload(
        prompt,
        type,
        imageBase64
    );

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await invokeAI(payload, timeout);
        } catch (error) {
            lastError = error;

            if (attempt < retries) {
                await sleep(400 * (attempt + 1));
            }
        }
    }

    console.error("Neural-iA API error:", lastError);

    return {
        success: false,
        data: lastError?.details || null,
        answer: lastError?.message || "Erro ao comunicar com o Neural-iA.",
        error: lastError?.message || "Erro desconhecido.",
        status: lastError?.status || 0
    };
}

// ----------------------------------------------------------
// Atalhos dos quatro modos
// ----------------------------------------------------------

export function askChat(prompt, options = {}) {
    return askNeural(prompt, {
        ...options,
        type: AI_MODES.CHAT
    });
}

export function askCoder(prompt, options = {}) {
    return askNeural(prompt, {
        ...options,
        type: AI_MODES.CODE
    });
}

export function askReasoning(prompt, options = {}) {
    return askNeural(prompt, {
        ...options,
        type: AI_MODES.REASONING
    });
}

export function askVision(prompt, imageBase64, options = {}) {
    return askNeural(prompt, {
        ...options,
        type: AI_MODES.VISION,
        imageBase64
    });
}
