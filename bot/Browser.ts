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
