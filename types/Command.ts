/*
 * (c) 2026 Muhammed Ali (a.k.a. mamiiblt), All rights reserved.
 *
 * For copyright notices, technical issues, feedback, or any other
 * inquiries related to this code file or project, please contact mamii@mamii.dev
 */

import {Message} from "node-telegram-bot-api";
import {UserLanguage} from "@/utils/i18n";

export interface Translator {
    userLng: UserLanguage;
    get: (key: string, options?: Record<string, any>) => string;
}

export interface Command {
    name: string;
    description: string
    execute: (msg: Message, i18n: Translator, args?: string[]) => Promise<any>;
    // i18n is user i18n, so it's customized for user lang.
}