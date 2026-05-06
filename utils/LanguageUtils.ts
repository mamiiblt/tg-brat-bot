/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import {Translator} from "@/types/Command";
import languages from "@/utils/languages";
import {CallbackQuery} from "node-telegram-bot-api";
import {getBot} from "@/bot/BratBot";
import RDatabase from "@/utils/RDatabase";

export function getSupportedLanguagesText(trs: Translator) {
    const languageDisplays: string[] = []
    languages.forEach((language) => languageDisplays.push(`${language.display}`));
    return trs.get("general.supportedLngs", { langs: languageDisplays.join(", ") })
}

export async function changeUserLanguage(ctx: CallbackQuery) {
    try {
        const chatId = ctx.message?.chat.id;
        if (!ctx.data || !chatId) return;

        const langCode = ctx.data.replace("sl_", "");

        const languageData = languages.find(lang => lang.code === langCode);
        if (!languageData) return;

        await updateLanguageInDb(chatId, languageData.code);

        const chatType = ctx.message?.chat.type;
        const setMessage = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> set the bot language for this chat (${chatType}) to <b>${languageData.flag} ${languageData.display}</b>`;

        await getBot().sendMessage(chatId, setMessage, {
            parse_mode: "HTML",
            message_thread_id: ctx.message?.message_thread_id
        });

        await getBot().answerCallbackQuery(ctx.id);
    } catch (e) {
        console.error("changeUserLanguage Hatası:", e);
    }
}

export async function updateLanguageInDb(chatId: number, langCode: string) {
    await RDatabase.query(`
        INSERT INTO brat_bot.chat_data (chat_id, lang_code)
        VALUES ($1, $2)
        ON CONFLICT (chat_id)
            DO UPDATE SET lang_code = $3
    `, [chatId, langCode, langCode]);
}