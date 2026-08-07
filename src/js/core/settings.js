// ==========================================================
// Neural-iA
// Core Settings
// Gerenciamento central das configurações do usuário
// ==========================================================

import { UI, MODELS } from "./constants.js";

const STORAGE_KEY = "neuralia-settings";

const DEFAULT_SETTINGS = {

    theme: UI.DEFAULT_THEME,

    language: "pt-BR",

    notifications: UI.ENABLE_NOTIFICATIONS,

    sound: UI.ENABLE_SOUND,

    vibration: true,

    offlineMode: true,

    autoCache: true,

    aiModel: MODELS.CHAT,

    codeModel: MODELS.CODER,

    reasoningModel: MODELS.REASONING,

    visionModel: MODELS.VISION,

    imageModel: MODELS.IMAGE,

    videoModel: MODELS.VIDEO

};

// Carrega configurações
export function loadSettings() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {

            return { ...DEFAULT_SETTINGS };

        }

        return {

            ...DEFAULT_SETTINGS,

            ...JSON.parse(saved)

        };

    } catch (error) {

        console.error("Erro ao carregar configurações.", error);

        return { ...DEFAULT_SETTINGS };

    }

}

// Salva configurações
export function saveSettings(settings) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
        );

        return true;

    } catch (error) {

        console.error("Erro ao salvar configurações.", error);

        return false;

    }

}

// Atualiza apenas um campo
export function updateSetting(key, value) {

    const settings = loadSettings();

    settings[key] = value;

    saveSettings(settings);

    return settings;

}

// Restaura configurações padrão
export function resetSettings() {

    saveSettings(DEFAULT_SETTINGS);

    return DEFAULT_SETTINGS;

}
