import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";

export default {
    name: "start",
    description: "Start command of bot.",
    async execute(msg, args) {
        getBot().sendMessage(msg.chat.id, [
            "Welcome to the <b>brat Sticker Bot</b>\n",
            "<b>Click the button below</b> or use the <b>/help</b> command for information on how to use the bot."
        ].join("\n"), {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Click for help!", callback_data: "start_send_help"}
                    ]
                ]
            }
        })
    }

} satisfies Command;