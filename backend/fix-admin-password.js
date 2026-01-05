const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin password...\n');

    // Generate correct hash for Admin@2026
    const correctHash = await bcrypt.hash('Admin@2026', 10);
    console.log('Generated new hash for Admin@2026');

    // Update admin user
    const updated = await prisma.user.update({
      where: { email: 'admin@finances.dj' },
      data: { password: correctHash }
    });

    console.log(`✅ Password updated for: ${updated.email}`);

    // Verify it works
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@finances.dj' }
    });

    const isValid = await bcrypt.compare('Admin@2026', testUser.password);
    console.log(`\n✅ Verification: Password "Admin@2026" is now ${isValid ? 'VALID' : 'INVALID'}`);

    if (isValid) {
      console.log('\n🎉 Admin login fixed successfully!');
      console.log('   Email: admin@finances.dj');
      console.log('   Password: Admin@2026');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
