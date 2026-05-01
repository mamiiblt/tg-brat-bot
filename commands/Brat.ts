/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Command} from "@/types/Command";
import {getBot} from "@/bot/BratBot";
import * as fs from "node:fs";
import {getBrowser} from "@/bot/Browser";
import path from "node:path";
import {createBratPage, defaultPageConfig} from "@/utils/html/BratPage";
import {InlineKeyboardMarkup} from "node-telegram-bot-api";

const themeMap = {
    gr: {bg: '#7AD000', tx: '#000000'}, // green
    wh: {bg: "#FFFFFF", tx: "#070707"}, // white
    bl: {bg: "#0A00AD", tx: "#DE0000"} // blue
}

const fontData = {
    familyName: "Arial Narrow",
    base64: loadFontBase64("./assets/arial_narrow.ttf")
}

interface BratConfig {
    text: string,
    theme: { bg: string; tx: string },
    fontSize: number,
    removeBlurEffect: boolean,
    rawPng: boolean,
    showScribble: boolean,
}

export default {
    name: "b",
    description: "Create brat images.",
    async execute(msg, trs, args) {
        const chat_id = msg.chat.id
        const commandArgs = msg.text?.replace("/b ", "").split(" ") as string[]
        const replied = msg.reply_to_message

        if (!replied) {
            await getBot().sendMessage(chat_id, trs.get("cmds.brat.useBratAsReply"), {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id,
                message_thread_id: msg.message_thread_id
            })

            return;
        }

        // get theme from props
        type ThemeKey = keyof typeof themeMap
        const theme = commandArgs.map(arg => themeMap[arg as ThemeKey]).find(Boolean) ?? themeMap.gr

        // get font size (or use default)
        var fontSize = defaultPageConfig.fontSize
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
            rawPng: commandArgs.includes("png"),
            showScribble: commandArgs.includes("scr"),
        } as BratConfig

        const pngFile = await generateBratImage(bratConfig)
        const buffer = Buffer.from(pngFile);

        const isChatGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        const replyMarkup: InlineKeyboardMarkup = isChatGroup ? {
            inline_keyboard: [
                [{ text: trs.get("cmds.brat.saveToStickerPack"), callback_data: "save_sticker" }]
            ]
        } : { inline_keyboard: [] }

        if (bratConfig.rawPng) {
            getBot().sendPhoto(msg.chat.id, buffer, {
                reply_to_message_id: msg.message_id,
                message_thread_id: msg.message_thread_id,
                reply_markup: replyMarkup
            })
        } else {
            getBot().sendSticker(msg.chat.id, buffer, {
                reply_to_message_id: msg.message_id,
                message_thread_id: msg.message_thread_id,
                reply_markup: replyMarkup
        })}
    }
} satisfies Command;

function loadFontBase64(fPath: string): string {
    const fontPath = path.resolve(fPath);
    const fontBuffer = fs.readFileSync(fontPath)
    return fontBuffer.toString("base64")
}

export async function generateBratImage(cfg: BratConfig) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    const isThemeWh = cfg.theme.bg == themeMap.wh.bg

    const bratPage = createBratPage({
        text: cfg.text.toString(),
        blurAmount: cfg.removeBlurEffect ? 0 : defaultPageConfig.blurAmount,
        theme: {
            backgroundHex: cfg.theme.bg,
            textHex: cfg.theme.tx,
            boxPadding: isThemeWh ? 60 : 35
        },
        font: {
            size: cfg.fontSize == defaultPageConfig.fontSize && isThemeWh ? defaultPageConfig.fontSize + 500 : cfg.fontSize,
            weight: defaultPageConfig.fontWeight,
            base64: fontData.base64,
            familyName: fontData.familyName,
            lineHeight: defaultPageConfig.lineHeight,
            textAlign: isThemeWh ? "justify" : "center",
            alignItems: "center",
        }
    })

    await page.setContent(bratPage, {
        waitUntil: "networkidle2",
    });

    await page.evaluate(async () => {
        const el = document.querySelector("#display") as HTMLElement;
        if (!el) return;
    });

    await page.waitForFunction(
        (familyName) => {
            const el = document.querySelector("#display");
            if (!el) return false;

            const style = getComputedStyle(el);
            return style.fontFamily.includes(familyName);
        }, {}, fontData.familyName
    );
    await new Promise(resolve => setTimeout(resolve, 50));

    const el = await page.$("#bratBox");
    if (!el) throw new Error("bratBox not found");

    const buffer = Buffer.from(await el.screenshot());
    await page.close();
    return buffer;
}