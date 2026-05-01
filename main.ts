/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import dotenv from "dotenv";
import {setupI18n} from "@/utils/i18n";
import {connectRemoteDb} from "@/utils/RDatabase";
import {setupBot} from "@/bot/BratBot";

async function start() {
    dotenv.config({ path: ".env" });

    await connectRemoteDb()
    await setupI18n()
    await setupBot()
}

start().then(r => {})