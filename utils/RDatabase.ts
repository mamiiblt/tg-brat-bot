import dotenv from "dotenv";
import {Client} from "pg";

dotenv.config();

const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith("--mode="));
const mode = modeArg?.split("=")[1] ?? "dev";
const hostname = mode == "debug" ? process.env.DB_HOSTNAME_PUBLIC : process.env.DB_HOSTNAME_INTERNAL

const client = new Client({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    host: hostname,
    database: process.env.DB_DATABASE
})

export async function connectRemoteDb() {
    client.connect().then(r => console.log(`✅ Connected to database server: ${hostname}`))
}

export default client