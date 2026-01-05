const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Trouver le rôle SUPER_ADMIN
    const adminRole = await prisma.role.findFirst({
      where: { code: 'SUPER_ADMIN' }
    });

    if (!adminRole) {
      console.error('❌ SUPER_ADMIN role not found!');
      return;
    }

    console.log(`✓ Found admin role: ${adminRole.name}`);

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash('Admin@2026', 10);

    // Créer ou mettre à jour l'utilisateur admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@finances.dj' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'admin@finances.dj',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+253 77 00 00 00',
        isActive: true,
        roleId: adminRole.id,
      },
    });

    console.log(`✅ Admin user created/updated successfully!`);
    console.log(`   Email: admin@finances.dj`);
    console.log(`   Password: Admin@2026`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
