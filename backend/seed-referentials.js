const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedReferentials() {
  try {
    console.log('🌱 Seeding referential data...\n');

    // 1. Axes Stratégiques
    console.log('Creating Strategic Axes...');
    const axes = await Promise.all([
      prisma.strategicAxis.upsert({
        where: { code: 'AS1' },
        update: {},
        create: {
          code: 'AS1',
          name: 'Renforcement de la gouvernance',
          description: 'Amélioration de la transparence et de la redevabilité',
          isActive: true,
        },
      }),
      prisma.strategicAxis.upsert({
        where: { code: 'AS2' },
        update: {},
        create: {
          code: 'AS2',
          name: 'Développement du capital humain',
          description: 'Éducation, santé et protection sociale',
          isActive: true,
        },
      }),
      prisma.strategicAxis.upsert({
        where: { code: 'AS3' },
        update: {},
        create: {
          code: 'AS3',
          name: 'Croissance économique inclusive',
          description: 'Diversification économique et création d\'emplois',
          isActive: true,
        },
      }),
      prisma.strategicAxis.upsert({
        where: { code: 'AS4' },
        update: {},
        create: {
          code: 'AS4',
          name: 'Infrastructure et aménagement du territoire',
          description: 'Développement des infrastructures de base',
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${axes.length} strategic axes\n`);

    // 2. Natures Économiques
    console.log('Creating Economic Natures...');
    const natures = await Promise.all([
      prisma.economicNature.upsert({
        where: { code: 'NE-R-01' },
        update: {},
        create: {
          code: 'NE-R-01',
          name: 'Impôts sur les revenus',
          type: 'REVENUE',
          description: 'Recettes fiscales sur les revenus des personnes et sociétés',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-R-02' },
        update: {},
        create: {
          code: 'NE-R-02',
          name: 'Droits de douane',
          type: 'REVENUE',
          description: 'Recettes douanières',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-R-03' },
        update: {},
        create: {
          code: 'NE-R-03',
          name: 'Taxes sur biens et services',
          type: 'REVENUE',
          description: 'TVA et autres taxes',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-D-01' },
        update: {},
        create: {
          code: 'NE-D-01',
          name: 'Salaires et traitements',
          type: 'EXPENSE',
          description: 'Rémunérations du personnel',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-D-02' },
        update: {},
        create: {
          code: 'NE-D-02',
          name: 'Biens et services',
          type: 'EXPENSE',
          description: 'Achats de biens et services',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-D-03' },
        update: {},
        create: {
          code: 'NE-D-03',
          name: 'Transferts courants',
          type: 'EXPENSE',
          description: 'Subventions et transferts',
          isActive: true,
        },
      }),
      prisma.economicNature.upsert({
        where: { code: 'NE-D-04' },
        update: {},
        create: {
          code: 'NE-D-04',
          name: 'Investissements',
          type: 'EXPENSE',
          description: 'Dépenses d\'investissement',
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${natures.length} economic natures\n`);

    // 3. Sources de Financement
    console.log('Creating Funding Sources...');
    const sources = await Promise.all([
      prisma.fundingSource.upsert({
        where: { code: 'SF-INT-01' },
        update: {},
        create: {
          code: 'SF-INT-01',
          name: 'Budget Général de l\'État',
          type: 'INTERNAL',
          description: 'Ressources propres du budget national',
          isActive: true,
        },
      }),
      prisma.fundingSource.upsert({
        where: { code: 'SF-EXT-01' },
        update: {},
        create: {
          code: 'SF-EXT-01',
          name: 'Banque Mondiale',
          type: 'LOAN',
          description: 'Financement de la Banque Mondiale',
          isActive: true,
        },
      }),
      prisma.fundingSource.upsert({
        where: { code: 'SF-EXT-02' },
        update: {},
        create: {
          code: 'SF-EXT-02',
          name: 'Banque Africaine de Développement',
          type: 'LOAN',
          description: 'Financement de la BAD',
          isActive: true,
        },
      }),
      prisma.fundingSource.upsert({
        where: { code: 'SF-GRANT-01' },
        update: {},
        create: {
          code: 'SF-GRANT-01',
          name: 'Union Européenne',
          type: 'GRANT',
          description: 'Dons et subventions de l\'UE',
          isActive: true,
        },
      }),
      prisma.fundingSource.upsert({
        where: { code: 'SF-GRANT-02' },
        update: {},
        create: {
          code: 'SF-GRANT-02',
          name: 'Coopération Française',
          type: 'GRANT',
          description: 'Aide au développement de la France',
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${sources.length} funding sources\n`);

    // 4. Années Fiscales
    console.log('Creating Fiscal Years...');
    const years = await Promise.all([
      prisma.fiscalYear.upsert({
        where: { year: 2024 },
        update: {},
        create: {
          year: 2024,
          name: 'Année Fiscale 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isClosed: true,
          isActive: true,
        },
      }),
      prisma.fiscalYear.upsert({
        where: { year: 2025 },
        update: {},
        create: {
          year: 2025,
          name: 'Année Fiscale 2025',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          isClosed: false,
          isActive: true,
        },
      }),
      prisma.fiscalYear.upsert({
        where: { year: 2026 },
        update: {},
        create: {
          year: 2026,
          name: 'Année Fiscale 2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isClosed: false,
          isActive: true,
        },
      }),
      prisma.fiscalYear.upsert({
        where: { year: 2027 },
        update: {},
        create: {
          year: 2027,
          name: 'Année Fiscale 2027',
          startDate: new Date('2027-01-01'),
          endDate: new Date('2027-12-31'),
          isClosed: false,
          isActive: true,
        },
      }),
    ]);
    console.log(`✓ Created ${years.length} fiscal years\n`);

    console.log('✅ Referential data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding referential data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedReferentials();
