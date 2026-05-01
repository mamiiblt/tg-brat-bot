import i18next from "i18next";
import fsBackend from "i18next-fs-backend";
import TelegramBot, {Message} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import languages from "@/utils/languages";

const langCodes = languages.map(lang => lang.code)

export interface UserLanguage {
    code: string;
    source: "def" | "db" | "tg"
}

export const defaultLanguage = {
    code: "en",
    source: "def"
} as UserLanguage

export async function getUserLanguage(user: TelegramBot.User | undefined): Promise<UserLanguage> {
    if (user == undefined) return defaultLanguage

    const chatSavedLocale = await RDatabase.query(
        `SELECT lang_code FROM brat_bot.chat_data WHERE chat_id = $1`,
        [user.id]
    )

    const messageSenderLocale = user.language_code
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