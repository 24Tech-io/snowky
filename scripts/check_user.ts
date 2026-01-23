import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = "adhithiyanmaliackal@gmail.com";
    const passwordInput = "@Adhi1234";

    console.log(`Checking for user: ${email}...`);

    // 1. Connection Check
    const userCount = await prisma.user.count();
    console.log(`\n[CONNECTION CHECK]: ✅ Database connected! Found ${userCount} users.`);

    // 2. Try the "Intended" Email
    const intendedEmail = "adhithiyanmaliackal@gmail.com";
    const userIntended = await prisma.user.findUnique({ where: { email: intendedEmail } });
    if (!userIntended) {
        console.log(`[LOGIN ATTEMPT 1] Email: ${intendedEmail} -> ❌ NOT FOUND (This is what you are typing)`);
    }

    // 3. Try the "Actual" Email (with typo)
    const actualEmail = "adhithiyanmaliackal@gmai.com";
    const userActual = await prisma.user.findUnique({ where: { email: actualEmail } });
    if (userActual) {
        console.log(`[LOGIN ATTEMPT 2] Email: ${actualEmail} -> ✅ FOUND! (This is what is in DB)`);

        // Check password
        const isMatch = await bcrypt.compare("@Adhi1234", userActual.password);
        console.log(`[PASSWORD CHECK]  Password: @Adhi1234 -> ${isMatch ? "✅ CORRECT" : "❌ INCORRECT"}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
