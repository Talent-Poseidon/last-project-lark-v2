import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function setupAdmin() {
  console.log("\n🚀 \x1b[36mAdmin Setup Wizard\x1b[0m\n");

  const email = await question("Enter Admin Email: ");
  const password = await question("Enter Admin Password (min 6 chars): ");
  const name = await question("Enter Admin Full Name: ");

  if (password.length < 6) {
    console.error("\x1b[31m%s\x1b[0m", "Error: Password must be at least 6 characters.");
    rl.close();
    process.exit(1);
  }

  console.log("\n⏳ Creating admin user...");

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("\x1b[33m%s\x1b[0m", "User already exists. Updating role to admin...");
      await prisma.user.update({
        where: { email },
        data: {
          role: "admin",
          is_approved: true,
          // Only update password if provided and user was not OAuth only (has password field)
          ...(existingUser.password ? { password: await bcrypt.hash(password, 10) } : {}),
        },
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "admin",
          is_approved: true,
        },
      });
    }

    console.log("\n🎉 \x1b[32mSuccess! Admin account is ready.\x1b[0m");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password.replace(/./g, '*')}`); // Hide password in logs
    console.log("You can now log in at /auth/login");

  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", `Error setting up admin: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

setupAdmin();
