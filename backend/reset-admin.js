const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    // Hash du mot de passe "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Chercher le rôle Admin
    let adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { code: 'ADMIN' },
          { name: 'Admin Système' }
        ]
      }
    });

    if (!adminRole) {
      // Créer le rôle s'il n'existe pas
      adminRole = await prisma.role.create({
        data: {
          code: 'ADMIN_SYS',
          name: 'Admin Système',
          description: 'Administrateur système avec tous les droits',
          isActive: true
        }
      });
      console.log('✓ Rôle Admin créé');
    } else {
      console.log('✓ Rôle Admin trouvé:', adminRole.name);
    }

    // Chercher l'utilisateur admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@finances.dj' }
    });

    if (adminUser) {
      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { email: 'admin@finances.dj' },
        data: {
          password: hashedPassword,
          isActive: true
        }
      });
      console.log('✓ Mot de passe admin réinitialisé');
    } else {
      // Créer l'utilisateur admin
      await prisma.user.create({
        data: {
          email: 'admin@finances.dj',
          firstName: 'Admin',
          lastName: 'Système',
          password: hashedPassword,
          roleId: adminRole.id,
          isActive: true
        }
      });
      console.log('✓ Utilisateur admin créé');
    }

    console.log('\n✓ Admin réinitialisé avec succès!');
    console.log('Email: admin@finances.dj');
    console.log('Mot de passe: admin123');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
