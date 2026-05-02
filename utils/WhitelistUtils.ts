/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {isNumeric} from "@/utils/BotUtils";
import {getBot} from "@/bot/BratBot";
import {Translator} from "@/types/Command";
import TelegramBot, {Message} from "node-telegram-bot-api";

type CheckResult =
    | {
    status: "SUCCESS";
    actionUser: TelegramBot.User;
    userId: number;
    user: TelegramBot.User;
    failReason?: never;
}
    | {
    status: "FAILURE";
    failReason: string;
    actionUser?: never;
    userId?: never;
    user?: never;
};

export async function checkAndParseAR(msg: Message, trs: Translator): Promise<CheckResult> {
    if (msg.from == undefined) return { status: "FAILURE", failReason: "MSG sender is unknown" }

    const ACTION_USER = msg.from

    const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    if (!isChatGroup) return { status: "FAILURE", failReason: trs.get("cmds.wh.errs.onlyGroup") }

    const chatMemberData = await getBot().getChatMember(msg.chat.id, ACTION_USER.id)
    const allowedRoles = ["creator", "administrator"]
    if (!allowedRoles.includes(chatMemberData.status)) return { status: "FAILURE", failReason: trs.get("cmds.save.baseErrs.invalidPerms")}

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
    const memberData = await isAllowedGroupMember(msg, trs, validUserId)
    if (!memberData.pass) return { status: "FAILURE", failReason: memberData.reason!! }

    return {
        status: "SUCCESS",
        actionUser: ACTION_USER,
        userId: validUserId,
        user: memberData.user!!
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

        if (unallowedRoles.includes(memberInfo.status)) {
            return { pass: false, reason: trs.get("cmds.wh.errs.isLeftOrKicked", { role: memberInfo.status }) }
        } else {
            return { pass: true, user: memberInfo.user }
        }
    } catch (e) {
        return { pass: false, reason: trs.get("cmds.wh.errs.unknown") }
    }
}
