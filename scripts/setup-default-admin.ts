import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function setupDefaultAdmin() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.log("[setup-default-admin] DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set. Skipping.");
    process.exit(0);
  }

  if (password.length < 6) {
    console.error("[setup-default-admin] DEFAULT_ADMIN_PASSWORD must be at least 6 characters.");
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: "admin",
        is_approved: true,
        // Password TIDAK di-update — jika admin sudah ganti password, tetap preserved
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: "admin",
        is_approved: true,
      },
    });

    console.log(`[setup-default-admin] Admin ready: ${user.email} (id: ${user.id})`);
  } catch (error) {
    console.error(`[setup-default-admin] Failed:`, error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultAdmin();
