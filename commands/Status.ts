import {Command} from "@/types/Command";
import {sendMessage} from "@/bot/Utils";
import * as os from "node:os";
import prettyMs from "pretty-ms";

export default {
    name: "status",
    description: "Shows technical status of bot",
    async execute(msg, args) {
        const chatId = msg.chat.id;
        const systemStatus = getSystemStatus();
        await sendMessage({
            chatId,
            msg,
            text: systemStatus,
            replyToMessage: true,
            msg_parse_mode: "HTML",
        });
    }

} satisfies Command;

function getSystemStatus(): string {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    const processMem = process.memoryUsage().rss;
    const uptime = prettyMs(os.uptime() * 1000, {verbose: true});
    const processUptime = prettyMs(process.uptime() * 1000, {verbose: true});
    const loadAvg = os.loadavg()[0].toFixed(2);

    const now = new Date().toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
    });

    return `
<b>Bot Container Status</b>

<b>S-RAM Usage:</b> ${(usedMem / 1024 / 1024).toFixed(0)}MB / ${(
        totalMem /
        1024 /
        1024
    ).toFixed(0)}MB (${memUsagePercent}%)
<b>P-RAM Usage:</b> ${(processMem / 1024 / 1024).toFixed(1)}MB
<b>CPU Load:</b> ${loadAvg}
<b>Uptime (System):</b> ${uptime}
<b>Uptime (Bot):</b> ${processUptime}
<b>System Time:</b> ${now}
  `.trim();
}