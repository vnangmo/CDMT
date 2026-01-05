const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@finances.dj' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✓ User found:', user.email);
    console.log('  Password hash:', user.password.substring(0, 30) + '...');

    // Test different passwords
    const passwords = ['Admin@2026', 'Test@2024', 'admin@2026'];

    for (const password of passwords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`\n  Testing password "${password}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    // Generate a new hash for comparison
    console.log('\n--- Testing hash generation ---');
    const newHash = await bcrypt.hash('Admin@2026', 10);
    console.log('New hash:', newHash.substring(0, 30) + '...');

    const testNew = await bcrypt.compare('Admin@2026', newHash);
    console.log('Test new hash: ', testNew ? '✅ VALID' : '❌ INVALID');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
