/*
 * (c) 2026 Muhammed Ali Bulut, All rights reserved.
 *
 *  Licensed under the Apache License 2.0, see LICENSE file in repository
 *  root for copy file of license. For copyright notices, technical issues,
 *  feedback, or any other related to this code file / project, please contact
 *  me via mamii@mamii.dev or other ways.
 */

import dotenv from "dotenv";
import {Pool} from "pg";
import {EventStatus} from "@/utils/GeneralUtils";
import {getEnvironmentMode} from "@/utils/BotUtils";

dotenv.config();

const envMode = getEnvironmentMode();
const hostname = envMode == "debug" ? process.env.DB_HOSTNAME_PUBLIC : process.env.DB_HOSTNAME_INTERNAL

const client = new Pool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    host: hostname,
    database: process.env.DB_DATABASE
})

export async function connectRemoteDb(): Promise<EventStatus> {
    try {
        await client.connect();

        return {
            status: true,
            log: `Connected to database (${envMode == "production" ? "internal" : "external"}) server successfully. ${
                envMode == "debug" ? `(Server IP: ${hostname})` : ""
            }`,
        };
    } catch (err) {
        return {
            status: false,
            log: "An error occurred while connecting to database.",
            err: err,
        };
    }
}

export default client