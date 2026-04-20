import {setupBot} from "@/bot/BratBot";
import dotenv from "dotenv";

async function start() {
    dotenv.config({ path: ".env" });
    await setupBot()
}

start().then(r => console.log("All start tasks successfully operated."));