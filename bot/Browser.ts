import puppeteer, {Browser} from "puppeteer";

let browser: Browser;

export async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
        });
    }
    return browser;
}