/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import { isNumeric } from "@/utils/BotUtils";
import { getBot } from "@/bot/BratBot";
import { Translator } from "@/types/Command";
import TelegramBot, { Message } from "node-telegram-bot-api";
import RDatabase from "@/utils/RDatabase";
import { writeLog } from "@/utils/Logger";

type CheckResult =
    | {
        status: "SUCCESS";
        actionUser: TelegramBot.User;
        userId: number;
        user?: TelegramBot.User;
        failReason?: never;
    }
    | {
        status: "FAILURE";
        failReason: string;
        actionUser?: never;
        userId?: never;
        user?: never;
    };

export async function isUserWhitelisted(msg: Message, user: TelegramBot.User, trs: Translator) {
    try {
        const isWhEnabled = await isWhitelistEnabled(msg, trs)
        if (isWhEnabled.status == "FAILURE") return false
        if (isWhEnabled.isEnabled == false) return false

        const resp = await RDatabase.query(`
            SELECT $1 = ANY(gp_allowed_users) AS user_auth_state
            FROM brat_bot.chat_data
            WHERE chat_id = $2
        `, [user.id, msg.chat.id])

        const authState = resp.rows[0].user_auth_state
        if (authState == undefined) return false
        return authState === true;
    } catch (e) {
        await writeLog({
            type: "ERROR",
            from: "USER",
            user,
            err: e
        })
        return false;
    }
}

export async function isWhitelistEnabled(msg: Message, trs: Translator): Promise<{
    status: "SUCCESS" | "FAILURE"
    reason?: string
    isEnabled?: boolean
}> {
    try {
        if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") return { status: "FAILURE", reason: trs.get("cmds.wh.errs.onlyGroup") }

        const resp = await RDatabase.query(`
            SELECT is_wh_enabled
            FROM brat_bot.chat_data
            WHERE chat_id = $1
        `, [msg.chat.id])

        if (resp.rows.length == 0) return { status: "SUCCESS", isEnabled: false }

        const isEnabled = resp.rows[0].is_wh_enabled
        return { status: "SUCCESS", isEnabled }
    } catch (e) {
        return { status: "FAILURE", reason: "An error occurred while checking whitelist state." }
    }
}

export async function checkAndParseAR(msg: Message, trs: Translator, allowUserIfNotExists: boolean): Promise<CheckResult> {
    if (msg.from == undefined) return { status: "FAILURE", failReason: "MSG sender is unknown" }

    const ACTION_USER = msg.from

    const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    if (!isChatGroup) return { status: "FAILURE", failReason: trs.get("cmds.wh.errs.onlyGroup") }

    const chatMemberData = await getBot().getChatMember(msg.chat.id, ACTION_USER.id)
    const allowedRoles = ["creator", "administrator"]
    if (!allowedRoles.includes(chatMemberData.status)) return { status: "FAILURE", failReason: trs.get("cmds.save.baseErrs.invalidPerms") }

    let userRawId: string | undefined

    if (msg.reply_to_message != undefined && msg.reply_to_message.text != undefined) {
        userRawId = msg.reply_to_message.from == undefined ? undefined : msg.reply_to_message.from.id.toString()
    } else {
        const parts = msg.text?.split(" ");
        userRawId = parts?.[1];
    }

    const idValidity = isNumeric(userRawId)
    if (!idValidity) return { status: "FAILURE", failReason: trs.get("cmds.wh.errs.thisIsNotNumeric", { value: userRawId }) }
    const validUserId = parseInt(userRawId!!)
    const memberData = await isAllowedGroupMember(msg, trs, validUserId, allowUserIfNotExists)
    if (!memberData.pass) return { status: "FAILURE", failReason: memberData.reason!! }

    return {
        status: "SUCCESS",
        actionUser: ACTION_USER,
        userId: validUserId,
        user: memberData.user
    }
}

export async function isAllowedGroupMember(msg: Message, trs: Translator, userId: number, allowUserIfNotExists: boolean): Promise<{
    pass: boolean,
    reason?: string,
    user?: TelegramBot.User
}> {
    try {
        const memberInfo = await getBot().getChatMember(msg.chat.id, userId)
        if (allowUserIfNotExists) {
            return { pass: true, user: memberInfo.user }
        }

        const unallowedRoles = ["left", "kicked"]
        if (unallowedRoles.includes(memberInfo.status)) {
            return { pass: false, reason: trs.get("cmds.wh.errs.isLeftOrKicked", { role: memberInfo.status }) }
        } else {
            return { pass: true, user: memberInfo.user }
        }
    } catch (e) {
        if (allowUserIfNotExists) {
            return { pass: true, user: undefined }
        } else {
            return { pass: false, reason: trs.get("cmds.wh.errs.unknown") }
        }
    }
}
