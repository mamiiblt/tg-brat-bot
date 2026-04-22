import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {InlineKeyboardMarkup} from "node-telegram-bot-api";

let TRS: Translator

export default {
    name: "helpb",
    description: "Shows help command of bot",
    async execute(msg, trs, args) {
        TRS = trs
        await sendHelpMessage(msg.chat.id, 0)
    }

} satisfies Command;

export function getCategoryNames(trs: Translator) {
    return [
        trs.get("cmds.help.categories.default"),
        trs.get("cmds.help.categories.usage"),
        trs.get("cmds.help.categories.language"),
        trs.get("cmds.help.categories.about")
    ]
}

export async function sendHelpMessage(chatId: number, categoryId: number, messageId?: number) {
    const keys = ["rbe", "png", "scr", "color", "fs"]
    const lines: string[] = []
    keys.forEach((key) => lines.push(`• ${TRS.get(`cmds.help.sectionLng.commands.${key}`)}`))

    const categoryNames = getCategoryNames(TRS)
    const categoryContents = [
        [TRS.get("cmds.help.sectionLng.pleaseSelect")],
        [
            `${TRS.get("cmds.help.sectionLng.firstMsg")}\n`,
            lines.join("\n") + "\n",
            TRS.get("cmds.help.sectionLng.cmdExample"),
            "/br raw wh fs-60",
            "/br rbe raw bl"
        ],
        [
            TRS.get("cmds.help.lang")
        ],
        [
            `${TRS.get("cmds.help.about.text1")}\n`,
            TRS.get("cmds.help.about.text2")
        ]
    ]

    const buttons: InlineKeyboardMarkup = {
        inline_keyboard: []
    }

    for (let i = 1; i < categoryContents.length; i++) {
        buttons.inline_keyboard.push([{
            text: categoryNames[i],
            callback_data: `help_scat_${i}`
        }])
    }

    buttons.inline_keyboard.push([{ text: TRS.get("cmds.start.supportGroup"), url: "https://t.me/brat_support_group" }])

    if (messageId == undefined) {
        await getBot().sendMessage(chatId, [
            categoryContents[categoryId].join("\n"),
        ].join("\n"), {
            parse_mode: "HTML",
            reply_markup: buttons
        })
    } else {
        await getBot().editMessageText(categoryContents[categoryId].join("\n"), {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: buttons
        })
    }
}