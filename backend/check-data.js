const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const ministries = await prisma.ministry.count();
    const users = await prisma.user.count();
    const axes = await prisma.strategicAxis.count();
    const natures = await prisma.economicNature.count();
    const sources = await prisma.fundingSource.count();
    const years = await prisma.fiscalYear.count();

    console.log('=== DATABASE RECORD COUNTS ===');
    console.log('Ministries:', ministries);
    console.log('Users:', users);
    console.log('Strategic Axes:', axes);
    console.log('Economic Natures:', natures);
    console.log('Funding Sources:', sources);
    console.log('Fiscal Years:', years);

    // Show some sample data
    if (ministries > 0) {
      const sampleMinistries = await prisma.ministry.findMany({ take: 3 });
      console.log('\nSample Ministries:');
      sampleMinistries.forEach(m => console.log(`  - ${m.code}: ${m.name}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
