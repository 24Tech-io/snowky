"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        // Clear the cookie by calling an API route or server action
        // For simplicity, we'll just expire the cookie on the client side if possible, 
        // but since it's httpOnly, we need a server route to clear it.
        // Let's create a logout API route.

        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <button
            onClick={handleSignOut}
            className="text-xs text-red-500 hover:text-red-600 mt-1 font-medium"
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
        >
            Sign Out
        </button>
    );
}
