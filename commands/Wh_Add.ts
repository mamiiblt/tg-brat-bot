/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {isNumeric, sendError} from "@/utils/BotUtils";
import TelegramBot, {Message} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";

export default {
    name: "wh_add",
    description: "Add a user into group whitelist via ID.",
    async execute(msg, trs, args) {
        if (msg.from == undefined) return
        if (msg.text == undefined) return

        const ACTION_USER = msg.from

        const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        if (!isChatGroup) return await sendError(msg, trs.get("cmds.wh.errs.onlyGroup"), ACTION_USER, false)

        const chatMemberData = await getBot().getChatMember(msg.chat.id, ACTION_USER.id)
        const allowedRoles = ["creator", "administrator"]
        if (!allowedRoles.includes(chatMemberData.status)) return await sendError(msg, trs.get("cmds.save.baseErrs.invalidPerms"), ACTION_USER, false)

        let userRawId: string | undefined

        if (msg.reply_to_message != undefined && msg.reply_to_message.text != undefined) {
            userRawId = msg.reply_to_message.from == undefined ? undefined : msg.reply_to_message.from.id.toString()
        } else {
            const parts = msg.text?.split(" ");
            userRawId = parts?.[1];
        }

        const idValidity = isNumeric(userRawId)
        if (!idValidity) return await sendError(msg, trs.get("cmds.wh.errs.thisIsNotNumeric", { value: userRawId }), ACTION_USER, false)
        const addingUserID = parseInt(userRawId!!)

        const memberData = await isAllowedGroupMember(msg, trs, addingUserID)

        if (!memberData.pass) return await sendError(msg, memberData.reason!!, ACTION_USER, false)

        const dbData = await addUserToWhitelist(msg, trs, addingUserID)
        if (dbData.status == "ERROR") return await sendError(msg, dbData.reason!!, ACTION_USER, false)

        await getBot().sendMessage(msg.chat.id, trs.get("cmds.wh.success", {
            userUrl: `tg://user?id=${memberData.user?.id}`,
            userName: memberData.user?.first_name,
            adminUrl: `tg://user?id=${ACTION_USER.id}`,
            adminName: ACTION_USER.first_name,
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
                reason: trs.get("cmds.wh.errs.dbQuery.alreadyAdded")
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

export async function isAllowedGroupMember(msg: Message, trs: Translator, userId: number): Promise<{
    pass: boolean,
    reason?: string,
    user?: TelegramBot.User
}> {
    try {
        const memberInfo = await getBot().getChatMember(msg.chat.id, userId)
        const unallowedRoles = ["left", "kicked"]
        const adminRoles = ["creator", "administrator"]

        if (unallowedRoles.includes(memberInfo.status)) {
            return { pass: false, reason: trs.get("cmds.wh.errs.userCheck.isLeftOrKicked", { role: memberInfo.status }) }
        } else if (adminRoles.includes(memberInfo.status)) {
            return { pass: false, reason: trs.get("cmds.wh.errs.userCheck.userIsAdmin", { role: memberInfo.status }) }
        } else {
            return { pass: true, user: memberInfo.user }
        }
    } catch (e) {
        return { pass: false, reason: trs.get("cmds.wh.errs.userCheck.unknown") }
    }
}
