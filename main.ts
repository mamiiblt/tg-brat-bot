import {setupBot} from "@/bot/BratBot";
import dotenv from "dotenv";
import {setupI18n} from "@/utils/i18n";
import {connectRemoteDb} from "@/utils/RDatabase";

async function start() {
    dotenv.config({ path: ".env" });

    await connectRemoteDb()
    await setupI18n()
    await setupBot()
}

start().then(r => console.log("All start tasks successfully operated."));