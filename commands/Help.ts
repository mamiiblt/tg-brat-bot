/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {InlineKeyboardButton, InlineKeyboardMarkup} from "node-telegram-bot-api";
import languages from "@/utils/languages";


export default {
    name: "helpb",
    description: "Shows help command of bot",
    async execute(msg, trs, args) {
        await sendHelpMessage(trs, msg.chat.id, 0, msg.message_thread_id)
    }

} satisfies Command;

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

export function getCategoryNames(trs: Translator) {
    return [
        trs.get("cmds.help.categories.default"),
        trs.get("cmds.help.categories.usage"),
        trs.get("cmds.help.categories.language"),
        trs.get("cmds.help.categories.about")
    ]
}

export async function sendHelpMessage(trs: Translator, chatId: number, categoryId: number, threadId: number | undefined, messageId?: number) {
    let categoryNames = getCategoryNames(trs)
    let categoryContents: string[] = []
    let disable_webpage_preview = false

    const buttons: InlineKeyboardMarkup = {
        inline_keyboard: []
    }

    if (categoryId === 0) {
        for (let i = 1; i < categoryNames.length; i++) {
            buttons.inline_keyboard.push([{
                text: categoryNames[i],
                callback_data: `help_scat_${i}`
            }])
        }
    }

    switch (categoryId) {
        case 0:
            categoryContents = [
                `${trs.get("cmds.help.sectionLng.pleaseSelect")}\n`,
                `${trs.get("cmds.help.sectionLng.pleaseSelect2")}`,
            ]
            break;
        case 2:
            const languagePage = pageContents.language(trs)
            langButtons.forEach((button) => {buttons.inline_keyboard.push(button)})
            disable_webpage_preview = true
            categoryContents = languagePage.message
            break;
        case 3:
            const aboutPage = pageContents.aboutBot(trs)
            aboutPage.buttons.forEach((button) => {buttons.inline_keyboard.push(button)})
            disable_webpage_preview = true
            categoryContents = aboutPage.message
            break;
    }

    const usageCategoryIds = [1, 4, 5]
    if (usageCategoryIds.includes(categoryId)) {
        const botUsagePage = pageContents.botUsage(trs, categoryId, usageCategoryIds)
        categoryContents = botUsagePage.message
        buttons.inline_keyboard.push(botUsagePage.pageButtons)
    }

    if (categoryId != 0) {
        buttons.inline_keyboard.push([{ text: trs.get("cmds.help.backToMenu"), callback_data: `help_scat_0`, style: "danger" }])
    }

    if (messageId == undefined) {
        await getBot().sendMessage(chatId, [
            categoryContents.join("\n"),
        ].join("\n"), {
            parse_mode: "HTML",
            reply_markup: buttons,
            disable_web_page_preview: disable_webpage_preview,
            message_thread_id: threadId
        })
    } else {
        await getBot().editMessageText(categoryContents.join("\n"), {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            disable_web_page_preview: disable_webpage_preview,
            reply_markup: buttons,
        })
    }
}

const pageContents = {
    aboutBot: (trs: Translator): {
        message: string[],
        buttons: InlineKeyboardButton[][]
    } => {
        return {
            message: [
                `${trs.get("cmds.help.about.text1")}\n`,
                trs.get("cmds.help.about.text2")
            ],
            buttons: [
                [{ text: trs.get("cmds.help.about.devWebsite"), url: "https://mamii.dev", style: "primary" }],
                [{ text: trs.get("cmds.help.about.sourceCode"), url: "https://github.com/mamiiblt/tg-brat-bot", style: "primary" }],
                [{ text: trs.get("cmds.start.supportGroup"), url: "https://t.me/brat_support_group", style: "primary" }],
            ]
        }
    },
    botUsage: (trs: Translator, pageNum: number, pageNumbers: number[]): {
        message: string[],
        pageButtons: InlineKeyboardButton[]
    } => {
        let message: string[] = []
        let pageButtons: InlineKeyboardButton[] = []

        switch (pageNum) {
            case 1:
                const keys = ["rbe", "png", "scr", "color", "fs"]
                const lines: string[] = []
                keys.forEach((key) => lines.push(`• ${trs.get(`cmds.help.sectionLng.commands.${key}`)}`))
                lines.push(`\n${trs.get("cmds.help.sectionLng.cmdExample")}`)
                const commandUsages = ["/b raw wh fs-60", "/b rbe raw bl", "/b wh scr <i>(etc..)</i>"]
                commandUsages.forEach((key) => lines.push(key))

                message = [
                    `${trs.get("cmds.help.sectionLng.general")}\n`,
                    `${trs.get("cmds.help.sectionLng.firstMsg")}\n`,
                    lines.join("\n"),
                ]
                break;
            case 4:
                message = [
                    `${trs.get("cmds.help.sectionLng.saveUsageTitle")}\n`,
                    `${trs.get("cmds.help.sectionLng.saveUsage")}\n`,
                    `${trs.get("cmds.help.sectionLng.saveUsage2")}`,
                ]
                break;
            case 5:
                const keysWh = ["list", "add", "remove"]
                const linesWh: string[] = []
                keysWh.forEach((key) => linesWh.push(`• ${trs.get(`cmds.help.sectionLng.wh_usages.${key}`)}`))

                message = [
                    `${trs.get("cmds.help.sectionLng.whitelistTitle")}\n`,
                    `${trs.get("cmds.help.sectionLng.whitelist")}\n`,
                    linesWh.join("\n")
                ]
                break;
        }

        for (let i = 0; i < pageNumbers.length; i++) {
            pageButtons.push({
                text: `${i + 1}`,
                callback_data: `help_scat_${pageNumbers[i]}`,
                style: pageNum == pageNumbers[i] ? "success" : undefined,
            });
        }

        return { message, pageButtons }
    },
    language: (trs: Translator): {
        message: string[]
    } => {
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

        return {
            message: [
                "<b>Please select one of the languages below.</b>\n",
                message,
                "<blockquote>If you’d like to contribute a translation, feel free to submit a pull request to the <a href='https://github.com/mamiiblt/tg-brat-bot'>source code</a>!</blockquote>"
            ]
        }
    }
}
