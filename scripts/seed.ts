const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('adminpassword', 10);

  // Original Admin (preserve existing logic)
  const originalAdmin = await prisma.user.upsert({
    where: { email: 'admin@monster.com' },
    update: {
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@monster.com',
      name: 'Admin Monster',
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test Admin (for E2E tests)
  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Test Admin',
      password,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test User (for E2E tests)
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password,
      role: 'user',
      is_approved: true,
    },
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password,
      role: 'user',
      is_approved: true,
    },
  });

  // Seed Kamus items for E2E tests
  const seedKamusPotensi = await prisma.kamusItem.upsert({
    where: { code: 'seed-kamus-potensi-1' },
    update: {},
    create: {
      id: 'seed-kamus-potensi-1',
      code: 'seed-kamus-potensi-1',
      name: 'Seed Analytical Thinking',
      type: 'potensi',
      description: 'Seeded potensi for E2E tests',
      behavioralIndicators: 'Indicator A | Indicator B',
    },
  });

  const seedKamusKompetensi = await prisma.kamusItem.upsert({
    where: { code: 'seed-kamus-kompetensi-1' },
    update: {},
    create: {
      id: 'seed-kamus-kompetensi-1',
      code: 'seed-kamus-kompetensi-1',
      name: 'Seed Leadership',
      type: 'kompetensi',
      description: 'Seeded kompetensi for E2E tests',
      behavioralIndicators: 'Inspires team | Sets direction',
    },
  });

  console.log({ originalAdmin, testAdmin, testUser, seedKamusPotensi, seedKamusKompetensi });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
