import { PrismaClient } from '@prisma/client';
import { seedRestaurantFeatures } from './seeds/restaurant-features.seed';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperUser() {
  console.log('Creating superuser...');

  // Check if superuser already exists
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: '+77002151000' },
  });

  if (existingUser) {
    console.log('Superuser already exists');
    return;
  }

  // Create superuser
  const hashedPassword = await bcrypt.hash('Ansar2003', 10);

  const superUser = await prisma.user.create({
    data: {
      phoneNumber: '+77002151000',
      email: 'ansar@admin.local',
      password: hashedPassword,
      firstName: 'Ansar',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('Superuser created:', superUser.phoneNumber);
}

async function main() {
  console.log('Start seeding...');

  // Create superuser first
  await createSuperUser();

  // Seed restaurant features
  await seedRestaurantFeatures();

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
