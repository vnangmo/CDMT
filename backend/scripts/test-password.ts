import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testPassword = 'Password123!';
  const email = 'budget@finances.dj';

  console.log('🔐 Test de vérification du mot de passe\n');
  console.log(`Email: ${email}`);
  console.log(`Password testé: ${testPassword}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ Utilisateur non trouvé');
    return;
  }

  console.log('✓ Utilisateur trouvé');
  console.log(`  ID: ${user.id}`);
  console.log(`  Nom: ${user.firstName} ${user.lastName}`);
  console.log(`  Hash stocké (premiers 20 chars): ${user.password.substring(0, 20)}...\n`);

  // Tester le mot de passe
  const isValid = await bcrypt.compare(testPassword, user.password);

  if (isValid) {
    console.log('✅ Mot de passe valide!');
  } else {
    console.log('❌ Mot de passe invalide');

    // Générer un nouveau hash pour comparaison
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`\nNouveau hash généré (premiers 20 chars): ${newHash.substring(0, 20)}...`);
    console.log('Si différent, cela suggère que le hash en DB n\'est pas celui attendu.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
