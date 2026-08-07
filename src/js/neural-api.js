// ==========================================================
// Neural-iA
// neural-api.js
// Camada de comunicação com as Edge Functions
// ==========================================================

import { supabase } from "./supabase-config.js";

/**
 * Envia uma mensagem para a Edge Function ai-server_chat
 */
export async function askNeural(prompt) {

    try {

        const { data, error } = await supabase.functions.invoke(
            "ai-server_chat",
            {
                body: {
                    prompt
                }
            }
        );

        if (error) throw error;

        return data;

    } catch (err) {

        console.error(err);

        return {
            success: false,
            answer: "Erro ao comunicar com o Neural-iA."
        };

    }

}
