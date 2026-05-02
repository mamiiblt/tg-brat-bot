/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {chunkMessage, isNumeric, sendError} from "@/utils/BotUtils";
import TelegramBot, {ChatMemberStatus, Message} from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";

export default {
    name: "wh_list",
    description: "Lists whitelisted users in group",
    async execute(msg, trs, args) {
        if (msg.from == undefined) return
        if (msg.text == undefined) return

        const ACTION_USER = msg.from

        const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        if (!isChatGroup) return await sendError(msg, trs.get("cmds.wh.errs.onlyGroup"), ACTION_USER, false)

        const chatMemberData = await getBot().getChatMember(msg.chat.id, ACTION_USER.id)
        const allowedRoles = ["creator", "administrator"]
        if (!allowedRoles.includes(chatMemberData.status)) return await sendError(msg, trs.get("cmds.save.baseErrs.invalidPerms"), ACTION_USER, false)

        const listMsg = await getBot().sendMessage(msg.chat.id, trs.get("cmds.wh.loading"), {
            parse_mode: "HTML",
            message_thread_id: msg.message_thread_id,
            reply_to_message_id: msg.message_id,
        })

        const whUsers = await getWhitelistedUsers(msg, trs)
        if (whUsers.status == "FAILURE") return await sendError(msg, trs.get("cmds.wh.errs.anErrorOccurred"), ACTION_USER, false)

        const listArray: string[] = []

        for (let i = 0; i < whUsers.data!!.length; i++) {
            const order = i + 1
            const userId = whUsers.data!![i]
            const member = await getGroupUser(msg, trs, userId)
            if (member.status == "FAILURE") {
                listArray.push(`<b>${order}.</b> <b>Unknown User</b> (${userId})`)
                continue
            }

            listArray.push(`<b>${order}.</b> <a href="tg://user?id=${userId}">${member.user?.first_name}</a> (${userId})` )
        }

        const messages = [
            trs.get("cmds.wh.listingHeader", { userSize: listArray.length }) + "\n",
        ]
        const mergedArray = messages.concat(listArray)

        const chunkedMessages = chunkMessage(mergedArray.join("\n"))

        for (const message of chunkedMessages) {
            const index = chunkedMessages.indexOf(message);
            if (index == 0) {
                await getBot().editMessageText(message, {
                    message_id: listMsg.message_id,
                    chat_id: listMsg.chat.id,
                    parse_mode: "HTML",
                })
            } else {
                await getBot().sendMessage(msg.chat.id, message, {
                    parse_mode: "HTML",
                    message_thread_id: msg.message_thread_id,
                })
            }
        }
    }

} satisfies Command;

export async function getGroupUser(msg: Message, trs: Translator, userId: number): Promise<{
    status: "SUCCESS" | "FAILURE"
    role?: TelegramBot.ChatMemberStatus
    user?: TelegramBot.User
}> {
    try {
        const chatMember = await getBot().getChatMember(msg.chat.id, userId)
        return { status: "SUCCESS", user: chatMember.user, role: chatMember.status }
    } catch (e) {
        return { status: "FAILURE" }
    }
}

export async function getWhitelistedUsers(msg: Message, trs: Translator): Promise<{
    status: "SUCCESS" | "FAILURE"
    reason?: string,
    data?: number[]
}> {
    try {
        const data = await RDatabase.query(`
            SELECT gp_allowed_users FROM brat_bot.chat_data
            WHERE chat_id = $1
        `, [msg.chat.id])

        if (data.rows.length == 0) return {
            status: "SUCCESS",
            data: []
        }

        return { status: "SUCCESS", data: data.rows[0].gp_allowed_users };
    } catch (e) {
        console.error(e)
        return { status: "FAILURE" };
    }
}
