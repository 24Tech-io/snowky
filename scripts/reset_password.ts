
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = "adhithiyanmaliackal@gmail.com";
    const newPassword = "@Adhi1234";

    console.log(`Resetting password for ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error("❌ User not found!");
        return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });

    console.log("✅ Password updated successfully to: @Adhi1234");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
