"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Retry wrapper for transient DB errors (e.g. connection reset)
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const isTransient =
                message.includes("prepared statement") ||
                message.includes("connection") ||
                message.includes("ECONNRESET") ||
                message.includes("socket");

            if (isTransient && attempt < retries) {
                console.warn(`[admin:action] transient error, retrying (${attempt + 1}/${retries})`, { message });
                continue;
            }
            throw error;
        }
    }
    throw new Error("Unreachable");
}

// Helper to check admin
async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await withRetry(() =>
        prisma.user.findUnique({
            where: { email: session.user!.email! },
        })
    );

    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return user;
}

export async function approveUser(userId: string) {
    const admin = await checkAdmin();
    console.log("[admin:action] approveUser", { adminId: admin.id, targetUserId: userId });
    await withRetry(() =>
        prisma.user.update({
            where: { id: userId },
            data: { is_approved: true },
        })
    );
    console.log("[admin:action] user approved successfully", { userId });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
}

export async function revokeUser(userId: string) {
    const admin = await checkAdmin();
    console.log("[admin:action] revokeUser", { adminId: admin.id, targetUserId: userId });
    await withRetry(() =>
        prisma.user.update({
            where: { id: userId },
            data: { is_approved: false },
        })
    );
    console.log("[admin:action] user revoked successfully", { userId });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
}

export async function toggleUserRole(userId: string) {
    const admin = await checkAdmin();
    const targetUser = await withRetry(() =>
        prisma.user.findUnique({ where: { id: userId } })
    );
    if (!targetUser) {
        console.warn("[admin:action] toggleUserRole — target user not found", { userId });
        return;
    }

    const newRole = targetUser.role === "admin" ? "user" : "admin";
    console.log("[admin:action] toggleUserRole", {
        adminId: admin.id,
        targetUserId: userId,
        oldRole: targetUser.role,
        newRole,
    });
    await withRetry(() =>
        prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        })
    );
    console.log("[admin:action] role toggled successfully", { userId, newRole });
    revalidatePath("/admin");
}
