/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import { Command, Translator } from "@/types/Command";
import { getBot } from "@/bot/BratBot";
import { sendError } from "@/utils/BotUtils";
import TelegramBot, { Message } from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import { checkAndParseAR } from "@/utils/WhitelistUtils";

export default {
    name: "wh_st",
    description: "Enable / disable whitelist for the group.",
    async execute(msg, trs, args) {
        if (msg.from == undefined) return
        if (msg.text == undefined) return

        const ACTION_USER = msg.from
        const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        if (!isChatGroup) return await sendError(msg, trs.get("cmds.wh.errs.onlyGroup"), ACTION_USER, false)

        const chatMemberData = await getBot().getChatMember(msg.chat.id, ACTION_USER.id)
        const allowedRoles = ["creator", "administrator"]
        if (!allowedRoles.includes(chatMemberData.status)) return await sendError(msg, trs.get("cmds.save.baseErrs.invalidPerms"), ACTION_USER, false)

        const argsLower = msg.text.split(" ").map(arg => arg.toLowerCase())
        const argFirst = argsLower?.[1]
        let isEnabledOrDisabled = false
        if (argFirst == "enable" || argFirst == "disable") {
            isEnabledOrDisabled = argFirst == "enable" ? true : false
        } else return await sendError(msg, trs.get("cmds.wh.en_ds.unknownState", { state: argFirst }), ACTION_USER, false)

        const waitMsg = await getBot().sendMessage(msg.chat.id, trs.get("wait"), {
            parse_mode: "HTML",
            message_thread_id: msg.message_thread_id,
            reply_to_message_id: msg.message_id,
        })

        try {
            const isEnabledResp = await getWhitelistState(msg)
            if (isEnabledResp.status == "FAILURE") throw new Error(isEnabledResp.reason)

            if (isEnabledOrDisabled == true && isEnabledResp.isEnabled == true) return await updateMessage(trs.get("cmds.wh.en_ds.alreadyEnabled"), waitMsg)
            if (isEnabledOrDisabled == false && isEnabledResp.isEnabled == false) return await updateMessage(trs.get("cmds.wh.en_ds.alreadyDisabled"), waitMsg)

            if (isEnabledOrDisabled == true) {
                await RDatabase.query(`
                    UPDATE brat_bot.chat_data
                    SET is_wh_enabled = true
                    WHERE chat_id = $1
                `, [msg.chat.id])
                return await updateMessage(trs.get("cmds.wh.en_ds.listEnabled", {
                    adminName: ACTION_USER.first_name,
                    adminUrl: `tg://user?id=${ACTION_USER.id}`
                }), waitMsg)
            } else {
                await RDatabase.query(`
                    UPDATE brat_bot.chat_data
                    SET is_wh_enabled = false
                    WHERE chat_id = $1
                `, [msg.chat.id])
                return await updateMessage(trs.get("cmds.wh.en_ds.listDisabled", {
                    adminName: ACTION_USER.first_name,
                    adminUrl: `tg://user?id=${ACTION_USER.id}`
                }), waitMsg)
            }
        } catch (e) {
            return await updateMessage(trs.get("cmds.wh.en_ds.anErrorOccurred"), waitMsg)
        }
    }

} satisfies Command;

async function updateMessage(newText: string, waitMsg: TelegramBot.Message) {
    await getBot().editMessageText(newText, {
        parse_mode: "HTML",
        chat_id: waitMsg.chat.id,
        message_id: waitMsg.message_id
    })
}

function getWhitelistState(msg: Message): Promise<{
    status: "SUCCESS" | "FAILURE"
    reason?: string
    isEnabled?: boolean
}> {
    return new Promise(async (resolve) => {
        try {
            const res = await RDatabase.query(`
                SELECT is_wh_enabled
                FROM brat_bot.chat_data
                WHERE chat_id = $1
            `, [msg.chat.id])

            if (res.rows.length > 0) {
                const isEnabled = res.rows[0].is_wh_enabled
                resolve({ status: "SUCCESS", isEnabled })
            }
        } catch (e) {
            resolve({ status: "FAILURE", reason: "An error occurred while checking whitelist state." })
        }
    })
}