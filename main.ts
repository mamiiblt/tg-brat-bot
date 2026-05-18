/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import dotenv from "dotenv";
import {setupI18n} from "@/utils/i18n";
import {connectRemoteDb} from "@/utils/RDatabase";
import {EventStatus} from "@/utils/GeneralUtils";
import {initBot, setupBot} from "@/bot/BratBot";
import {loadCommands} from "@/utils/CommandHandler";
import {initBrowser} from "@/bot/Browser";
import {sendAllExecLogs, writeLog} from "@/utils/Logger";

type EventRunner = () => EventStatus | Promise<EventStatus>;
const events: EventRunner[] = [
    setupI18n, initBot, loadCommands, connectRemoteDb, setupBot, initBrowser
]

async function start() {
    dotenv.config({ path: ".env" });
    process.env.NTBA_FIX_350 = "1"
    console.log();

    await writeLog({ from: "SERVER", type: "INFO", message: `[0/${events.length}] ⌛ Starting bot, please wait...`, writeOnlyConsole: true })
    for (let i = 0; i < events.length; i++) {
        const step = events[i];
        const result = await step();
        await writeLog({
            from: "SERVER",
            type: result.status ? "INFO" : "ERROR",
            message: `[${i + 1}/${events.length}] ${result.status ? "✅" : "❌"} ${result.log}`,
            err: result.err,
            writeOnlyConsole: true
        })
        if (!result.status) process.exit(1);
    }
    await writeLog({ from: "SERVER", type: "INFO", message: `[${events.length}/${events.length}] 🎉 All executions ran successfully, bot is running right now...`, writeOnlyConsole: true })
    await sendAllExecLogs()
}

function initGlobalErrorHandler() {
    process.on("uncaughtException", async (err) => {
        await writeLog({
            from: "SERVER",
            type: "ERROR",
            err: err,
        })
        setTimeout(() => process.exit(1), 100);
    });

    process.on("unhandledRejection", async (reason) => {
        await writeLog({
            from: "SERVER",
            type: "ERROR",
            message: `unhandledRejection`,
            err: reason,
        })
    });

    process.on("SIGTERM", async () => {
        await writeLog({
            from: "SERVER",
            type: "ERROR",
            message: `SIGTERM received`
        })
        setTimeout(() => process.exit(0), 1000);
    });

    process.on("SIGINT", async () => {
        await writeLog({
            from: "SERVER",
            type: "ERROR",
            message: `SIGINT received`
        })
        process.exit(0);
    });
}
initGlobalErrorHandler()
start()