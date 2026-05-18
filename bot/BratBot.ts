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
import {enableLogSaving, escapeHtml, writeLog} from "@/utils/Logger";
import RDatabase from "@/utils/RDatabase";

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
        if (!text || msg.from == undefined) return;
        const translator = getTranslator(await getChatLanguage(getChatType(msg.chat.type), msg.from, msg.chat.id))
        await checkUserIsUsedBot(msg.from, msg)

        if (text.trim() == "@brat_sticker_bot") await sendHelpMessage(translator, msg.chat.id, 0, msg.message_thread_id)

        const messageArgs = text.split(" ")[0].split("\n")

        const command = commands.find(
            c => c.name === getMainCommand(messageArgs[0].replace("/", "").trim())
        );

        if (command) {
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
        } else {
            if (msg.chat.type == "private" && msg.text != undefined) {
                await writeLog({
                    from: "USER",
                    type: "INFO",
                    user: msg.from,
                    message: [
                        "User is sent a recognized message in PM chat.",
                        escapeHtml(msg.text)
                    ].join("\n"),
                    externalFields: [
                        { key: "message_id", value: msg.message_id.toString() },
                    ]
                })
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

async function checkUserIsUsedBot(user: TelegramBot.User, msg: Message) {
    const result = await RDatabase.query(`
        INSERT INTO brat_bot.users_list (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING 
        RETURNING user_id
    `, [user.id])

    if (result.rows.length > 0) {
        const results = await RDatabase.query(`SELECT COUNT(*) FROM brat_bot.users_list`)

        await writeLog({
            from: "USER",
            type: "INFO",
            user: user,
            message: [
                `A new user is started to use bot (${user.username != undefined ? `@${user.username} ` : ""}[${user.id}])`,
                `Now totally ${results.rows[0].count} user is used that bot :)`
            ].join("\n"),
            externalFields: [
                { key: "chat_id", value: msg.chat.id.toString() },
                { key: "message_id", value: msg.message_id.toString() },
            ]
        })
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