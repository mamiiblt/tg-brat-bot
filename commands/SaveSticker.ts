/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command, Translator} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {getMentionTag, getMessageType, sendError} from "@/utils/BotUtils";
import RDatabase from "@/utils/RDatabase";
import TelegramBot, {Message} from "node-telegram-bot-api";
import sharp from "sharp";
import {isUserWhitelisted} from "@/utils/WhitelistUtils";

const MAX_STICKER_PACK_SIZE = 120

export default {
    name: "bs",
    description: "Save sticker into group / personal pack. (Admin only)",
    async execute(msg, trs, args) {
        if (msg.reply_to_message == undefined) return await sendError(msg, trs.get("cmds.save.baseErrs.replyRequired"), msg.from!!, false)
        if (msg.from?.id == undefined) return await sendError(msg, trs.get("cmds.save.baseErrs.idIsUnknown"), msg.from!!, false)

        await saveSticker(trs, msg.reply_to_message, msg.from)
    }
} satisfies Command;

export async function saveSticker(
    trs: Translator,
    msg: TelegramBot.Message, // it's the sticker message. So we'll take ID from ctx or replied message :)
    actionUser: TelegramBot.User,
) {
    const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    if (!isChatGroup) return await sendError(msg, trs.get("cmds.save.baseErrs.onlyGroup"), actionUser, true)

    const msgType = getMessageType(msg)
    const isAllowedMediaType = msgType == "photo" || msgType == "sticker"
    if (!isAllowedMediaType) return await sendError(msg, trs.get("cmds.save.baseErrs.allowedMedia"), actionUser, true)

    const chatMemberData = await getBot().getChatMember(msg.chat.id, actionUser.id)

    const isUserAllowed = await isUserWhitelisted(msg, actionUser.id)
    if (!isUserAllowed) {
        const allowedRoles = ["creator", "administrator"]
        if (!allowedRoles.includes(chatMemberData.status)) return await sendError(msg, trs.get("cmds.save.baseErrs.invalidPerms"), actionUser, true)
    }

    const packGeneralInfo = await isGroupStickerCreated(msg.chat.id)

    if (!packGeneralInfo.isCreated || packGeneralInfo.packIsFull) {
        if (packGeneralInfo.packIsFull) return await sendError(msg, trs.get("cmds.save.baseErrs.maxSizeReached", { maxSize: MAX_STICKER_PACK_SIZE }), actionUser, true)

        const createData = await createStickerPack(msg, actionUser)
        let message: string

        if (createData.status == "SUCCESS") {
            message = trs.get("cmds.save.SUCCESS_CREATE", {
                chatName: createData.chatName,
                userName: actionUser.first_name != undefined ? actionUser.first_name : actionUser.id.toString(),
                userUrl: `tg://user?id=${createData.author_userId}`,
                packUrl: `https://t.me/addstickers/${createData.packName}`
            })

            await RDatabase.query(`
                        INSERT INTO brat_bot.chat_data (chat_id, gp_name, gp_owner_id) 
                        VALUES ($1, $2, $3)
                        ON CONFLICT (chat_id)
                            DO UPDATE SET gp_name = $4, gp_owner_id = $5
                    `, [msg.chat.id, createData.packName, createData.author_userId, createData.packName, createData.author_userId])
        } else {
            message = `${getMentionTag(actionUser)}, ${trs.get(`cmds.save.errs.${createData.status}`)}`
        }

        await getBot().sendMessage(msg.chat.id,  message!!, {
            parse_mode: "HTML",
            message_thread_id: msg.message_thread_id
        })
    } else {
        const addData = await addStickerIntoPack(msg, packGeneralInfo.packName!!)
        let message: string | undefined = undefined

        if (addData.status == "SUCCESS") {
            message = trs.get("cmds.save.SUCCESS_ADD", {
                adderUserId: `tg://user?id=${actionUser.id}`,
                adderName: actionUser.first_name,
                packUrl: `https://t.me/addstickers/${packGeneralInfo.packName}`
            })
        } else {
            message = `${getMentionTag(actionUser)}, ${trs.get(`cmds.save.errs.${addData.status}`)}`
        }

        await getBot().sendMessage(msg.chat.id, message!!, {
            parse_mode: "HTML",
            message_thread_id: msg.message_thread_id,
            reply_to_message_id: msg.message_id
        })
    }
}


