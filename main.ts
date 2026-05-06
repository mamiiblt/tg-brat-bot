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
import {setupBot} from "@/bot/BratBot";

async function start() {
    dotenv.config({ path: ".env" });

    await connectRemoteDb()
    await setupI18n()
    await setupBot()
}

start().then(r => {})