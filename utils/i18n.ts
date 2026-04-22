import i18next from "i18next";
import fsBackend from "i18next-fs-backend";
import {Message} from "node-telegram-bot-api";
import {getBot} from "@/bot/BratBot";
import RDatabase from "@/utils/RDatabase";

export const languages = [
    { code: "en", flag: "🇺🇸", display: "English" },
    { code: "tr", flag: "🇹🇷", display: "Türkçe" },
]

const langCodes = languages.map(lang => lang.code)

export interface UserLanguage {
    code: string;
    source: "def" | "db" | "tg"
}

export const defaultLanguage = {
    code: "en",
    source: "def"
} as UserLanguage

export async function getUserLanguage(msg: Message): Promise<UserLanguage> {
    if (msg.from?.id == undefined) return defaultLanguage

    const chatSavedLocale = await RDatabase.query(
        `SELECT lang_code FROM brat_bot.chat_languages WHERE chat_id = $1`,
        [msg.chat.id]
    )

    const messageSenderLocale = msg.from.language_code
    const isChatLocaleSaved = chatSavedLocale.rows.length == 1

    if (isChatLocaleSaved) return {
        code: chatSavedLocale.rows[0].lang_code,
        source: "db"
    }

    if (messageSenderLocale != undefined) return {
        code: messageSenderLocale.split("-")[0],
        source: "tg"
    }

    return defaultLanguage
}

export async function setupI18n() {
    i18next
        .use(fsBackend)
        .init({
            fallbackLng: 'en',
            preload: langCodes,
            backend: {
                loadPath: `${process.cwd()}/locales/{{lng}}.json`
            }
        }).then(() => console.log(`✅ i18n started successfully, ${languages.length} languages loaded.`)
    );
}

export function getTranslator(userLng: UserLanguage) {
    return {
        userLng,
        get: (key: string, options?: Record<string, any>) => {
            return i18next.t(key, { lng: userLng.code, ...options });
        }
    };
}