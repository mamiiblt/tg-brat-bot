import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {InlineKeyboardMarkup} from "node-telegram-bot-api";

export default {
    name: "brat_help",
    description: "Shows help command of bot",
    async execute(msg, args) {
        await sendHelpMessage(msg.chat.id, 0)
    }

} satisfies Command;

export const categoryNames = [
    "Default",
    "Bot Usage",
    "About Bot"
]

export async function sendHelpMessage(chatId: number, categoryId: number, messageId?: number) {
    const categoryContents = [
        ["Please select a category."],
        [
            "If you reply to a message with the /brat_help command, the bot will turn it into a brat sticker. If you want to customize the sticker, you can include the following parameters with the command:\n",
            "• <b>rbe:</b> Removes the slight blur effect from the image.",
            "• <b>raw:</b> Sends it as a PNG instead of a sticker.",
            "• <b>scr:</b> Adds a scribble effect to the top",
            "• <b>t[color]:</b> Changes the background to green (gr is green, wh is white, bl is blue)",
            "• <b>fs-[number]:</b> Changes the font size. (default: 185)\n",
            "<b>Command Example</b>",
            "/brat raw twh fs-60",
            "/brat rbe raw tbl"

        ],
        [
            `If you'd like to view the source code, you can access it from <a href="https://github.com/mamiiblt/tg-brat-bot">this repository</a> <i>(don’t forget to give a ⭐)</i>\n`,
            `Developed by <a href="https://t.me/mamiiblt"><b>mamiiblt</b></a> for fun`
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

    const msgContent = [
        categoryId !== 0 ? `<b>${categoryNames[categoryId]}</b>\n` : null,
        ...categoryContents[categoryId]
    ].join("\n")

    if (messageId == undefined) {
        await getBot().sendMessage(chatId, [
            msgContent,
        ].join("\n"), {
            parse_mode: "HTML",
            reply_markup: buttons
        })
    } else {
        await getBot().editMessageText(msgContent, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: buttons
        })
    }
}