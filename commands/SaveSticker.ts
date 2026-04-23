import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import {getMessageType} from "@/utils/BotUtils";
import RDatabase from "@/utils/RDatabase";
import {Message} from "node-telegram-bot-api";
import sharp from "sharp";

const MAX_STICKER_PACK_SIZE = 120

async function sendError(msg: Message, content: string) {
    await getBot().sendMessage(msg.chat.id, content, {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
    })
}

export default {
    name: "bs",
    description: "Save sticker into group / personal pack. (Admin only)",
    async execute(msg, trs, args) {
        const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        if (!isChatGroup) return await sendError(msg, trs.get("cmds.save.baseErrs.onlyGroup"))
        if (msg.reply_to_message == undefined) return await sendError(msg, trs.get("cmds.save.baseErrs.replyRequired"))

        const msgType = getMessageType(msg.reply_to_message)
        const isRepliedAllowedMedia = msgType == "photo" || msgType == "sticker"
        if (!isRepliedAllowedMedia) return await sendError(msg, trs.get("cmds.save.baseErrs.allowedMedia"))

        if (msg.from?.id == undefined) return await sendError(msg, trs.get("cmds.save.baseErrs.idIsUnknown"))

        const chatMemberData = await getBot().getChatMember(msg.chat.id, msg.from?.id)
        const allowedRoles = ["creator", "administrator"]
        if (!allowedRoles.includes(chatMemberData.status)) return await sendError(msg, trs.get("cmds.save.baseErrs.invalidPerms"))

        const packGeneralInfo = await isGroupStickerCreated(msg.chat.id)

        if (!packGeneralInfo.isCreated || packGeneralInfo.packIsFull) {
            if (packGeneralInfo.packIsFull) return await sendError(msg, trs.get("cmds.save.baseErrs.maxSizeReached", { maxSize: MAX_STICKER_PACK_SIZE }))

            const createData = await createStickerPack(msg, msg.reply_to_message)
            let message: string | undefined = undefined

            if (createData.status == "SUCCESS") {
                message = trs.get("cmds.save.SUCCESS_CREATE", {
                    chatName: createData.chatName,
                    userName: msg.from?.first_name != undefined ? msg.from.first_name : msg.from?.id.toString(),
                    userUrl: `tg://user?id=${createData.author_userId}`,
                    packUrl: `https://t.me/addstickers/${createData.packName}`
                })

                await RDatabase.query(`
                        INSERT INTO brat_bot.chat_sticker_packs (chat_id, gp_name, gp_owner_id) 
                        VALUES ($1, $2, $3)
                        ON CONFLICT (chat_id)
                            DO UPDATE SET gp_name = $4, gp_owner_id = $5
                    `, [msg.chat.id, createData.packName, createData.author_userId, createData.packName, createData.author_userId])
            } else {
                message = trs.get(`cmds.save.errs.${createData.status}`)
            }

            await getBot().sendMessage(msg.chat.id, message!!, {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            })
        } else {
            const addData = await addStickerIntoPack(msg, msg.reply_to_message, packGeneralInfo.packName!!, packGeneralInfo.authorId!!)
            let message: string | undefined = undefined

            if (addData.status == "SUCCESS") {
                message = trs.get("cmds.save.SUCCESS_ADD", {
                    packUrl: `https://t.me/addstickers/${packGeneralInfo.packName}`
                })
            } else {
                message = trs.get(`cmds.save.errs.${addData.status}`)
            }

            await getBot().sendMessage(msg.chat.id, message!!, {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            })
        }

    }
} satisfies Command;


export async function addStickerIntoPack(msg: Message, repliedMessage: Message, packName: string, packAuthorId: number): Promise<{
    status: "SUCCESS" | "ANIMATED_STICKERS_NOT_ALLOWED" | "UNKNOWN_ERROR"
}> {
    try {
        const replyMedia = getMediaFromSticker(repliedMessage)
        if (replyMedia == null) return { status: "UNKNOWN_ERROR" }
        const stickerBuffer = await convertToStickerPngBuffer(replyMedia.fileId)
        await getBot().addStickerToSet(parseInt(process.env.TELEGRAM_BOT_ID!!), packName, stickerBuffer, "🍏", "png_sticker")
        return { status: "SUCCESS" };
    } catch (e) {
        console.error(e)
        return { status: "UNKNOWN_ERROR" }
    }
}

export async function createStickerPack(msg: Message, repliedMessage: Message): Promise<{
    status: "SUCCESS" | "ANIMATED_STICKERS_NOT_ALLOWED" | "UNKNOWN_ERROR" | "USER_NOT_STARTED_BOT",
    author_userId?: number,
    packName?: string,
    packTitle?: string,
    chatName?: string,
}> {
    try {
        const num = Math.floor(Math.random() * 90) + 10
        const packName = `brat_${Date.now()}${num}_by_brat_sticker_bot`;
        const chatTitle = msg.chat.title != undefined ? msg.chat.title : msg.chat.id.toString()
        const packTitle = `${chatTitle} by @brat_sticker_bot`

        if (repliedMessage.sticker?.is_animated || repliedMessage.sticker?.is_video) return { status: "ANIMATED_STICKERS_NOT_ALLOWED" }

        const replyMedia = getMediaFromSticker(repliedMessage)
        if (replyMedia == null) return { status: "UNKNOWN_ERROR" }
        const stickerBuffer = await convertToStickerPngBuffer(replyMedia.fileId)
        await getBot().createNewStickerSet(msg.from?.id!!, packName, packTitle, stickerBuffer, "🍏")

        return {
            status: "SUCCESS",
            packTitle: packTitle,
            packName: packName,
            author_userId: msg.from?.id!!,
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
        `SELECT gp_name, gp_owner_id FROM brat_bot.chat_sticker_packs WHERE chat_id = $1`,
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