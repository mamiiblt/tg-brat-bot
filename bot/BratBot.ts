import {Command} from "@/types/Command";
import {loadCommands} from "@/bot/CommandHandler";
import TelegramBot, {CallbackQuery, Message} from "node-telegram-bot-api";
import {getMainCommand, sendMessage} from "@/bot/Utils";
import {categoryNames, sendHelpMessage} from "@/commands/Help";

export const commands: Command[] = [];
let bot: TelegramBot | null = null;

export function startBot(): TelegramBot {
    if (bot) return bot;

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        throw new Error("TELEGRAM_BOT_TOKEN isn't set.");
    }

    bot = new TelegramBot(telegramBotToken, {
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

    console.log("✅ brat Bot is initialized successfully.");

    return bot;
}

export function getBot(): TelegramBot {
    if (!bot) {
        throw new Error("Telegram bot is not started already.");
    }
    return bot;
}

export async function setupBot() {
    startBot()
    await loadCommands()
    console.log(`✅ brat Bot started successfully, ${commands.length} command loaded.`);

    getBot().on("message", async (msg: Message) => {
        const text = msg.text?.trim();
        if (!text) return;

        const messageArgs = text.split(" ")[0].split("\n")
        if (messageArgs[0].startsWith("/")) {
            for (const command of commands) {
                const commandName = messageArgs[0].replace("/", "")

                if (command.name === getMainCommand(commandName.trim())) {
                    try {
                        await command.execute(msg, messageArgs);
                    } catch (err) {
                        console.error(`❌ Error in ${command.name}:`, err);
                        await sendMessage({
                            chatId: msg.chat.id,
                            msg: msg,
                            text: "⚠️ <b>An error occurred while running command.</b>",
                            replyToMessage: true,
                            msg_parse_mode: "HTML"
                        })
                    }
                }
            }
        }
    })

    getBot().on("callback_query", async (ctx: CallbackQuery) => {
        try {
            if (ctx.data == "start_send_help") {
                if (ctx.message != undefined) {
                    await sendHelpMessage(ctx.message.chat.id, 0)
                }
            }

            if (ctx.data?.startsWith("help_scat_")) {
                if (ctx.message != undefined) {
                    const categoryId = parseInt(ctx.data?.replace("help_scat_", ""))
                    if (!ctx.message.text?.includes(categoryNames[categoryId])) {
                        await sendHelpMessage(ctx.message.chat.id, categoryId, ctx.message.message_id);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

    })
}