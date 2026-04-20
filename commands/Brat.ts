import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import * as fs from "node:fs";
import {getBrowser} from "@/bot/Browser";
import path from "node:path";
import {pathToFileURL} from "node:url";

const themeMap = {
    tgr: {bg: '#7AD000', tx: '#000000'}, // green
    twh: {bg: "#FFFFFF", tx: "#070707"}, // white
    tbl: {bg: "#0A00AD", tx: "#DE0000"} // blue
}

var bratHtml = fs.readFileSync(`${process.cwd()}/assets/brat.html`, "utf-8")
injectFontBase64()


interface BratConfig {
    text: string,
    theme: { bg: string; tx: string },
    fontSize: number,
    removeBlurEffect: boolean,
    rawPng: boolean,
    showScribble: boolean,
}

export default {
    name: "brat",
    description: "Create brat images.",
    async execute(msg, args) {
        const chat_id = msg.chat.id
        const commandArgs = msg.text?.replace("/brat ", "").split(" ") as string[]
        const replied = msg.reply_to_message

        if (!replied) {
            await getBot().sendMessage(chat_id, "Use /brat as a <b>reply to the message</b> you want to quote.", {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id,
            })

            return;
        }

        // get theme from props
        type ThemeKey = keyof typeof themeMap
        const theme = commandArgs.map(arg => themeMap[arg as ThemeKey]).find(Boolean) ?? themeMap.tgr

        // get font size (or use default)
        var fontSize = 175
        const fsArg = commandArgs.find(arg => arg.startsWith("fs-"))
        if (fsArg) {
            const value = Number(fsArg.split("-")[1])
            if (!isNaN(value)) {
                fontSize = value
            }
        }

        const bratConfig = {
            text: msg.reply_to_message?.text,
            theme: theme,
            fontSize: fontSize,
            removeBlurEffect: commandArgs.includes("rbe"),
            rawPng: commandArgs.includes("raw"),
            showScribble: commandArgs.includes("scr"),
        } as BratConfig

        const pngFile = await generateBratImage(bratConfig)
        const buffer = Buffer.from(pngFile);

        if (bratConfig.rawPng) {
            getBot().sendPhoto(msg.chat.id, buffer, {
                reply_to_message_id: msg.message_id,
            })
        } else {
            getBot().sendSticker(msg.chat.id, buffer, {
                reply_to_message_id: msg.message_id,
            })
        }

        console.log(bratConfig);
    }
} satisfies Command;

function injectFontBase64() {
    const fontPath = path.resolve("./assets/arial_narrow.ttf");
    const fontBuffer = fs.readFileSync(fontPath)
    const fontBase64 = fontBuffer.toString("base64")
    bratHtml = bratHtml.replace("__BASE64_HERE__", fontBase64)
}

export async function generateBratImage(cfg: BratConfig) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    let rp = bratHtml
    rp = rp.replace("__TEXT__", cfg.text)
    rp = rp.replace("font-size: 185px;", `font-size: ${cfg.fontSize}px;`)
    rp = rp.replace("let fontSize = 185;", `let fontSize = ${cfg.fontSize};`)
    rp = rp.replace("background: #7AD000;", `background: ${cfg.theme.bg};`)
    rp = rp.replace("color: #000000;", `color: ${cfg.theme.tx};`)
    if (cfg.removeBlurEffect) rp = rp.replace("filter: blur(5px);", "")

    await page.setContent(rp, {
        waitUntil: "networkidle2",
    });

    await page.evaluate(async () => {
        const el = document.querySelector("#display") as HTMLElement;
        if (!el) return;
    });

    await page.waitForFunction(() => {
        const el = document.querySelector("#display");
        if (!el) return false;
        const style = getComputedStyle(el);
        return style.fontFamily.includes("GeistLocal");
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const el = await page.$("#bratBox");
    if (!el) throw new Error("bratBox not found");

    const buffer = Buffer.from(await el.screenshot());
    await page.close();
    return buffer;
}