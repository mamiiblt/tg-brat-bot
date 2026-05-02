/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {sendError} from "@/utils/BotUtils";
import TelegramBot, {Message} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import {checkAndParseAR} from "@/utils/WhitelistUtils";

export default {
    name: "wh_rm",
    description: "Remove a added user from whitelist.",
    async execute(msg, trs, args) {

        const { status, failReason, actionUser, userId, user } = await checkAndParseAR(msg, trs)
        if (status == "FAILURE") return await sendError(msg, failReason, msg.from!!, false)

        const removeResponse = await removeUserFromWh(msg, trs, userId)
        if (removeResponse.status == "FAILURE") return await sendError(msg, removeResponse.reason!!, actionUser, false)

        await getBot().sendMessage(msg.chat.id, trs.get("cmds.wh.successDelete", {
            userUrl: `tg://user?id=${user.id}`,
            userName: user.first_name,
            adminUrl: `tg://user?id=${actionUser.id}`,
            adminName: actionUser.first_name,
        }), {
            parse_mode: "HTML",
            message_thread_id: msg.message_thread_id,
            reply_to_message_id: msg.message_id
        })
    }

} satisfies Command;

export async function removeUserFromWh(msg: Message, trs: Translator, userId: number): Promise<{
    status: "SUCCESS" | "FAILURE"
    reason?: string
    user?: TelegramBot.User
}> {
    try {
        const res = await RDatabase.query(`
            UPDATE brat_bot.chat_data
            SET gp_allowed_users = array_remove(gp_allowed_users, $2)
            WHERE chat_id = $1
              AND $2 = ANY(gp_allowed_users)
            RETURNING chat_id, gp_allowed_users;
        `, [msg.chat.id, userId])

        if (res.rows.length > 0) {
            return { status: "SUCCESS" }
        } else {
            return { status: "FAILURE", reason: trs.get("cmds.wh.errs.notAdded") }
        }
    } catch (e) {
        return { status: "FAILURE" }
    }
}

/*
    02.05.2026 08:30
    ebrar buralardan goctu... elveda...

    - mamii
*/