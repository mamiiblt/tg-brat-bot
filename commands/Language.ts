import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {CallbackQuery, InlineKeyboardButton} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import languages from "@/utils/languages";

const langButtons: InlineKeyboardButton[][] = [];
languages.forEach((language, index) => {
    const button = {
        text: `${language.flag} ${language.display}`,
        callback_data: `sl_${language.code}`
    };

    if (index % 2 === 0) {
        langButtons.push([button]);
    } else {
        langButtons[langButtons.length - 1].push(button);
    }
});

export function getSupportedLanguagesText(trs: Translator) {
    const languageDisplays: string[] = []
    languages.forEach((language) => languageDisplays.push(`${language.display}`));
    return trs.get("general.supportedLngs", { langs: languageDisplays.join(", ") })
}

export default {
    name: "langb",
    description: `Set bot language for you.`,
    async execute(msg, trs, args) {

        let message = ""
        switch (trs.userLng.source) {
            case "db":
                message = "The current chat language comes from the database because you manually set it using this command."
                break
            case "tg":
                message = "Because the bot's language is not set at all, it automatically uses the Telegram language of the person who uses the command."
                break
            case "def":
                message = "Unfortunately, the bot could not automatically detect your language, so please select your language below."
                break
        }

        await getBot().sendMessage(msg.chat.id, [
            "<b>Please select one of the languages below.</b>\n",
            `<blockquote>${message}</blockquote>`,
            "<blockquote>If you’d like to contribute a translation, feel free to submit a pull request to the <a href='https://github.com/mamiiblt/tg-brat-bot'>source code</a>!</blockquote>"
        ].join("\n"), {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: langButtons
            }
        })
    }
} satisfies Command;

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
        });

        await getBot().answerCallbackQuery(ctx.id);

    } catch (e) {
        console.error("changeUserLanguage Hatası:", e);
    }
}

export async function updateLanguageInDb(chatId: number, langCode: string) {
    await RDatabase.query(`
        INSERT INTO brat_bot.chat_languages (chat_id, lang_code)
        VALUES ($1, $2)
        ON CONFLICT (chat_id)
            DO UPDATE SET lang_code = $3
    `, [chatId, langCode, langCode]);
}