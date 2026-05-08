/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import puppeteer, {Browser} from "puppeteer";
import {EventStatus} from "@/utils/GeneralUtils";

let browser: Browser | undefined;

export async function initBrowser(): Promise<EventStatus> {
    return new Promise<EventStatus>(async resolve => {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        resolve({ status: true, log: `Browser is started successfully with headless mode.` });
    })
}


export function getBrowser(): Browser {
    if (!browser) {
        throw new Error("Browser is not initialized yet.");
    }

    return browser;
}