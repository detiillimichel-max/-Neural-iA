// ==========================================================
// Neural-iA
// neural-api.js
// Camada central de comunicação com as Edge Functions
// ==========================================================
//
// Frontend
//    ↓
// neural-api.js
//    ↓
// Supabase Edge Function
//    ↓
// ai-server_chat
//    ↓
// OpenRouter
//    ↓
// Modelo de IA
// ==========================================================

import { supabase } from "./supabase-config.js";

const AI_FUNCTION = "ai-server_chat";
const DEFAULT_TYPE = "chat";
const VALID_TYPES = ["chat", "code", "reasoning", "vision"];

function normalizeType(type) {
    const normalized = String(type || DEFAULT_TYPE).toLowerCase().trim();
    return VALID_TYPES.includes(normalized) ? normalized : DEFAULT_TYPE;
}

function normalizeInput(input, maybeOptions = {}) {
    if (typeof input === "string") {
        return {
            prompt: input,
            type: normalizeType(maybeOptions.type),
            imageBase64: maybeOptions.imageBase64 || null
        };
    }

    if (input && typeof input === "object") {
        return {
            prompt: input.prompt || "",
            type: normalizeType(input.type),
            imageBase64: input.imageBase64 || null
        };
    }

    return {
        prompt: "",
        type: DEFAULT_TYPE,
        imageBase64: null
    };
}

function isValidPrompt(prompt) {
    return typeof prompt === "string" && prompt.trim().length > 0;
}

function extractAnswer(data) {
    return (
        data?.choices?.[0]?.message?.content ||
        data?.answer ||
        data?.response ||
        ""
    );
}

export async function askNeural(input, options = {}) {
    try {
        const { prompt, type, imageBase64 } = normalizeInput(input, options);

        if (!isValidPrompt(prompt)) {
            return {
                success: false,
                error: "Digite uma mensagem antes de enviar.",
                answer: ""
            };
        }

        if (type === "vision" && !imageBase64) {
            return {
                success: false,
                error: "O modo Visão precisa de uma imagem.",
                answer: ""
            };
        }

        const body = {
            prompt: prompt.trim(),
            type
        };

        if (type === "vision" && imageBase64) {
            body.imageBase64 = imageBase64;
        }

        console.log("Neural-iA → Edge Function:", {
            function: AI_FUNCTION,
            type,
            hasImage: Boolean(imageBase64)
        });

        const { data, error } = await supabase.functions.invoke(AI_FUNCTION, {
            body
        });

        if (error) {
            return {
                success: false,
                error: error.message || "Erro ao comunicar com o Neural-iA.",
                answer: ""
            };
        }

        if (!data) {
            return {
                success: false,
                error: "A IA não retornou uma resposta.",
                answer: ""
            };
        }

        if (data.error) {
            return {
                success: false,
                error: typeof data.error === "string" ? data.error : "Erro retornado pelo serviço de IA.",
                answer: ""
            };
        }

        const answer = extractAnswer(data);

        if (!answer) {
            return {
                success: false,
                error: "A IA respondeu, mas não foi possível interpretar a resposta.",
                answer: "",
                raw: data
            };
        }

        return {
            success: true,
            answer,
            type,
            raw: data
        };
    } catch (error) {
        console.error("Neural-iA → Erro inesperado:", error);

        return {
            success: false,
            error: error?.message || "Erro inesperado ao comunicar com o Neural-iA.",
            answer: ""
        };
    }
}

export async function askChat(prompt) {
    return askNeural({ prompt, type: "chat" });
}

export async function askCode(prompt) {
    return askNeural({ prompt, type: "code" });
}

export async function askReasoning(prompt) {
    return askNeural({ prompt, type: "reasoning" });
}

export async function askVision(prompt, imageBase64) {
    return askNeural({ prompt, type: "vision", imageBase64 });
}

export const NEURAL_MODES = {
    chat: {
        id: "chat",
        name: "Conversar",
        description: "Conversação e texto"
    },
    code: {
        id: "code",
        name: "Código",
        description: "Programação e desenvolvimento"
    },
    reasoning: {
        id: "reasoning",
        name: "Raciocínio",
        description: "Problemas complexos e lógica"
    },
    vision: {
        id: "vision",
        name: "Visão",
        description: "Imagens e OCR"
    }
};
