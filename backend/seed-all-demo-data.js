const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllDemoData() {
  try {
    console.log('🌱 Seeding all demonstration data...\n');

    // Vérifier les ministères existants
    const ministries = await prisma.ministry.findMany();
    console.log(`✓ Found ${ministries.length} ministries\n`);

    // Ajouter plus de programmes
    console.log('Creating Programs...');
    const programs = await Promise.all([
      prisma.program.upsert({
        where: { code: 'PROG-EDU-001' },
        update: {},
        create: {
          code: 'PROG-EDU-001',
          name: 'Enseignement Primaire',
          description: 'Programme d\'enseignement primaire universel',
          ministryId: ministries.find(m => m.code === 'MENESFTP')?.id || ministries[0].id,
          isActive: true,
        },
      }),
      prisma.program.upsert({
        where: { code: 'PROG-EDU-002' },
        update: {},
        create: {
          code: 'PROG-EDU-002',
          name: 'Enseignement Secondaire',
          description: 'Développement de l\'enseignement secondaire',
          ministryId: ministries.find(m => m.code === 'MENESFTP')?.id || ministries[0].id,
          isActive: true,
        },
      }),
      prisma.program.upsert({
        where: { code: 'PROG-AGR-001' },
        update: {},
        create: {
          code: 'PROG-AGR-001',
          name: 'Développement Agricole',
          description: 'Modernisation et développement du secteur agricole',
          ministryId: ministries.find(m => m.code === 'MAEM')?.id || ministries[1].id,
          isActive: true,
        },
      }),
      prisma.program.upsert({
        where: { code: 'PROG-EAU-001' },
        update: {},
        create: {
          code: 'PROG-EAU-001',
          name: 'Ressources en Eau',
          description: 'Gestion durable des ressources en eau',
          ministryId: ministries.find(m => m.code === 'MAEM')?.id || ministries[1].id,
          isActive: true,
        },
      }),
      prisma.program.upsert({
        where: { code: 'PROG-FIN-001' },
        update: {},
        create: {
          code: 'PROG-FIN-001',
          name: 'Gestion des Finances Publiques',
          description: 'Modernisation de la gestion des finances publiques',
          ministryId: ministries.find(m => m.code === 'MEF')?.id || ministries[2].id,
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${programs.length} programs\n`);

    // Ajouter plus de classifications fonctionnelles
    console.log('Creating Functional Classifications...');
    const classifications = await Promise.all([
      prisma.functionalClassification.upsert({
        where: { code: 'FC-01' },
        update: {},
        create: {
          code: 'FC-01',
          name: 'Services généraux des administrations publiques',
          description: 'Fonctions exécutives et législatives',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-02' },
        update: {},
        create: {
          code: 'FC-02',
          name: 'Défense',
          description: 'Défense militaire et civile',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-03' },
        update: {},
        create: {
          code: 'FC-03',
          name: 'Ordre et sécurité publics',
          description: 'Police, tribunaux et prisons',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-04' },
        update: {},
        create: {
          code: 'FC-04',
          name: 'Affaires économiques',
          description: 'Agriculture, industrie, commerce',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-05' },
        update: {},
        create: {
          code: 'FC-05',
          name: 'Protection de l\'environnement',
          description: 'Gestion des déchets, lutte contre la pollution',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-06' },
        update: {},
        create: {
          code: 'FC-06',
          name: 'Logements et équipements collectifs',
          description: 'Logements, eau, éclairage public',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-07' },
        update: {},
        create: {
          code: 'FC-07',
          name: 'Santé',
          description: 'Services hospitaliers et de santé publique',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-08' },
        update: {},
        create: {
          code: 'FC-08',
          name: 'Loisirs, culture et culte',
          description: 'Services culturels et récréatifs',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-09' },
        update: {},
        create: {
          code: 'FC-09',
          name: 'Enseignement',
          description: 'Enseignement préscolaire à supérieur',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
      prisma.functionalClassification.upsert({
        where: { code: 'FC-10' },
        update: {},
        create: {
          code: 'FC-10',
          name: 'Protection sociale',
          description: 'Maladie, vieillesse, famille et enfants',
          parentId: null,
          level: 1,
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${classifications.length} functional classifications\n`);

    // Ajouter plus de catégories économiques
    console.log('Creating Economic Categories...');
    const categories = await Promise.all([
      prisma.economicCategory.upsert({
        where: { code: 'CAT-R-01' },
        update: {},
        create: {
          code: 'CAT-R-01',
          name: 'Recettes fiscales',
          type: 'REVENUE',
          description: 'Impôts et taxes',
          isActive: true,
        },
      }),
      prisma.economicCategory.upsert({
        where: { code: 'CAT-R-02' },
        update: {},
        create: {
          code: 'CAT-R-02',
          name: 'Recettes non fiscales',
          type: 'REVENUE',
          description: 'Revenus du domaine, amendes',
          isActive: true,
        },
      }),
      prisma.economicCategory.upsert({
        where: { code: 'CAT-D-01' },
        update: {},
        create: {
          code: 'CAT-D-01',
          name: 'Dépenses de personnel',
          type: 'EXPENSE',
          description: 'Salaires et charges sociales',
          isActive: true,
        },
      }),
      prisma.economicCategory.upsert({
        where: { code: 'CAT-D-02' },
        update: {},
        create: {
          code: 'CAT-D-02',
          name: 'Dépenses de fonctionnement',
          type: 'EXPENSE',
          description: 'Biens et services',
          isActive: true,
        },
      }),
      prisma.economicCategory.upsert({
        where: { code: 'CAT-D-03' },
        update: {},
        create: {
          code: 'CAT-D-03',
          name: 'Dépenses d\'investissement',
          type: 'EXPENSE',
          description: 'Acquisitions et travaux',
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${categories.length} economic categories\n`);

    // Ajouter plus de sources de financement
    console.log('Creating Financing Sources...');
    const financingSources = await Promise.all([
      prisma.financingSource.upsert({
        where: { code: 'FIN-NAT' },
        update: {},
        create: {
          code: 'FIN-NAT',
          name: 'Budget National',
          type: 'INTERNAL',
          description: 'Ressources du Trésor Public',
          isActive: true,
        },
      }),
      prisma.financingSource.upsert({
        where: { code: 'FIN-BM' },
        update: {},
        create: {
          code: 'FIN-BM',
          name: 'Banque Mondiale',
          type: 'EXTERNAL',
          description: 'Financement Banque Mondiale',
          isActive: true,
        },
      }),
      prisma.financingSource.upsert({
        where: { code: 'FIN-BAD' },
        update: {},
        create: {
          code: 'FIN-BAD',
          name: 'BAD',
          type: 'EXTERNAL',
          description: 'Banque Africaine de Développement',
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${financingSources.length} financing sources\n`);

    // Récapitulatif final
    console.log('📊 Final Database Summary:');
    const [
      ministeriesCount,
      programsCount,
      classificationsCount,
      categoriesCount,
      financingCount,
      axesCount,
      naturesCount,
      fundingCount,
      yearsCount,
    ] = await Promise.all([
      prisma.ministry.count(),
      prisma.program.count(),
      prisma.functionalClassification.count(),
      prisma.economicCategory.count(),
      prisma.financingSource.count(),
      prisma.strategicAxis.count(),
      prisma.economicNature.count(),
      prisma.fundingSource.count(),
      prisma.fiscalYear.count(),
    ]);

    console.log(`  Ministries: ${ministeriesCount}`);
    console.log(`  Programs: ${programsCount}`);
    console.log(`  Functional Classifications: ${classificationsCount}`);
    console.log(`  Economic Categories: ${categoriesCount}`);
    console.log(`  Financing Sources: ${financingCount}`);
    console.log(`  Strategic Axes: ${axesCount}`);
    console.log(`  Economic Natures: ${naturesCount}`);
    console.log(`  Funding Sources: ${fundingCount}`);
    console.log(`  Fiscal Years: ${yearsCount}`);

    console.log('\n✅ All demonstration data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAllDemoData();
