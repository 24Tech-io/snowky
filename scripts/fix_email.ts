import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const wrongEmail = "adhithiyanmaliackal@gmai.com";
    const correctEmail = "adhithiyanmaliackal@gmail.com";

    console.log(`[FIX] Attempting to rename ${wrongEmail} -> ${correctEmail}`);

    // 1. Check if target already exists
    const targetUser = await prisma.user.findUnique({
        where: { email: correctEmail }
    });

    if (targetUser) {
        console.error("❌ TARGET EXISTS: A user with 'adhithiyanmaliackal@gmail.com' already exists.");
        console.error("Cannot rename. Please delete the empty/new account first if you want to overwite.");
        return;
    }

    // 2. Find the user with typo
    const userWithTypo = await prisma.user.findUnique({
        where: { email: wrongEmail }
    });

    if (!userWithTypo) {
        console.error("❌ SOURCE MISSING: Could not find user with typo 'adhithiyanmaliackal@gmai.com'.");
        return;
    }

    // 3. Update
    const updated = await prisma.user.update({
        where: { id: userWithTypo.id },
        data: { email: correctEmail }
    });

    console.log("✅ SUCCESS! Email updated.");
    console.log(`User ID: ${updated.id}`);
    console.log(`New Email: ${updated.email}`);
}

main()
    .catch((e) => {
        console.error("Script Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
