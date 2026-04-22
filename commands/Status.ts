import {Command, Translator} from "@/types/Command";
import {sendMessage} from "@/utils/BotUtils";
import * as os from "node:os";
import prettyMs from "pretty-ms";

export default {
    name: "status",
    description: "Shows technical status of bot",
    async execute(msg, trs, args) {
        const chatId = msg.chat.id;
        const systemStatus = getSystemStatus(trs);
        await sendMessage({
            chatId,
            msg,
            text: systemStatus,
            replyToMessage: true,
            msg_parse_mode: "HTML",
        });
    }

} satisfies Command;

function getSystemStatus(trs: Translator): string {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    const processMem = process.memoryUsage().rss;
    const uptime = prettyMs(os.uptime() * 1000, {verbose: true});
    const processUptime = prettyMs(process.uptime() * 1000, {verbose: true});
    const loadAvg = os.loadavg()[0].toFixed(2);

    const now = new Date().toLocaleString("en-US", {
        timeZone: "Europe/Istanbul",
    });

    return `
<b>${trs.get("cmds.status.usageTmpl", {name: "S-RAM"})}:</b> ${(usedMem / 1024 / 1024).toFixed(0)}MB / ${(
        totalMem /
        1024 /
        1024
    ).toFixed(0)}MB (${memUsagePercent}%)
<b>${trs.get("cmds.status.usageTmpl", {name: "P-RAM"})}:</b> ${(processMem / 1024 / 1024).toFixed(1)}MB
<b>${trs.get("cmds.status.cpuLoad")}:</b> ${loadAvg}
<b>${trs.get("cmds.status.uptimeSys")}:</b> ${uptime}
<b>${trs.get("cmds.status.uptimeBot")}:</b> ${processUptime}
<b>${trs.get("cmds.status.systemTime")}:</b> ${now}
  `.trim();
}