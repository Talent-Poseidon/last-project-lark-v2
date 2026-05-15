"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(fullName: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { name: fullName },
        });
        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard");
    } catch (error) {
        console.error("[profile:action] updateProfile failed", {
            error: error instanceof Error ? error.message : error,
            email: session.user.email,
        });
        throw new Error("Failed to update profile. Please try again.");
    }
}
