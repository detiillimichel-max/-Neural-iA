// ==========================================================
// Neural-iA
// neural-api.js
// Camada central de comunicação com as Edge Functions
// ==========================================================
//
// Responsabilidade:
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
//
// IMPORTANTE:
// - A OPENROUTER_API_KEY NÃO fica neste arquivo.
// - A chave permanece nos Secrets do Supabase.
// - Este arquivo usa apenas o cliente Supabase.
// - A Edge Function atual exige JWT.
// ==========================================================

import { supabase } from "./supabase-config.js";

// ==========================================================
// Configuração
// ==========================================================

const AI_FUNCTION = "ai-server_chat";

const DEFAULT_TYPE = "chat";

const VALID_TYPES = [
    "chat",
    "code",
    "reasoning",
    "vision"
];

// ==========================================================
// Normalização do tipo de IA
// ==========================================================

function normalizeType(type) {

    if (!type) {
        return DEFAULT_TYPE;
    }

    const normalized = String(type).toLowerCase().trim();

    if (VALID_TYPES.includes(normalized)) {
        return normalized;
    }

    return DEFAULT_TYPE;
}

// ==========================================================
// Validação da mensagem
// ==========================================================

function validatePrompt(prompt) {

    if (typeof prompt !== "string") {
        return false;
    }

    return prompt.trim().length > 0;
}

// ==========================================================
// Comunicação principal com Neural-iA
// ==========================================================
//
// Pode ser usado assim:
//
// askNeural("Olá")
//
// ou:
//
// askNeural({
//     prompt: "Crie um código",
//     type: "code"
// })
//
// ou:
//
// askNeural({
//     prompt: "O que existe nesta imagem?",
//     type: "vision",
//     imageBase64: "..."
// })
// ==========================================================

export async function askNeural(input) {

    try {

        // --------------------------------------------------
        // Compatibilidade com a versão antiga
        // --------------------------------------------------

        let prompt = "";
        let type = DEFAULT_TYPE;
        let imageBase64 = null;

        if (typeof input === "string") {

            prompt = input;

        } else if (input && typeof input === "object") {

            prompt = input.prompt || "";
            type = normalizeType(input.type);
            imageBase64 = input.imageBase64 || null;

        }

        // --------------------------------------------------
        // Validação
        // --------------------------------------------------

        if (!validatePrompt(prompt)) {

            return {
                success: false,
                error: "Digite uma mensagem antes de enviar.",
                answer: ""
            };

        }

        // --------------------------------------------------
        // Visão
        // --------------------------------------------------

        if (type === "vision" && !imageBase64) {

            return {
                success: false,
                error: "O modo Visão precisa de uma imagem.",
                answer: ""
            };

        }

        // --------------------------------------------------
        // Monta o payload exatamente como a Edge espera
        // --------------------------------------------------

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

        // --------------------------------------------------
        // Chamada autenticada ao Supabase
        // --------------------------------------------------

        const { data, error } = await supabase.functions.invoke(
            AI_FUNCTION,
            {
                body
            }
        );

        // --------------------------------------------------
        // Erro retornado pelo Supabase
        // --------------------------------------------------

        if (error) {

            console.error(
                "Neural-iA → Erro da Edge Function:",
                error
            );

            return {
                success: false,
                error: error.message || "Erro ao comunicar com o Neural-iA.",
                answer: ""
            };
        }

        // --------------------------------------------------
        // Segurança contra resposta vazia
        // --------------------------------------------------

        if (!data) {

            console.error(
                "Neural-iA → Edge Function retornou resposta vazia."
            );

            return {
                success: false,
                error: "A IA não retornou uma resposta.",
                answer: ""
            };
        }

        // --------------------------------------------------
        // Erro retornado dentro do JSON
        // --------------------------------------------------

        if (data.error) {

            console.error(
                "Neural-iA → Erro retornado pela IA:",
                data.error
            );

            return {
                success: false,
                error:
                    typeof data.error === "string"
                        ? data.error
                        : "Erro retornado pelo serviço de IA.",
                answer: ""
            };
        }

        // --------------------------------------------------
        // Extrai a resposta no formato atual da OpenRouter
        // --------------------------------------------------

        const answer =
            data?.choices?.[0]?.message?.content ||
            data?.answer ||
            data?.response ||
            "";

        // --------------------------------------------------
        // Resposta válida
        // --------------------------------------------------

        if (!answer) {

            console.warn(
                "Neural-iA → Resposta recebida, mas nenhum texto foi encontrado.",
                data
            );

            return {
                success: false,
                error: "A IA respondeu, mas não foi possível interpretar a resposta.",
                answer: "",
                raw: data
            };
        }

        // --------------------------------------------------
        // Retorno padronizado para o frontend
        // --------------------------------------------------

        return {
            success: true,
            answer,
            type,
            raw: data
        };

    } catch (error) {

        console.error(
            "Neural-iA → Erro inesperado:",
            error
        );

        return {
            success: false,
            error:
                error?.message ||
                "Erro inesperado ao comunicar com o Neural-iA.",
            answer: ""
        };
    }
}

// ==========================================================
// Atalhos dos quatro modos
// ==========================================================

export async function askChat(prompt) {

    return askNeural({
        prompt,
        type: "chat"
    });

}

export async function askCode(prompt) {

    return askNeural({
        prompt,
        type: "code"
    });

}

export async function askReasoning(prompt) {

    return askNeural({
        prompt,
        type: "reasoning"
    });

}

export async function askVision(prompt, imageBase64) {

    return askNeural({
        prompt,
        type: "vision",
        imageBase64
    });

}

// ==========================================================
// Informações dos modos disponíveis
// ==========================================================

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
