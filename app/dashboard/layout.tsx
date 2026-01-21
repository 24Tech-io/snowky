import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { name: true, email: true }
    });

    return user;
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="dashboard-page">
            {/* Dashboard Navigation */}
            <nav className="dashboard-nav">
                <div className="dashboard-nav-container">
                    <div className="dashboard-nav-left">
                        <Link href="/dashboard" className="dashboard-logo">
                            <div className="dashboard-logo-icon">🐻‍❄️</div>
                            <span className="dashboard-logo-text">Snowky</span>
                        </Link>
                    </div>

                    <div className="dashboard-nav-right">
                        {/* Notification button removed as per user request */}

                        <div className="nav-user-menu">
                            <div className="nav-user-avatar">{initials}</div>
                            <div className="nav-user-info">
                                <span className="nav-user-name">{user.name}</span>
                                <span className="nav-user-email">{user.email}</span>
                            </div>
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