export async function addStickerIntoPack(msg: Message, packName: string): Promise<{
    status: "SUCCESS" | "ANIMATED_STICKERS_NOT_ALLOWED" | "UNKNOWN_ERROR"
}> {
    try {
        if (msg.sticker?.is_animated || msg.sticker?.is_video) return { status: "ANIMATED_STICKERS_NOT_ALLOWED" }
        const replyMedia = getMediaFromSticker(msg)
        if (replyMedia == null) return { status: "UNKNOWN_ERROR" }
        const stickerBuffer = await convertToStickerPngBuffer(replyMedia.fileId)
        await getBot().addStickerToSet(parseInt(process.env.TELEGRAM_BOT_ID!!), packName, stickerBuffer, "🍏", "png_sticker")
        return { status: "SUCCESS" };
    } catch (e) {
        console.error(e)
        return { status: "UNKNOWN_ERROR" }
    }
}

export async function createStickerPack(msg: Message, actionUser: TelegramBot.User): Promise<{
    status: "SUCCESS" | "ANIMATED_STICKERS_NOT_ALLOWED" | "UNKNOWN_ERROR" | "USER_NOT_STARTED_BOT",
    author_userId?: number,
    packName?: string,
    packTitle?: string,
    chatName?: string
}> {
    try {
        const num = Math.floor(Math.random() * 90) + 10
        const packName = `brat_${Date.now()}${num}_by_brat_sticker_bot`;
        const chatTitle = msg.chat.title != undefined ? msg.chat.title : msg.chat.id.toString()
        const packTitle = `${chatTitle} by @brat_sticker_bot`

        if (msg.sticker?.is_animated || msg.sticker?.is_video) return { status: "ANIMATED_STICKERS_NOT_ALLOWED" }

        const replyMedia = getMediaFromSticker(msg)
        if (replyMedia == null) return { status: "UNKNOWN_ERROR" }
        const stickerBuffer = await convertToStickerPngBuffer(replyMedia.fileId)
        await getBot().createNewStickerSet(actionUser.id, packName, packTitle, stickerBuffer, "🍏")

        return {
            status: "SUCCESS",
            packTitle: packTitle,
            packName: packName,
            author_userId: actionUser.id,
            chatName: chatTitle
        }
    } catch (e: any) {
        if (e.response && e.response.body && e.response.body.description.includes("PEER_ID_INVALID")) {
            return { status: "USER_NOT_STARTED_BOT" };
        }

        console.error(e)
        return { status: "UNKNOWN_ERROR" }
    }
}

async function convertToStickerPngBuffer(fileId: string) {
    const file = await getBot().getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    const res = await fetch(fileUrl)
    const fileBuffer = Buffer.from(await res.arrayBuffer())

    return await sharp(fileBuffer)
        .resize(512, 512, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer()
}

function getMediaFromSticker(msg: Message): { fileId: string, type: "photo" | "sticker" } | null {
    if (!msg) return null

    if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1]
        return { fileId: photo.file_id, type: "photo" }
    }

    if (msg.sticker) {
        return { fileId: msg.sticker.file_id, type: "sticker" }
    }

    return null
}

export async function isGroupStickerCreated(chatId: number): Promise<{
    isCreated: boolean,
    packName: string | undefined,
    authorId: number | undefined,
    packIsFull: boolean | undefined,
}> {
    const data = await RDatabase.query(
        `SELECT gp_name, gp_owner_id FROM brat_bot.chat_data WHERE chat_id = $1`,
        [chatId])

    if (data.rows.length == 0) return {
        isCreated: false,
        packName: undefined,
        authorId: undefined,
        packIsFull: undefined
    }

    const packName: string = data.rows[0].gp_name

    try {
        const stickerPack = await getBot().getStickerSet(packName)
        return {
            isCreated: true,
            packName: packName,
            authorId: data.rows[0].gp_owner_id,
            packIsFull: stickerPack.stickers.length == MAX_STICKER_PACK_SIZE
        }
    } catch (e) {
        return {
            isCreated: false,
            packName: undefined,
            authorId: undefined,
            packIsFull: undefined
        }
    }
}