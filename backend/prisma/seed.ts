import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // ============================================
  // 1. ROLES
  // ============================================
  console.log('📝 Création des rôles...');

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrateur Système',
      description: 'Accès complet à toute la plateforme',
      isActive: true,
    },
  });

  const budgetDirectorRole = await prisma.role.upsert({
    where: { code: 'DIR_BUDGET' },
    update: {},
    create: {
      code: 'DIR_BUDGET',
      name: 'Direction du Budget',
      description: 'Pilotage du processus CDMT, élaboration CBMT et CDMT Global',
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { code: 'DIR_PLANNING' },
    update: {},
    create: {
      code: 'DIR_PLANNING',
      name: 'Direction de la Planification',
      description: 'Suivi de la cohérence avec les stratégies nationales',
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { code: 'MINISTRY' },
    update: {},
    create: {
      code: 'MINISTRY',
      name: 'Ministère Sectoriel',
      description: 'Élaboration des CDMT Sectoriels',
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { code: 'DIR_DEBT' },
    update: {},
    create: {
      code: 'DIR_DEBT',
      name: 'Direction de la Dette',
      description: 'Saisie des projections du service de la dette',
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { code: 'DIR_PAYROLL' },
    update: {},
    create: {
      code: 'DIR_PAYROLL',
      name: 'Direction de la Solde',
      description: 'Projection de la masse salariale',
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { code: 'PTF' },
    update: {},
    create: {
      code: 'PTF',
      name: 'Partenaire Technique et Financier',
      description: 'Consultation uniquement',
      isActive: true,
    },
  });

  console.log('✅ 7 rôles créés');

  // ============================================
  // 2. PERMISSIONS
  // ============================================
  console.log('📝 Création des permissions...');

  const permissions = [
    // Gestion système
    { code: 'SYSTEM_CONFIG', name: 'Configuration système', module: 'system' },
    { code: 'USER_MANAGE', name: 'Gestion des utilisateurs', module: 'system' },

    // Cadre macroéconomique
    { code: 'MACRO_CREATE', name: 'Créer cadre macro', module: 'macro' },
    { code: 'MACRO_READ', name: 'Consulter cadre macro', module: 'macro' },
    { code: 'MACRO_UPDATE', name: 'Modifier cadre macro', module: 'macro' },
    { code: 'MACRO_DELETE', name: 'Supprimer cadre macro', module: 'macro' },

    // CBMT
    { code: 'CBMT_CREATE', name: 'Créer CBMT', module: 'cbmt' },
    { code: 'CBMT_READ', name: 'Consulter CBMT', module: 'cbmt' },
    { code: 'CBMT_UPDATE', name: 'Modifier CBMT', module: 'cbmt' },
    { code: 'CBMT_DELETE', name: 'Supprimer CBMT', module: 'cbmt' },
    { code: 'CBMT_VALIDATE', name: 'Valider CBMT', module: 'cbmt' },

    // CDMT Global
    { code: 'CDMT_GLOBAL_CREATE', name: 'Créer CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_READ', name: 'Consulter CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_UPDATE', name: 'Modifier CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_DELETE', name: 'Supprimer CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_VALIDATE', name: 'Valider CDMT Global', module: 'cdmt_global' },

    // CDMT Sectoriel
    { code: 'CDMT_SECTORAL_CREATE', name: 'Créer CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_READ', name: 'Consulter CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_UPDATE', name: 'Modifier CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_DELETE', name: 'Supprimer CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_VALIDATE', name: 'Valider CDMT Sectoriel', module: 'cdmt_sectoral' },

    // Référentiels
    { code: 'REF_CREATE', name: 'Créer référentiels', module: 'referential' },
    { code: 'REF_READ', name: 'Consulter référentiels', module: 'referential' },
    { code: 'REF_UPDATE', name: 'Modifier référentiels', module: 'referential' },
    { code: 'REF_DELETE', name: 'Supprimer référentiels', module: 'referential' },

    // Reporting
    { code: 'REPORT_GENERATE', name: 'Générer rapports', module: 'reporting' },
    { code: 'REPORT_EXPORT', name: 'Exporter rapports', module: 'reporting' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  console.log(`✅ ${permissions.length} permissions créées`);

  // ============================================
  // 3. MINISTÈRES (quelques exemples)
  // ============================================
  console.log('📝 Création des ministères...');

  const ministries = [
    {
      code: 'MEF',
      name: 'Ministère de l\'Économie et des Finances',
      nameEn: 'Ministry of Economy and Finance',
      nameAr: 'وزارة الاقتصاد والمالية',
      isPriority: true,
    },
    {
      code: 'MENESFTP',
      name: 'Ministère de l\'Éducation Nationale et de la Formation Professionnelle',
      nameEn: 'Ministry of National Education and Vocational Training',
      nameAr: 'وزارة التربية الوطنية والتكوين المهني',
      isPriority: true,
    },
    {
      code: 'MS',
      name: 'Ministère de la Santé',
      nameEn: 'Ministry of Health',
      nameAr: 'وزارة الصحة',
      isPriority: true,
    },
    {
      code: 'MEHE',
      name: 'Ministère de l\'Équipement et de l\'Habitat',
      nameEn: 'Ministry of Equipment and Housing',
      nameAr: 'وزارة التجهيز والإسكان',
      isPriority: false,
    },
    {
      code: 'MAEM',
      name: 'Ministère de l\'Agriculture, de l\'Eau et de la Mer',
      nameEn: 'Ministry of Agriculture, Water and Sea',
      nameAr: 'وزارة الزراعة والمياه والبحر',
      isPriority: false,
    },
  ];

  const createdMinistries = [];
  for (const ministry of ministries) {
    const created = await prisma.ministry.upsert({
      where: { code: ministry.code },
      update: {},
      create: ministry,
    });
    createdMinistries.push(created);
  }

  console.log(`✅ ${ministries.length} ministères créés`);

  // ============================================
  // 4. UTILISATEURS
  // ============================================
  console.log('📝 Création des utilisateurs...');

  const hashedPassword = await bcrypt.hash('Admin@2026', 10);

  await prisma.user.upsert({
    where: { email: 'admin@finances.dj' },
    update: {},
    create: {
      email: 'admin@finances.dj',
      password: hashedPassword,
      firstName: 'Administrateur',
      lastName: 'Système',
      phone: '+253 21 35 00 00',
      isActive: true,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Utilisateur admin créé (email: admin@finances.dj, password: Admin@2026)');

  // Utilisateur Direction du Budget
  await prisma.user.upsert({
    where: { email: 'budget@finances.dj' },
    update: {},
    create: {
      email: 'budget@finances.dj',
      password: hashedPassword,
      firstName: 'Direction',
      lastName: 'du Budget',
      phone: '+253 21 35 00 01',
      isActive: true,
      roleId: budgetDirectorRole.id,
    },
  });

  console.log('✅ Utilisateur Direction du Budget créé (email: budget@finances.dj)');

  // ============================================
  // 5. CATÉGORIES ÉCONOMIQUES (quelques exemples)
  // ============================================
  console.log('📝 Création des catégories économiques...');

  await prisma.economicCategory.upsert({
    where: { code: 'T1' },
    update: {},
    create: {
      code: 'T1',
      name: 'Personnel',
      nameEn: 'Personnel',
      nameAr: 'الموظفون',
      level: 1,
    },
  });

  await prisma.economicCategory.upsert({
    where: { code: 'T2' },
    update: {},
    create: {
      code: 'T2',
      name: 'Biens et Services',
      nameEn: 'Goods and Services',
      nameAr: 'السلع والخدمات',
      level: 1,
    },
  });

  await prisma.economicCategory.upsert({
    where: { code: 'T3' },
    update: {},
    create: {
      code: 'T3',
      name: 'Transferts et Subventions',
      nameEn: 'Transfers and Subsidies',
      nameAr: 'التحويلات والإعانات',
      level: 1,
    },
  });

  await prisma.economicCategory.upsert({
    where: { code: 'T4' },
    update: {},
    create: {
      code: 'T4',
      name: 'Investissements',
      nameEn: 'Investments',
      nameAr: 'الاستثمارات',
      level: 1,
    },
  });

  console.log('✅ 4 catégories économiques créées');

  // ============================================
  // 6. SOURCES DE FINANCEMENT
  // ============================================
  console.log('📝 Création des sources de financement...');

  const financingSources = [
    { code: 'RI', name: 'Ressources Internes', type: 'INTERNAL' },
    { code: 'RE', name: 'Ressources Externes', type: 'EXTERNAL' },
    { code: 'PRET', name: 'Prêts', type: 'LOAN' },
    { code: 'DON', name: 'Dons', type: 'GRANT' },
  ];

  for (const source of financingSources) {
    await prisma.financingSource.upsert({
      where: { code: source.code },
      update: {},
      create: source,
    });
  }

  console.log('✅ 4 sources de financement créées');

  // ============================================
  // 7. ÉTATS DU WORKFLOW
  // ============================================
  console.log('📝 Création des états du workflow...');

  const workflowStates = [
    { code: 'DRAFT', name: 'Brouillon', order: 1 },
    { code: 'SUBMITTED', name: 'Soumis', order: 2 },
    { code: 'UNDER_REVIEW', name: 'En révision', order: 3 },
    { code: 'VALIDATED', name: 'Validé', order: 4 },
    { code: 'REJECTED', name: 'Rejeté', order: 5 },
    { code: 'ARCHIVED', name: 'Archivé', order: 6 },
  ];

  for (const state of workflowStates) {
    await prisma.workflowState.upsert({
      where: { code: state.code },
      update: {},
      create: state,
    });
  }

  console.log('✅ 6 états de workflow créés');

  // ============================================
  // 8. ANNÉE BUDGÉTAIRE
  // ============================================
  console.log('📝 Création de l\'année budgétaire...');

  await prisma.budgetYear.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      label: '2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Année budgétaire 2026 créée');

  console.log('\n✅ Seeding terminé avec succès!');
  console.log('\n📊 Résumé:');
  console.log('  - 7 rôles');
  console.log(`  - ${permissions.length} permissions`);
  console.log(`  - ${ministries.length} ministères`);
  console.log('  - 2 utilisateurs');
  console.log('  - 4 catégories économiques');
  console.log('  - 4 sources de financement');
  console.log('  - 6 états de workflow');
  console.log('  - 1 année budgétaire\n');
  console.log('🔑 Credentials admin:');
  console.log('  Email: admin@finances.dj');
  console.log('  Password: Admin@2026\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
