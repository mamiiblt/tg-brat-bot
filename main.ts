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

type AsyncEvent = () => Promise<EventStatus>
const events: AsyncEvent[] = [
    setupI18n, initBot, loadCommands, connectRemoteDb, setupBot, initBrowser
]

async function start() {
    dotenv.config({ path: ".env" });

    process.env.NTBA_FIX_350 = "1"
    console.log(`[0/${events.length}] ⌛ - Starting bot, please wait...`);

    for (const event of events) {
        const index = events.indexOf(event);
        const result: EventStatus = await event()
        console.log(`[${index + 1}/${events.length}] ${result.status ? "✅" : "❌"} - ${result.log}`)

        if (!result.status) {
            process.exit(-1);
        }
    }
}

start()