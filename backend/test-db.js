const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    // Test query
    const count = await prisma.ministry.count();
    console.log(`✓ Found ${count} ministries in database`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
