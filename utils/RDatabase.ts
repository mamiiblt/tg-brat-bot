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

dotenv.config();

const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith("--mode="));
const mode = modeArg?.split("=")[1] ?? "dev";
const hostname = mode == "debug" ? process.env.DB_HOSTNAME_PUBLIC : process.env.DB_HOSTNAME_INTERNAL

const client = new Pool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    host: hostname,
    database: process.env.DB_DATABASE
})

export async function connectRemoteDb() {
    return new Promise<EventStatus>((resolve) => {
        client.connect()
            .then(() => resolve({ status: true, log: `Connected to database (${mode}) server successfully. ${mode == "debug" ? `(Server IP: ${hostname})` : ""}`}))
            .catch(() => resolve({ status: false, log: "An error occurred while connecting to database." }))
    })
}

export default client