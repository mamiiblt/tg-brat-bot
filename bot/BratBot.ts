/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import {Command} from "@/types/Command";
import TelegramBot, {CallbackQuery, Message} from "node-telegram-bot-api";
import {getMainCommand, sendMessage} from "@/utils/BotUtils";
import {sendHelpMessage} from "@/commands/Help";
import {getChatLanguage, getChatType, getTranslator} from "@/utils/i18n";
import {changeUserLanguage} from "@/utils/LanguageUtils";
import {saveSticker} from "@/commands/SaveSticker";
import {EventStatus} from "@/utils/GeneralUtils";
import {enableLogSaving, writeLog} from "@/utils/Logger";

export const commands: Command[] = [];
let bot: TelegramBot | null = null;

export async function initBot(): Promise<EventStatus> {
    return new Promise<EventStatus>(resolve => {
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        if (telegramBotToken == undefined) {
            resolve({ status: false, log: "TELEGRAM_BOT_TOKEN isn't set in environment."})
        }

        bot = new TelegramBot(telegramBotToken!!, {
            polling: {
                params: {
                    allowed_updates: [
                        "message",
                        "edited_message",
                        "update_id",
                        "inline_query",
                        "chosen_inline_result",
                        "chat_member",
                        "callback_query"
                    ],
                },
            },
        });


        enableLogSaving().then(() => {
            resolve({ status: true, log: "brat Bot initialized successfully."})
        })
    })
}

export function getBot(): TelegramBot {
    if (!bot) {
        throw new Error("Telegram bot is not started already.");
    }
    return bot;
}

const handlers = {
    onMessage:  async (msg: Message) => {
        const text = msg.text?.trim();
        if (!text) return;

        if (text.trim() == "@brat_sticker_bot") {
            const translator = getTranslator(await getChatLanguage(getChatType(msg.chat.type), msg.from, msg.chat.id))
            await sendHelpMessage(translator, msg.chat.id, 0, msg.message_thread_id)
        }

        const messageArgs = text.split(" ")[0].split("\n")
        if (messageArgs[0].startsWith("/")) {
            for (const command of commands) {
                const commandName = messageArgs[0].replace("/", "")

                if (command.name === getMainCommand(commandName.trim())) {
                    const translator = getTranslator(await getChatLanguage(getChatType(msg.chat.type), msg.from, msg.chat.id))
                    try {
                        await command.execute(msg, translator, messageArgs);
                    } catch (err) {
                        await writeLog({
                            type: "ERROR",
                            from: "USER",
                            user: msg.from,
                            err: err
                        })
                        await sendMessage({
                            chatId: msg.chat.id,
                            msg: msg,
                            text: translator.get("general.error"),
                            replyToMessage: true,
                            msg_parse_mode: "HTML"
                        })
                    }
                }
            }
        }
    },
    onCallback: async (ctx: CallbackQuery) => {
        try {
            const trs = getTranslator(await getChatLanguage(getChatType(ctx.message?.chat.type!!), ctx.from, ctx.message?.chat.id))

            if (ctx.data == "start_send_help") {
                if (ctx.message != undefined) {
                    await sendHelpMessage(trs, ctx.message.chat.id, 0, ctx.message.message_thread_id)
                    await getBot().answerCallbackQuery(ctx.id)
                }
            }

            if (ctx.data?.startsWith("help_scat_")) {
                if (ctx.message != undefined) {
                    const categoryId = parseInt(ctx.data?.replace("help_scat_", ""))
                    try {
                        await sendHelpMessage(trs, ctx.message.chat.id, categoryId, undefined, ctx.message.message_id);
                    } catch (e) {
                        // do nothing, bcoz maybe user clicked to same category again.
                    }
                }
            }

            if (ctx.data?.startsWith("sl_")) {
                await changeUserLanguage(ctx)
            }

            // BU SATIRLAR TUGBİSE GELSİN
            if (ctx.data == "save_sticker") {
                await saveSticker(trs, ctx.message!!, ctx.from)
            }

            if (ctx.data == "saved_already") {
                await getBot().answerCallbackQuery(ctx.id, {
                    text: trs.get("cmds.brat.savedMessage"),
                    show_alert: true
                })
            }
        } catch (e) {
            await writeLog({
                type: "ERROR",
                from: "USER",
                user: ctx.from,
                err: e
            })
        }
    }
}

export function setupBot(): EventStatus {
    const bot = getBot();

    bot.on("message", handlers.onMessage);
    bot.on("callback_query", handlers.onCallback);

    return {
        status: true,
        log: "brat Bot setup successfully.",
    };
}