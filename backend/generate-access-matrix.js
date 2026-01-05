/**
 * Generate Access Matrix Documentation
 * Produces a readable table of roles and permissions
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('Generating Access Matrix Documentation...\n');

  // Get all roles with their permissions
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: { select: { users: true } },
    },
    orderBy: { code: 'asc' },
  });

  // Get all permissions grouped by module
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { code: 'asc' }],
  });

  // Group permissions by module
  const permissionsByModule = {};
  for (const perm of permissions) {
    if (!permissionsByModule[perm.module]) {
      permissionsByModule[perm.module] = [];
    }
    permissionsByModule[perm.module].push(perm);
  }

  // Generate markdown output
  let markdown = `# Matrice des Droits d'Acces - CDMT

*Generated on: ${new Date().toISOString().split('T')[0]}*

## Resume des Roles

| Code | Nom | Description | Utilisateurs | Permissions |
|------|-----|-------------|--------------|-------------|
`;

  for (const role of roles) {
    markdown += `| ${role.code} | ${role.name} | ${role.description || '-'} | ${role._count.users} | ${role.permissions.length} |\n`;
  }

  markdown += `
## Matrice des Permissions par Module

### Legende
- ✓ : Acces complet
- ○ : Acces partiel
- ✗ : Pas d'acces

`;

  // Role abbreviations for table headers
  const roleAbbrevs = {
    'ADMIN_SYSTEM': 'ADMIN',
    'DIR_BUDGET': 'BUDGET',
    'DIR_PLANIFICATION': 'PLANIF',
    'MINISTRY': 'MINIST',
    'DIR_DETTE': 'DETTE',
    'DIR_SOLDE': 'SOLDE',
    'PTF': 'PTF',
  };

  // Generate table for each module
  for (const [module, perms] of Object.entries(permissionsByModule)) {
    markdown += `### Module: ${module}\n\n`;
    markdown += `| Permission | ${roles.map(r => roleAbbrevs[r.code] || r.code).join(' | ')} |\n`;
    markdown += `|------------|${roles.map(() => '------').join('|')}|\n`;

    for (const perm of perms) {
      const row = [perm.code.replace(`${module}:`, '')];
      for (const role of roles) {
        const hasPermission = role.permissions.some(rp => rp.permissionId === perm.id);
        row.push(hasPermission ? '✓' : '✗');
      }
      markdown += `| ${row.join(' | ')} |\n`;
    }
    markdown += '\n';
  }

  // Summary statistics
  markdown += `## Statistiques

- **Total des roles**: ${roles.length}
- **Total des permissions**: ${permissions.length}
- **Modules couverts**: ${Object.keys(permissionsByModule).length}

## Details des Roles

`;

  for (const role of roles) {
    markdown += `### ${role.name} (${role.code})

**Description**: ${role.description || 'N/A'}

**Permissions (${role.permissions.length})**:
`;

    // Group this role's permissions by module
    const rolePermsByModule = {};
    for (const rp of role.permissions) {
      const module = rp.permission.module;
      if (!rolePermsByModule[module]) {
        rolePermsByModule[module] = [];
      }
      rolePermsByModule[module].push(rp.permission);
    }

    for (const [module, perms] of Object.entries(rolePermsByModule)) {
      markdown += `- **${module}**: ${perms.map(p => p.code.replace(`${module}:`, '')).join(', ')}\n`;
    }
    markdown += '\n';
  }

  // Write to file
  fs.writeFileSync('access-matrix.md', markdown);
  console.log('Access matrix documentation generated: access-matrix.md');

  // Also output a summary
  console.log('\n=== SUMMARY ===');
  console.log('Total Roles:', roles.length);
  console.log('Total Permissions:', permissions.length);
  console.log('Modules:', Object.keys(permissionsByModule).join(', '));
  console.log('\nRole Statistics:');
  for (const role of roles) {
    console.log(`  ${role.code}: ${role.permissions.length} permissions, ${role._count.users} user(s)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
