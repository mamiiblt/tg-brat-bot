/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import puppeteer, {Browser} from "puppeteer";

let browser: Browser;

export async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }
    return browser;
}
