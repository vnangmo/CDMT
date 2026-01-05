const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    console.log('📋 Users in database:\n');
    users.forEach(user => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role.name}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Password (first 20 chars): ${user.password.substring(0, 20)}...`);
      console.log('');
    });

    console.log(`Total users: ${users.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
