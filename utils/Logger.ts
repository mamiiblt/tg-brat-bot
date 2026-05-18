/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import TelegramBot from "node-telegram-bot-api";
import {getBot} from "@/bot/BratBot";
import {chunkMessage} from "@/utils/BotUtils";

type logFrom = "SERVER" | "USER"
type logType = "INFO" | "WARN" | "ERROR"

export interface Log {
    from: logFrom
    type: logType
    timestamp: Date
    message?: string
    stack?: string
    user?: TelegramBot.User
}

let LOGS: Log[] = []
let allowLogSending: boolean = false

export async function enableLogSaving() {
    allowLogSending = true
}

export async function writeLog(
    data: {
        from: logFrom,
        type: logType,
        message?: string,
        err?: unknown,
        user?: TelegramBot.User,
        writeOnlyConsole?: boolean
    }
) {
    let errorStack = undefined
    if (data.err instanceof Error) errorStack = data.err.stack
    const log = {
        from: data.from,
        type: data.type,
        message: data.message,
        timestamp: new Date(),
        stack: errorStack,
        user: data.user ?? undefined,
    };

    LOGS.push(log);
    console.log(formatLog_Console(log))

    const writeState = data.writeOnlyConsole == undefined ? false : data.writeOnlyConsole
    if (!writeState && allowLogSending) await sendLogMessageToChannel(log)
}

async function sendLogMessageToChannel(log: Log) {
    const chunked = chunkMessage(formatLog_Tg(log));

    for (let chunk of chunked) {
        await getBot().sendMessage(parseInt(process.env.TELEGRAM_LOG_CHANNEL_ID!!), chunk, {
            parse_mode: "HTML"
        })
    }
}

function formatLog_Console(log: Log): string {
    const trFormatted = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(log.timestamp);

    const source =
        log.from === "USER"
            ? `UID: ${log.user?.id ?? "unknown"}`
            : "SYSTEM";

    let message = `[${trFormatted}] [${log.type}] [${source}] ${log.message != undefined ? `- ${log.message}` : "An error occurred, no message provided to log."}`;

    if (log.stack) {
        message += `\nERROR_STACK: ${log.stack}`;
    }

    return message;
}

export async function sendAllExecLogs() {
    const logLines: string[] = []
    const lastLog = LOGS[LOGS.length - 1]
    for (let log of LOGS) {
        logLines.push(log.message!!)
    }
    await sendLogMessageToChannel({
        ...lastLog,
        message: logLines.join("\n"),
    })
}

function formatLog_Tg(log: Log): string {
    const trFormatted = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(log.timestamp);

    const fields: { key: string; value: string }[] = [
        {key: "timestamp", value: trFormatted},
        {key: "type", value: log.type},
        {
            key: "from", value: log.from == "USER" && log.user != undefined ? `${
                log.user?.username != undefined ? `@${log.user.username} (${log.user.id})` : log.user!.id
            }` : log.from
        }
    ];

    let message =
        fields.map(f => `<b>${f.key}</b>: ${escapeHtml(f.value)}`).join("\n");

    if (message != undefined) {
        message += `\n\n${escapeHtml(log.message!!)}`;
    }

    if (log.stack != undefined) {
        message += `\n\n<code>${escapeHtml(log.stack)}</code>`;
    }

    return message;
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}