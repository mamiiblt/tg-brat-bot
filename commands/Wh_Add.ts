/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {sendError} from "@/utils/BotUtils";
import {Message} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import {checkAndParseAR} from "@/utils/WhitelistUtils";

export default {
    name: "wh_add",
    description: "Add a user into group whitelist via ID.",
    async execute(msg, trs, args) {

        const { status, failReason, actionUser, userId, user } = await checkAndParseAR(msg, trs)
        if (status == "FAILURE") return await sendError(msg, failReason, msg.from!!, false)

        const addResponse = await addUserToWhitelist(msg, trs, userId)
        if (addResponse.status == "ERROR") return await sendError(msg, addResponse.reason!!, actionUser, false)

        await getBot().sendMessage(msg.chat.id, trs.get("cmds.wh.successAdd", {
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

export async function addUserToWhitelist(msg: Message, trs: Translator, userId: number): Promise<{
    status: "SUCCESS" | "ERROR",
    reason?: string
}> {
    try {
        const checkReq = await RDatabase.query(`
            SELECT 1 FROM brat_bot.chat_data
            WHERE chat_id = $1
            AND $2 = ANY(gp_allowed_users)
        `, [msg.chat.id, userId])

        if (checkReq.rows.length > 0) {
            return {
                status: "ERROR",
                reason: trs.get("cmds.wh.errs.alreadyAdded")
            }
        }

        await RDatabase.query(`
                INSERT INTO brat_bot.chat_data (chat_id, gp_allowed_users)
                VALUES ($1, ARRAY[$2]::bigint[])
                ON CONFLICT (chat_id)
                DO UPDATE SET gp_allowed_users =
                    chat_data.gp_allowed_users || ARRAY[$2]::bigint[];
            `,
            [msg.chat.id, userId]
        )

        return { status: "SUCCESS" }
    } catch (e) {
        return { status: "ERROR", reason: "Unknown error occurred." }
    }
}