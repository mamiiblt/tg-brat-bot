/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

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

type ChatType = "public" | "private";

export function getChatType(chatT: TelegramBot.ChatType): ChatType {
    let chatType: ChatType = "private";
    const publicTypes = ["group", "supergroup", "channel"]
    if (publicTypes.includes(chatT)) chatType = "public"
    if (chatT === "private") chatType = "private"
    return chatType
}

export async function getChatLanguage(chatType: "public" | "private", user?: TelegramBot.User, chatId?: number): Promise<UserLanguage> {
    const chatSavedLocale = await RDatabase.query(
        `SELECT lang_code FROM brat_bot.chat_data WHERE chat_id = $1`,
        [chatId]
    )
    const isChatLocaleSaved = chatSavedLocale.rows.length == 1
    if (isChatLocaleSaved) return {
        code: chatSavedLocale.rows[0].lang_code,
        source: "db"
    }

    if (chatType === "private") {
        const messageSenderLocale = user!!.language_code

        if (messageSenderLocale != undefined) return {
            code: messageSenderLocale.split("-")[0],
            source: "tg"
        }
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