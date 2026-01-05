import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des utilisateurs...\n');

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '@finances.dj' } },
        { email: { contains: '@worldbank.org' } },
      ],
    },
    include: {
      role: true,
    },
    orderBy: {
      email: 'asc',
    },
  });

  console.log(`📊 ${users.length} utilisateurs trouvés:\n`);

  users.forEach((user) => {
    console.log(`✓ ${user.email}`);
    console.log(`  Nom: ${user.firstName} ${user.lastName}`);
    console.log(`  Rôle: ${user.role.code} (${user.role.name})`);
    console.log(`  Actif: ${user.isActive ? 'Oui' : 'Non'}`);
    console.log(`  ID: ${user.id}`);
    console.log('');
  });

  // Vérifier le nombre de rôles et permissions
  const rolesCount = await prisma.role.count();
  const permissionsCount = await prisma.permission.count();
  const rolePermissionsCount = await prisma.rolePermission.count();

  console.log('📈 Statistiques RBAC:');
  console.log(`  - Rôles: ${rolesCount}`);
  console.log(`  - Permissions: ${permissionsCount}`);
  console.log(`  - Associations: ${rolePermissionsCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
