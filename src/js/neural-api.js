// ==========================================================
// Neural-iA
// neural-api.js
// Camada central de comunicação com as Edge Functions
// ==========================================================

import {
    SUPABASE_FUNCTIONS_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_HEADERS
} from "./supabase-config.js";

import { EDGE, SUPABASE } from "./core/constants.js";

// ----------------------------------------------------------
// Tipos de operação suportados pela ai-server_chat
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

class NeuralAPIError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = "NeuralAPIError";
        this.status = status;
        this.details = details;
    }
}

// ----------------------------------------------------------
// Utilidades
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
    const payload = {
        prompt: normalizePrompt(prompt),
        type: normalizeMode(type)
    };

    if (payload.type === AI_MODES.VISION && imageBase64) {
        if (typeof imageBase64 !== "string") {
            throw new NeuralAPIError("A imagem precisa estar em Base64 ou Data URL.");
        }

        payload.imageBase64 = imageBase64;
    }

    return payload;
}

function getAnswer(data) {
    if (!data) return "";

    // Resposta OpenRouter direta.
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string") {
        return content;
    }

    // Respostas que já venham normalizadas pela Edge Function.
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
// Chamada única à Edge Function
// ----------------------------------------------------------

async function invokeAI(payload, timeout = SUPABASE.FUNCTION_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(
            `${SUPABASE_FUNCTIONS_URL}/${EDGE.AI}`,
            {
                method: "POST",
                headers: {
                    ...SUPABASE_HEADERS,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            }
        );

        const rawText = await response.text();
        let data = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch {
            data = { raw: rawText };
        }

        if (!response.ok) {
            throw new NeuralAPIError(
                data?.error || data?.message || `Erro HTTP ${response.status}.`,
                response.status,
                data
            );
        }

        return {
            success: true,
            data,
            answer: getAnswer(data)
        };

    } catch (error) {
        if (error?.name === "AbortError") {
            throw new NeuralAPIError(
                "Tempo limite excedido ao comunicar com o Neural-iA.",
                408
            );
        }

        throw error;

    } finally {
        clearTimeout(timer);
    }
}

// ----------------------------------------------------------
// Função principal
// ----------------------------------------------------------

/**
 * Envia uma solicitação para a Edge Function ai-server_chat.
 *
 * Modos:
 * - chat       -> conversação / texto geral
 * - code       -> programação / código
 * - reasoning  -> raciocínio avançado
 * - vision     -> visão / OCR com imagem Base64
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
    const timeout = Number(options.timeout || SUPABASE.FUNCTION_TIMEOUT);
    const retries = Math.max(
        0,
        Number(options.retries ?? SUPABASE.RETRY)
    );

    const payload = buildPayload(prompt, type, imageBase64);

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
// Atalhos explícitos para os quatro modos
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

export { NeuralAPIError };
