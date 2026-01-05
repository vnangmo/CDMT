const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('sectoral_measures', 'action_plans', 'action_plan_activities')
      ORDER BY table_name
    `;

    console.log('Sprint 5.3 Tables Check:');
    console.log('========================');

    if (tables.length === 0) {
      console.log('✗ Sprint 5.3 tables NOT FOUND in database');
      console.log('  Expected: sectoral_measures, action_plans, action_plan_activities');
      console.log('  Found: 0 tables');
    } else {
      console.log(`✓ Found ${tables.length}/3 Sprint 5.3 tables:`);
      tables.forEach(t => console.log(`  - ${t.table_name}`));

      if (tables.length < 3) {
        const found = tables.map(t => t.table_name);
        const missing = ['sectoral_measures', 'action_plans', 'action_plan_activities'].filter(t => !found.includes(t));
        console.log('\n✗ Missing tables:', missing.join(', '));
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking tables:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTables();
