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