import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, you will receive a password reset link."
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Generate reset link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

        // Send email
        const emailHtml = generatePasswordResetEmail(user.name, resetLink);
        await sendEmail({
            to: user.email,
            subject: "Reset Your Snowky Password",
            html: emailHtml
        });

        // Log reset link for development (when SMTP not configured)
        console.log('Password reset link:', resetLink);

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, you will receive a password reset link.",
            // Include reset link in dev mode for testing
            ...(process.env.NODE_ENV === 'development' && { resetLink })
        });

    } catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Failed to process request", details: error.message },
            { status: 500 }
        );
    }
}
