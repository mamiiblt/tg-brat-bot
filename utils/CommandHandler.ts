/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import path from "node:path";
import {Command} from "@/types/Command";
import {commands} from "@/bot/BratBot";
import {readdirSync, statSync} from "fs-extra";

export async function loadCommands() {
    const commandsPath = path.join(__dirname, "../commands");
    const files = getAllFiles(commandsPath);

    for (const filePath of files) {
        const commandModule = require(filePath);
        const command: Command = commandModule.default ?? commandModule;
        if (command && command.name) commands.push(command);
    }

    console.log(`✅ Loaded ${commands.length} bot commands.`);
}

function getAllFiles(dir: string, exts: string[] = [".ts", ".js"]): string[] {
    let results: string[] = [];
    const list = readdirSync(dir);

    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath, exts));
        } else if (exts.some(ext => file.endsWith(ext))) {
            results.push(filePath);
        }
    }

    return results;
}