/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {getSupportedLanguagesText} from "@/commands/Language";

export default {
    name: "start",
    description: "Start command of bot.",
    async execute(msg, trs, args) {
       try {
           await getBot().sendPhoto(msg.chat.id, "https://cdn.mamii.dev/utils/telegram/brat_bot_banner.png", {
               parse_mode: "HTML",
               message_thread_id: msg.message_thread_id,
               caption: [
                   `${trs.get("cmds.start.t1" )}\n`,
                   `${trs.get("cmds.start.t2" )}\n`,
                   getSupportedLanguagesText(trs)
               ].join("\n"),
               reply_markup: {
                   inline_keyboard: [
                       [{ text: trs.get("cmds.start.btn"), callback_data: "start_send_help" }],
                       [{ text: trs.get("cmds.start.giveAstar"), url: "https://github.com/mamiiblt/tg-brat-bot" },],
                       [{ text: trs.get("cmds.start.supportGroup"), url: "https://t.me/brat_support_group" },]
                   ]
               }
           })
       } catch (e) {
           console.error(e);
       }
    }

} satisfies Command;