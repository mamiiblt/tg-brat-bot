import {Message} from "node-telegram-bot-api";

export interface Command {
    name: string;
    description: string
    execute: (msg: Message, args?: string[]) => Promise<void>;
}

export interface CommandInfo {
    name: string;
    description: string;
}