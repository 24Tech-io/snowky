import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const BASE_HOST_POOLED = "ep-twilight-pine-aheyqpws-pooler.c-3.us-east-1.aws.neon.tech";
const BASE_HOST_DIRECT = "ep-twilight-pine-aheyqpws.c-3.us-east-1.aws.neon.tech"; // Guessed by removing -pooler
const USER = "neondb_owner";
const PASS = "npg_iU74haYetWIV"; // Hardcoded from user snippet to ensure valid test even if .env is broken
const DB = "neondb";

async function testConnection(name: string, url: string) {
    console.log(`\nTesting ${name}...`);
    console.log(`URL: ${url.replace(PASS, "****")}`);

    const client = new PrismaClient({
        datasources: { db: { url } }
    });

    try {
        const start = Date.now();
        await client.$connect();
        const count = await client.user.count();
        const duration = Date.now() - start;
        console.log(`✅ SUCCESS! Connected in ${duration}ms. Found ${count} users.`);
        await client.$disconnect();
        return true;
    } catch (e: any) {
        console.log(`❌ FAILED: ${e.message.split('\n').pop()}`); // Log last line of error
        return false;
    }
}

async function main() {
    console.log("diagnosing database connectivity...");

    // 1. Current .env (Pooled)
    const currentUrl = process.env.DATABASE_URL || "";
    if (currentUrl) await testConnection("Current .env", currentUrl);

    // 2. Constructed Pooled (Standard)
    const urlPooled = `postgresql://${USER}:${PASS}@${BASE_HOST_POOLED}/${DB}?sslmode=require`;
    const pooledWorks = await testConnection("Constructed Pooled", urlPooled);

    // 3. Constructed Direct (No Pooler - Good for scripts/migrations)
    const urlDirect = `postgresql://${USER}:${PASS}@${BASE_HOST_DIRECT}/${DB}?sslmode=require`;
    const directWorks = await testConnection("Constructed Direct", urlDirect);

    if (pooledWorks || directWorks) {
        console.log("\n--- DIAGNOSIS COMPLETE ---");
        console.log("We found a working connection!");
        if (directWorks) console.log("RECOMMENDATION: Use DIRECT connection for local scripts/migrations.");
        if (pooledWorks) console.log("RECOMMENDATION: Use POOLED connection for App.");
    } else {
        console.error("\n❌ ALL CONNECTIONS FAILED. Check internet or User/Pass.");
        // Try the IP address as last resort? No, IP is too dynamic for Neon.
    }
}

main();
