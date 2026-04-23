import TelegramBot, {InlineKeyboardMarkup, Message, ParseMode} from "node-telegram-bot-api";
import {getBot} from "@/bot/BratBot";

export function getMainCommand(message: string) {
    if (message.includes(`@${process.env.TELEGRAM_BOT_USERNAME}`)) {
        return message.replace(`@${process.env.TELEGRAM_BOT_USERNAME}`, "")
    } else {
        return message
    }
}

export function getMessageType(msg: Message): "text" | "photo" | "video" | "document" | "sticker" | "voice" | "audio" | "gif" | "unknown" {
    if (msg.text) return "text"
    if (msg.photo) return "photo"
    if (msg.video) return "video"
    if (msg.document) return "document"
    if (msg.sticker) return "sticker"
    if (msg.voice) return "voice"
    if (msg.audio) return "audio"
    if (msg.animation) return "gif"
    return "unknown"
}

export async function sendMessage(msgOptions: {
    chatId: number;
    msg: Message;
    text: string;
    replyToMessage?: boolean;
    msg_parse_mode?: ParseMode;
    reply_markup?: TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup | TelegramBot.ReplyKeyboardRemove | TelegramBot.ForceReply | undefined
}): Promise<number> {
    const {
        chatId,
        msg,
        text,
        replyToMessage = false,
        msg_parse_mode = "HTML",
        reply_markup
    } = msgOptions;

    const options: {
        message_thread_id?: number;
        reply_to_message_id?: number;
        reply_markup?: TelegramBot.ReplyKeyboardMarkup | TelegramBot.InlineKeyboardMarkup | TelegramBot.ReplyKeyboardRemove | TelegramBot.ForceReply | undefined;
        parse_mode: ParseMode;
    } = {
        parse_mode: msg_parse_mode,
    };

    if (replyToMessage) {
        options.reply_to_message_id = msg.message_id;
    }

    if (msg.message_thread_id !== undefined) {
        options.message_thread_id = msg.message_thread_id;
    }

    if (reply_markup != undefined) {
        options.reply_markup = reply_markup
    }

    const sentMessage = await getBot().sendMessage(chatId, text, options);
    return sentMessage.message_id;
}

export async function editMessage(msgOptions: {
    chatId: number;
    messageId: number;
    text: string;
    msg_reply_markup?: InlineKeyboardMarkup;
}) {
    await getBot().editMessageText(msgOptions.text, {
        chat_id: msgOptions.chatId,
        message_id: msgOptions.messageId,
        parse_mode: "HTML",
        reply_markup: msgOptions.msg_reply_markup,
    });
}