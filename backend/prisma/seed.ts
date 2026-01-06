import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding avec données réelles Djibouti 2026-2028...\n');

  // ============================================
  // 0. NETTOYAGE DE LA BASE DE DONNÉES
  // ============================================
  console.log('🧹 Nettoyage des données existantes...');

  // Supprimer dans l'ordre inverse des dépendances
  await prisma.tOFELine.deleteMany({});
  await prisma.tOFEDocument.deleteMany({});
  await prisma.cBMTAnalysis.deleteMany({});
  await prisma.cBMTReserve.deleteMany({});
  await prisma.cBMTAggregate.deleteMany({});
  await prisma.cBMTDocument.deleteMany({});
  await prisma.trendBudgetConfig.deleteMany({});
  await prisma.ministerialCeiling.deleteMany({});
  await prisma.cDMTGlobalScenario.deleteMany({});
  await prisma.marginAllocation.deleteMany({});
  await prisma.policyMeasure.deleteMany({});
  await prisma.pIPProject.deleteMany({});
  await prisma.pIEProject.deleteMany({});
  await prisma.trendProjection.deleteMany({});
  await prisma.historicalBudget.deleteMany({});
  await prisma.sectoralMeasure.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.actionPlanActivity.deleteMany({});
  await prisma.actionPlan.deleteMany({});
  await prisma.cdmtSectoralDocument.deleteMany({});
  await prisma.indicator.deleteMany({});
  await prisma.objective.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.action.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.workflowHistory.deleteMany({});
  await prisma.workflowState.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.baselineBudget.deleteMany({});
  await prisma.expenseProjection.deleteMany({});
  await prisma.revenueProjection.deleteMany({});
  await prisma.macroFramework.deleteMany({});
  await prisma.budgetYear.deleteMany({});
  await prisma.functionalClassification.deleteMany({});
  await prisma.financingSource.deleteMany({});
  await prisma.economicCategory.deleteMany({});
  await prisma.ministry.deleteMany({});
  await prisma.economicNature.deleteMany({});
  await prisma.fundingSource.deleteMany({});
  await prisma.strategicAxis.deleteMany({});
  await prisma.fiscalYear.deleteMany({});

  console.log('✅ Base de données nettoyée\n');

  // ============================================
  // 1. ROLES (7 profils utilisateurs)
  // ============================================
  console.log('📝 Création des 7 rôles/profils utilisateurs...');

  // 1. Administrateur Système
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: { name: 'Administrateur Système', description: 'Gestion complète de la plateforme, configuration des paramètres généraux, gestion des utilisateurs et des droits' },
    create: { code: 'ADMIN', name: 'Administrateur Système', description: 'Gestion complète de la plateforme, configuration des paramètres généraux, gestion des utilisateurs et des droits', isActive: true },
  });

  // 2. Direction du Budget (Ministère des Finances)
  const budgetDirectorRole = await prisma.role.upsert({
    where: { code: 'DIR_BUDGET' },
    update: { name: 'Direction du Budget', description: 'Pilotage CDMT, cadrage macro, CBMT et CDMT Global, plafonds ministériels, validation CDMT Sectoriels' },
    create: { code: 'DIR_BUDGET', name: 'Direction du Budget', description: 'Pilotage CDMT, cadrage macro, CBMT et CDMT Global, plafonds ministériels, validation CDMT Sectoriels', isActive: true },
  });

  // 3. Direction de la Planification
  const planningDirectorRole = await prisma.role.upsert({
    where: { code: 'DIR_PLAN' },
    update: { name: 'Direction de la Planification', description: 'Cohérence stratégies nationales, validation programmes et actions, consolidation plans d action' },
    create: { code: 'DIR_PLAN', name: 'Direction de la Planification', description: 'Cohérence stratégies nationales, validation programmes et actions, consolidation plans d action', isActive: true },
  });

  // 4. Ministères et Institutions Sectoriels
  const ministryRole = await prisma.role.upsert({
    where: { code: 'MINISTRY' },
    update: { name: 'Ministère Sectoriel', description: 'CDMT Sectoriels, plans d action, programmes et projets, mesures nouvelles' },
    create: { code: 'MINISTRY', name: 'Ministère Sectoriel', description: 'CDMT Sectoriels, plans d action, programmes et projets, mesures nouvelles', isActive: true },
  });

  // 5. Direction de la Dette
  const debtDirectorRole = await prisma.role.upsert({
    where: { code: 'DIR_DEBT' },
    update: { name: 'Direction de la Dette', description: 'Projections service de la dette, suivi engagements financiers' },
    create: { code: 'DIR_DEBT', name: 'Direction de la Dette', description: 'Projections service de la dette, suivi engagements financiers', isActive: true },
  });

  // 6. Direction de la Solde
  const salaryDirectorRole = await prisma.role.upsert({
    where: { code: 'DIR_SOLDE' },
    update: { name: 'Direction de la Solde', description: 'Projection masse salariale, hypothèses effectifs et rémunérations' },
    create: { code: 'DIR_SOLDE', name: 'Direction de la Solde', description: 'Projection masse salariale, hypothèses effectifs et rémunérations', isActive: true },
  });

  // 7. Partenaires Techniques et Financiers (PTF)
  const ptfRole = await prisma.role.upsert({
    where: { code: 'PTF' },
    update: { name: 'Partenaire Technique et Financier', description: 'Lecture documents validés, consultation programmations pluriannuelles' },
    create: { code: 'PTF', name: 'Partenaire Technique et Financier', description: 'Lecture documents validés, consultation programmations pluriannuelles', isActive: true },
  });

  console.log('✅ 7 rôles créés');

  // ============================================
  // 2. PERMISSIONS
  // ============================================
  console.log('📝 Création des permissions...');

    const permissions = [
    // Système
    { code: 'SYSTEM_CONFIG', name: 'Configuration système', module: 'system' },
    { code: 'USER_MANAGE', name: 'Gestion des utilisateurs', module: 'system' },
    // Cadre macroéconomique
    { code: 'MACRO_CREATE', name: 'Créer cadre macro', module: 'macro' },
    { code: 'MACRO_READ', name: 'Consulter cadre macro', module: 'macro' },
    { code: 'MACRO_UPDATE', name: 'Modifier cadre macro', module: 'macro' },
    // CBMT
    { code: 'CBMT_CREATE', name: 'Créer CBMT', module: 'cbmt' },
    { code: 'CBMT_READ', name: 'Consulter CBMT', module: 'cbmt' },
    { code: 'CBMT_UPDATE', name: 'Modifier CBMT', module: 'cbmt' },
    { code: 'CBMT_VALIDATE', name: 'Valider CBMT', module: 'cbmt' },
    // CDMT Global
    { code: 'CDMT_GLOBAL_CREATE', name: 'Créer CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_READ', name: 'Consulter CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_UPDATE', name: 'Modifier CDMT Global', module: 'cdmt_global' },
    { code: 'CDMT_GLOBAL_VALIDATE', name: 'Valider CDMT Global', module: 'cdmt_global' },
    // CDMT Sectoriel
    { code: 'CDMT_SECTORAL_CREATE', name: 'Créer CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_READ', name: 'Consulter CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_UPDATE', name: 'Modifier CDMT Sectoriel', module: 'cdmt_sectoral' },
    { code: 'CDMT_SECTORAL_VALIDATE', name: 'Valider CDMT Sectoriel', module: 'cdmt_sectoral' },
    // Plans d action
    { code: 'ACTION_PLAN_CREATE', name: 'Créer plans d action', module: 'action_plan' },
    { code: 'ACTION_PLAN_READ', name: 'Consulter plans d action', module: 'action_plan' },
    { code: 'ACTION_PLAN_UPDATE', name: 'Modifier plans d action', module: 'action_plan' },
    { code: 'ACTION_PLAN_VALIDATE', name: 'Valider plans d action', module: 'action_plan' },
    // Programmes et Projets
    { code: 'PROGRAM_CREATE', name: 'Créer programmes', module: 'program' },
    { code: 'PROGRAM_READ', name: 'Consulter programmes', module: 'program' },
    { code: 'PROGRAM_UPDATE', name: 'Modifier programmes', module: 'program' },
    { code: 'PROGRAM_VALIDATE', name: 'Valider programmes', module: 'program' },
    // Mesures nouvelles
    { code: 'MEASURE_CREATE', name: 'Proposer mesures nouvelles', module: 'measure' },
    { code: 'MEASURE_READ', name: 'Consulter mesures nouvelles', module: 'measure' },
    { code: 'MEASURE_UPDATE', name: 'Modifier mesures nouvelles', module: 'measure' },
    { code: 'MEASURE_VALIDATE', name: 'Valider mesures nouvelles', module: 'measure' },
    // Masse salariale
    { code: 'SALARY_CREATE', name: 'Saisir projections salariales', module: 'salary' },
    { code: 'SALARY_READ', name: 'Consulter projections salariales', module: 'salary' },
    { code: 'SALARY_UPDATE', name: 'Modifier projections salariales', module: 'salary' },
    // Service de la dette
    { code: 'DEBT_CREATE', name: 'Saisir projections dette', module: 'debt' },
    { code: 'DEBT_READ', name: 'Consulter projections dette', module: 'debt' },
    { code: 'DEBT_UPDATE', name: 'Modifier projections dette', module: 'debt' },
    // Référentiels
    { code: 'REF_CREATE', name: 'Créer référentiels', module: 'referential' },
    { code: 'REF_READ', name: 'Consulter référentiels', module: 'referential' },
    { code: 'REF_UPDATE', name: 'Modifier référentiels', module: 'referential' },
    // Rapports
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
  // 2b. ATTRIBUTION DES PERMISSIONS AUX RÔLES
  // ============================================
  console.log('📝 Attribution des permissions aux rôles...');

  // Récupérer toutes les permissions créées
  const allPermissions = await prisma.permission.findMany();

  // Donner TOUTES les permissions à l'admin avec tous les droits CRUD
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      },
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      },
    });
  }

  // Permissions Direction du Budget (CBMT, CDMT Global, consultation tout)
  const budgetPermCodes = ['MACRO_CREATE', 'MACRO_READ', 'MACRO_UPDATE', 'CBMT_CREATE', 'CBMT_READ', 'CBMT_UPDATE', 'CBMT_VALIDATE', 'CDMT_GLOBAL_CREATE', 'CDMT_GLOBAL_READ', 'CDMT_GLOBAL_UPDATE', 'CDMT_GLOBAL_VALIDATE', 'CDMT_SECTORAL_READ', 'CDMT_SECTORAL_VALIDATE', 'REF_READ', 'REPORT_GENERATE', 'REPORT_EXPORT'];
  for (const code of budgetPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: budgetDirectorRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: budgetDirectorRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  // Permissions Ministère Sectoriel (CDMT Sectoriel, consultation référentiels)
  const ministryPermCodes = ['CDMT_SECTORAL_CREATE', 'CDMT_SECTORAL_READ', 'CDMT_SECTORAL_UPDATE', 'REF_READ', 'REPORT_GENERATE', 'REPORT_EXPORT'];
  for (const code of ministryPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: ministryRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: ministryRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  // Permissions PTF (consultation uniquement)
  const ptfPermCodes = ['MACRO_READ', 'CBMT_READ', 'CDMT_GLOBAL_READ', 'CDMT_SECTORAL_READ', 'REF_READ', 'REPORT_GENERATE'];
  for (const code of ptfPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: ptfRole.id, permissionId: perm.id } },
        update: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
        create: { roleId: ptfRole.id, permissionId: perm.id, canCreate: false, canRead: true, canUpdate: false, canDelete: false },
      });
    }
  }

  // Permissions Direction de la Planification (programmes, actions, cohérence stratégique)
  const planningPermCodes = ['PROGRAM_CREATE', 'PROGRAM_READ', 'PROGRAM_UPDATE', 'PROGRAM_VALIDATE', 'ACTION_PLAN_READ', 'ACTION_PLAN_VALIDATE', 'CDMT_SECTORAL_READ', 'CDMT_GLOBAL_READ', 'REF_READ', 'REPORT_GENERATE', 'REPORT_EXPORT'];
  for (const code of planningPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: planningDirectorRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: planningDirectorRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  // Permissions Direction de la Dette (projections dette, consultation CBMT)
  const debtPermCodes = ['DEBT_CREATE', 'DEBT_READ', 'DEBT_UPDATE', 'CBMT_READ', 'CDMT_GLOBAL_READ', 'REF_READ', 'REPORT_GENERATE'];
  for (const code of debtPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: debtDirectorRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: debtDirectorRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  // Permissions Direction de la Solde (masse salariale, consultation CBMT)
  const salaryPermCodes = ['SALARY_CREATE', 'SALARY_READ', 'SALARY_UPDATE', 'CBMT_READ', 'CDMT_GLOBAL_READ', 'REF_READ', 'REPORT_GENERATE'];
  for (const code of salaryPermCodes) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: salaryDirectorRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: salaryDirectorRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  // Permissions supplémentaires Ministère Sectoriel (plans d'action, programmes, mesures)
  const ministryExtraPerms = ['ACTION_PLAN_CREATE', 'ACTION_PLAN_READ', 'ACTION_PLAN_UPDATE', 'PROGRAM_CREATE', 'PROGRAM_READ', 'PROGRAM_UPDATE', 'MEASURE_CREATE', 'MEASURE_READ', 'MEASURE_UPDATE'];
  for (const code of ministryExtraPerms) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: ministryRole.id, permissionId: perm.id } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
        create: { roleId: ministryRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: false },
      });
    }
  }

  console.log('✅ Permissions attribuées aux 7 rôles');

  // ============================================
  // 3. MINISTÈRES (32 institutions réelles de Djibouti)
  // ============================================
  console.log('📝 Création des 32 ministères/institutions...');

  const ministriesData = [
    { code: 'PRES', name: 'Présidence de la République', nameEn: 'Presidency', isPriority: true },
    { code: 'PRIM', name: 'Primature', nameEn: 'Prime Minister Office', isPriority: true },
    { code: 'MJ', name: 'Ministère de la Justice', nameEn: 'Ministry of Justice', isPriority: false },
    { code: 'MI', name: 'Ministère de l\'Intérieur', nameEn: 'Ministry of Interior', isPriority: true },
    { code: 'MD', name: 'Ministère de la Défense', nameEn: 'Ministry of Defense', isPriority: true },
    { code: 'MAE', name: 'Ministère des Affaires Étrangères', nameEn: 'Ministry of Foreign Affairs', isPriority: false },
    { code: 'MB', name: 'Ministère du Budget', nameEn: 'Ministry of Budget', isPriority: true },
    { code: 'MEF', name: 'Ministère de l\'Économie et des Finances', nameEn: 'Ministry of Economy and Finance', isPriority: true },
    { code: 'MC', name: 'Ministère du Commerce', nameEn: 'Ministry of Commerce', isPriority: false },
    { code: 'MEQI', name: 'Ministère de l\'Équipement et des Infrastructures', nameEn: 'Ministry of Equipment', isPriority: true },
    { code: 'MEN', name: 'Ministère de l\'Éducation Nationale', nameEn: 'Ministry of Education', isPriority: true },
    { code: 'MDEC', name: 'Ministère de la Décentralisation', nameEn: 'Ministry of Decentralization', isPriority: false },
    { code: 'MT', name: 'Ministère du Travail', nameEn: 'Ministry of Labor', isPriority: false },
    { code: 'MINV', name: 'Ministère de l\'Investissement', nameEn: 'Ministry of Investment', isPriority: false },
    { code: 'MS', name: 'Ministère de la Santé', nameEn: 'Ministry of Health', isPriority: true },
    { code: 'MENV', name: 'Ministère de l\'Environnement', nameEn: 'Ministry of Environment', isPriority: false },
    { code: 'MAGR', name: 'Ministère de l\'Agriculture', nameEn: 'Ministry of Agriculture', isPriority: true },
    { code: 'MENER', name: 'Ministère de l\'Énergie', nameEn: 'Ministry of Energy', isPriority: true },
    { code: 'MJC', name: 'Ministère de la Jeunesse et de la Culture', nameEn: 'Ministry of Youth and Culture', isPriority: false },
    { code: 'MCOM', name: 'Ministère de la Communication', nameEn: 'Ministry of Communication', isPriority: false },
    { code: 'MFF', name: 'Ministère de la Femme et de la Famille', nameEn: 'Ministry of Women and Family', isPriority: false },
    { code: 'MAM', name: 'Ministère des Affaires Musulmanes', nameEn: 'Ministry of Muslim Affairs', isPriority: false },
    { code: 'MAS', name: 'Ministère des Affaires Sociales', nameEn: 'Ministry of Social Affairs', isPriority: false },
    { code: 'MESUP', name: 'Ministère de l\'Enseignement Supérieur', nameEn: 'Ministry of Higher Education', isPriority: true },
    { code: 'MVL', name: 'Ministère de la Ville et du Logement', nameEn: 'Ministry of Housing', isPriority: false },
    { code: 'CGP', name: 'Commissariat Général au Plan', nameEn: 'General Planning Commission', isPriority: false },
    { code: 'PP', name: 'Pouvoirs Publics', nameEn: 'Public Powers', isPriority: false },
    { code: 'CR', name: 'Collectivités Régionales', nameEn: 'Regional Authorities', isPriority: false },
    { code: 'CL', name: 'Collectivités Locales', nameEn: 'Local Authorities', isPriority: false },
    { code: 'SES', name: 'Secrétariat d\'État chargé des Sports', nameEn: 'State Secretary for Sports', isPriority: false },
    { code: 'MENI', name: 'Ministère de l\'Économie Numérique et de l\'Innovation', nameEn: 'Ministry of Digital Economy', isPriority: true },
    { code: 'DC', name: 'Dépenses Centralisées', nameEn: 'Centralized Expenditures', isPriority: false },
  ];

  // Enveloppes budgétaires réelles 2028-2030 (en millions FDJ) - Données Excel
  const enveloppesReelles: Record<string, { env_2028: number; env_2029: number; env_2030: number }> = {
    'PRES': { env_2028: 4339.43, env_2029: 1964.29, env_2030: 1965.26 },
    'PRIM': { env_2028: 249.44, env_2029: 113.78, env_2030: 113.84 },
    'MJ': { env_2028: 1068.47, env_2029: 487.37, env_2030: 487.61 },
    'MI': { env_2028: 6096.03, env_2029: 2780.66, env_2030: 2782.03 },
    'MD': { env_2028: 14547.52, env_2029: 6635.74, env_2030: 6639.01 },
    'MAE': { env_2028: 3523.58, env_2029: 1607.26, env_2030: 1608.05 },
    'MB': { env_2028: 20263.31, env_2029: 6221.85, env_2030: 6224.92 },
    'MEF': { env_2028: 1697.85, env_2029: 774.46, env_2030: 774.84 },
    'MC': { env_2028: 316.80, env_2029: 144.51, env_2030: 144.58 },
    'MEQI': { env_2028: 4486.23, env_2029: 2046.36, env_2030: 2047.37 },
    'MEN': { env_2028: 12566.01, env_2029: 5679.30, env_2030: 5682.10 },
    'MDEC': { env_2028: 219.95, env_2029: 100.33, env_2030: 100.38 },
    'MT': { env_2028: 728.72, env_2029: 332.40, env_2030: 332.57 },
    'MINV': { env_2028: 127.22, env_2029: 58.03, env_2030: 58.06 },
    'MS': { env_2028: 8195.15, env_2029: 3738.15, env_2030: 3740.00 },
    'MENV': { env_2028: 349.71, env_2029: 159.52, env_2030: 159.59 },
    'MAGR': { env_2028: 6388.35, env_2029: 2914.00, env_2030: 2915.43 },
    'MENER': { env_2028: 830.12, env_2029: 378.65, env_2030: 378.84 },
    'MJC': { env_2028: 1123.26, env_2029: 512.37, env_2030: 512.62 },
    'MCOM': { env_2028: 1466.50, env_2029: 668.93, env_2030: 669.26 },
    'MFF': { env_2028: 334.26, env_2029: 152.47, env_2030: 152.54 },
    'MAM': { env_2028: 557.47, env_2029: 254.29, env_2030: 254.41 },
    'MAS': { env_2028: 1516.27, env_2029: 691.64, env_2030: 691.98 },
    'MESUP': { env_2028: 4623.20, env_2029: 2108.84, env_2030: 2109.88 },
    'MVL': { env_2028: 1143.14, env_2029: 521.43, env_2030: 521.69 },
    'CGP': { env_2028: 15.03, env_2029: 6.86, env_2030: 6.86 },
    'PP': { env_2028: 917.99, env_2029: 645.50, env_2030: 645.82 },
    'CR': { env_2028: 308.83, env_2029: 76.97, env_2030: 77.01 },
    'CL': { env_2028: 873.13, env_2029: 103.23, env_2030: 103.28 },
    'SES': { env_2028: 286.13, env_2029: 194.41, env_2030: 194.51 },
    'MENI': { env_2028: 351.73, env_2029: 228.71, env_2030: 228.82 },
    'DC': { env_2028: 5060.68, env_2029: 4997.24, env_2030: 4999.70 },
  };

  const createdMinistries: Record<string, any> = {};
  for (const ministry of ministriesData) {
    const created = await prisma.ministry.upsert({
      where: { code: ministry.code },
      update: { name: ministry.name, nameEn: ministry.nameEn, isPriority: ministry.isPriority },
      create: ministry,
    });
    createdMinistries[ministry.code] = created;
  }

  console.log(`✅ ${ministriesData.length} ministères/institutions créés`);

  // ============================================
  // 4. UTILISATEURS
  // ============================================
  console.log('📝 Création des utilisateurs...');

  const hashedPassword = await bcrypt.hash('Admin@2026', 10);

  const adminUser = await prisma.user.upsert({
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

  const budgetUser = await prisma.user.upsert({
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

  await prisma.user.upsert({
    where: { email: 'daf@education.dj' },
    update: {},
    create: {
      email: 'daf@education.dj',
      password: hashedPassword,
      firstName: 'DAF',
      lastName: 'Éducation',
      isActive: true,
      roleId: ministryRole.id,
      ministryId: createdMinistries['MEN'].id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'daf@sante.dj' },
    update: {},
    create: {
      email: 'daf@sante.dj',
      password: hashedPassword,
      firstName: 'DAF',
      lastName: 'Santé',
      isActive: true,
      roleId: ministryRole.id,
      ministryId: createdMinistries['MS'].id,
    },
  });

  // Utilisateur Direction de la Planification
  await prisma.user.upsert({
    where: { email: 'planification@gouv.dj' },
    update: {},
    create: {
      email: 'planification@gouv.dj',
      password: hashedPassword,
      firstName: 'Direction',
      lastName: 'Planification',
      phone: '+253 21 35 00 02',
      isActive: true,
      roleId: planningDirectorRole.id,
    },
  });

  // Utilisateur Direction de la Dette
  await prisma.user.upsert({
    where: { email: 'dette@finances.dj' },
    update: {},
    create: {
      email: 'dette@finances.dj',
      password: hashedPassword,
      firstName: 'Direction',
      lastName: 'Dette',
      phone: '+253 21 35 00 03',
      isActive: true,
      roleId: debtDirectorRole.id,
    },
  });

  // Utilisateur Direction de la Solde
  await prisma.user.upsert({
    where: { email: 'solde@finances.dj' },
    update: {},
    create: {
      email: 'solde@finances.dj',
      password: hashedPassword,
      firstName: 'Direction',
      lastName: 'Solde',
      phone: '+253 21 35 00 04',
      isActive: true,
      roleId: salaryDirectorRole.id,
    },
  });

  // Utilisateur PTF (Partenaire Technique et Financier)
  await prisma.user.upsert({
    where: { email: 'ptf@partenaires.dj' },
    update: {},
    create: {
      email: 'ptf@partenaires.dj',
      password: hashedPassword,
      firstName: 'Partenaire',
      lastName: 'PTF',
      phone: '+253 21 35 00 05',
      isActive: true,
      roleId: ptfRole.id,
    },
  });

  console.log('✅ 8 utilisateurs créés (1 par profil + 2 ministères sectoriels)');

  // ============================================
  // 5. CATÉGORIES ÉCONOMIQUES (Structure réelle Djibouti)
  // ============================================
  console.log('📝 Création des catégories économiques...');

  const economicCategories = [
    { code: 'SAL', name: 'Salaires', nameEn: 'Salaries', level: 1 },
    { code: 'MAT', name: 'Matériels', nameEn: 'Materials', level: 1 },
    { code: 'TRANS', name: 'Transferts', nameEn: 'Transfers', level: 1 },
    { code: 'DONS_COUR', name: 'Dons affectés aux dépenses courantes', nameEn: 'Grants for current expenses', level: 1 },
    { code: 'INV_INT', name: 'Investissements Intérieurs', nameEn: 'Domestic Investments', level: 1 },
    { code: 'DONS_PROJ', name: 'Dons Projets', nameEn: 'Project Grants', level: 1 },
    { code: 'EMP_PROJ', name: 'Emprunts Projets', nameEn: 'Project Loans', level: 1 },
    { code: 'INT', name: 'Intérêts', nameEn: 'Interest', level: 1 },
    { code: 'AMORT', name: 'Amortissements', nameEn: 'Amortization', level: 1 },
    { code: 'APUR', name: 'Apurement arriérés intérieurs', nameEn: 'Domestic arrears clearance', level: 1 },
  ];

  for (const cat of economicCategories) {
    await prisma.economicCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ ${economicCategories.length} catégories économiques créées`);

  // ============================================
  // 5b. NATURES DES DÉPENSES (10 natures par défaut)
  // ============================================
  console.log('📝 Création des natures de dépenses...');

  const expenseNatures = [
    { code: 'SAL', name: 'Salaires', type: 'EXPENSE', description: 'Dépenses de personnel - traitements et salaires', isActive: true },
    { code: 'MAT', name: 'Matériels', type: 'EXPENSE', description: 'Dépenses de fonctionnement - biens et services', isActive: true },
    { code: 'TRANS', name: 'Transferts', type: 'EXPENSE', description: 'Transferts courants aux ménages et institutions', isActive: true },
    { code: 'DONS_COUR', name: 'Dons affectés aux dépenses courantes', type: 'EXPENSE', description: 'Dons des PTF pour le fonctionnement', isActive: true },
    { code: 'INV_INT', name: 'Investissements Intérieurs', type: 'EXPENSE', description: 'Investissements sur ressources propres', isActive: true },
    { code: 'DONS_PROJ', name: 'Dons Projets', type: 'EXPENSE', description: 'Investissements financés par dons PTF', isActive: true },
    { code: 'EMP_PROJ', name: 'Emprunts Projets', type: 'EXPENSE', description: 'Investissements financés par emprunts', isActive: true },
    { code: 'INT', name: 'Intérêts', type: 'EXPENSE', description: 'Service de la dette - intérêts', isActive: true },
    { code: 'AMORT', name: 'Amortissements', type: 'EXPENSE', description: 'Service de la dette - remboursement du principal', isActive: true },
    { code: 'APUR', name: 'Apurements arriérés intérieur', type: 'EXPENSE', description: 'Règlement des arriérés de paiement intérieurs', isActive: true },
  ];

  for (const nature of expenseNatures) {
    await prisma.economicNature.upsert({
      where: { code: nature.code },
      update: {},
      create: nature,
    });
  }

  console.log(`✅ 96 enregistrements de données historiques créés`);

  // ============================================
  // 6. SOURCES DE FINANCEMENT
  // ============================================
  console.log('📝 Création des sources de financement...');

  const fundingSources = [
    { code: 'TRESOR', name: 'Trésor Public', type: 'BUDGET', isExternal: false },
    { code: 'DONS', name: 'Dons', type: 'GRANT', isExternal: true },
    { code: 'EMPRUNTS', name: 'Emprunts', type: 'LOAN', isExternal: true },
    { code: 'BM', name: 'Banque Mondiale', type: 'LOAN', isExternal: true },
    { code: 'BAD', name: 'Banque Africaine de Développement', type: 'LOAN', isExternal: true },
    { code: 'BID', name: 'Banque Islamique de Développement', type: 'LOAN', isExternal: true },
    { code: 'AFD', name: 'Agence Française de Développement', type: 'GRANT', isExternal: true },
    { code: 'UE', name: 'Union Européenne', type: 'GRANT', isExternal: true },
  ];

  for (const source of fundingSources) {
    await prisma.fundingSource.upsert({
      where: { code: source.code },
      update: {},
      create: source,
    });
  }

  console.log(`✅ ${fundingSources.length} sources de financement créées`);

  // ============================================
  // 7. ANNÉES FISCALES
  // ============================================
  console.log('📝 Création des années fiscales...');

  // Années fiscales: 2023 (N-2), 2024 (N-1), 2025 (N/LFI), 2026-2030 (projections)
  for (let year = 2023; year <= 2030; year++) {
    await prisma.budgetYear.upsert({
      where: { year },
      update: {},
      create: {
        year,
        label: year.toString(),
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        isCurrent: year === 2026,
        status: year < 2026 ? 'CLOSED' : year === 2026 ? 'ACTIVE' : 'DRAFT',
      },
    });

    await prisma.fiscalYear.upsert({
      where: { year },
      update: {},
      create: {
        year,
        name: `Exercice ${year}`,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        isClosed: year < 2026,
        isActive: year === 2026,
      },
    });
  }

  console.log('✅ 8 années fiscales créées (2023-2030)');

  // ============================================
  // 8. CADRE MACROÉCONOMIQUE
  // ============================================
  console.log('📝 Création du cadre macroéconomique...');

  const macroFramework = await prisma.macroFramework.upsert({
    where: { year_budgetYear: { year: 2025, budgetYear: 2026 } },
    update: {},
    create: {
      year: 2025,
      budgetYear: 2026,
      gdpGrowthRate: 6.0,
      inflationRate: 2.5,
      exchangeRate: 177.72,
      oilPrice: 80.00,
      oilPriceYear1: 82.00,
      oilPriceYear2: 84.00,
      oilPriceYear3: 85.00,
      nominalGDP: 680000,
      nominalGDPYear1: 720800,
      nominalGDPYear2: 764048,
      nominalGDPYear3: 809891,
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: budgetUser.id,
      createdBy: budgetUser.id,
    },
  });

  console.log('✅ Cadre macroéconomique 2026-2028 créé');

  // ============================================
  // 9. DOCUMENT CBMT (Données réelles Djibouti)
  // ============================================
  console.log('📝 Création du CBMT avec données réelles...');

  // Données CBMT réelles extraites du fichier Excel (en millions FDJ)
  const cbmtData = {
    2026: { salaires: 42009, materiels: 34828, transferts: 22729, inv_int: 28300, dons_projets: 7783, emprunts: 16803, interets: 1854, amortissements: 7993, apurement: 1700 },
    2027: { salaires: 43648, materiels: 36811, transferts: 23503, inv_int: 28779, dons_projets: 8154, emprunts: 17747, interets: 1886, amortissements: 7728, apurement: 1700 },
    2028: { salaires: 45275, materiels: 38586, transferts: 24771, inv_int: 29767, dons_projets: 8847, emprunts: 19775, interets: 1456, amortissements: 6950, apurement: 1700 },
  };

  const total2026 = Object.values(cbmtData[2026]).reduce((a, b) => a + b, 0);
  const total2027 = Object.values(cbmtData[2027]).reduce((a, b) => a + b, 0);
  const total2028 = Object.values(cbmtData[2028]).reduce((a, b) => a + b, 0);

  const cbmtDocument = await prisma.cBMTDocument.upsert({
    where: { macroFrameworkId_fiscalYear_scenarioType: { macroFrameworkId: macroFramework.id, fiscalYear: 2026, scenarioType: 'BASE' } },
    update: {},
    create: {
      macroFrameworkId: macroFramework.id,
      fiscalYear: 2026,
      documentCode: 'CBMT-2026-2028-LFI2025',
      title: 'CBMT 2026-2028 basé sur LFI 2025',
      description: 'Cadre Budgétaire à Moyen Terme de la République de Djibouti',
      scenarioName: 'Scénario de Base',
      scenarioType: 'BASE',
      totalRevenueCeiling: total2026,
      totalExpenseCeiling: total2026,
      status: 'VALIDATED',
      currency: 'DJF',
      unit: 'MILLION',
      createdBy: budgetUser.id,
      validatedAt: new Date(),
      validatedBy: budgetUser.id,
    },
  });

  // Agrégats CBMT par nature économique
  const cbmtAggregates = [
    { type: 'EXPENSE', code: 'SAL', name: 'Salaires', base: 40000, y1: cbmtData[2026].salaires, y2: cbmtData[2027].salaires, y3: cbmtData[2028].salaires },
    { type: 'EXPENSE', code: 'MAT', name: 'Matériels', base: 33000, y1: cbmtData[2026].materiels, y2: cbmtData[2027].materiels, y3: cbmtData[2028].materiels },
    { type: 'EXPENSE', code: 'TRANS', name: 'Transferts', base: 21500, y1: cbmtData[2026].transferts, y2: cbmtData[2027].transferts, y3: cbmtData[2028].transferts },
    { type: 'EXPENSE', code: 'INV_INT', name: 'Investissements Intérieurs', base: 27000, y1: cbmtData[2026].inv_int, y2: cbmtData[2027].inv_int, y3: cbmtData[2028].inv_int },
    { type: 'EXPENSE', code: 'DONS_PROJ', name: 'Dons Projets', base: 7500, y1: cbmtData[2026].dons_projets, y2: cbmtData[2027].dons_projets, y3: cbmtData[2028].dons_projets },
    { type: 'EXPENSE', code: 'EMP_PROJ', name: 'Emprunts Projets', base: 16000, y1: cbmtData[2026].emprunts, y2: cbmtData[2027].emprunts, y3: cbmtData[2028].emprunts },
    { type: 'EXPENSE', code: 'INT', name: 'Intérêts', base: 1900, y1: cbmtData[2026].interets, y2: cbmtData[2027].interets, y3: cbmtData[2028].interets },
    { type: 'EXPENSE', code: 'AMORT', name: 'Amortissements', base: 8200, y1: cbmtData[2026].amortissements, y2: cbmtData[2027].amortissements, y3: cbmtData[2028].amortissements },
    { type: 'EXPENSE', code: 'APUR', name: 'Apurement arriérés', base: 1700, y1: cbmtData[2026].apurement, y2: cbmtData[2027].apurement, y3: cbmtData[2028].apurement },
  ];

  for (const agg of cbmtAggregates) {
    await prisma.cBMTAggregate.upsert({
      where: { cbmtDocumentId_aggregateType_categoryCode: { cbmtDocumentId: cbmtDocument.id, aggregateType: agg.type, categoryCode: agg.code } },
      update: {},
      create: {
        cbmtDocumentId: cbmtDocument.id,
        aggregateType: agg.type,
        categoryCode: agg.code,
        categoryName: agg.name,
        baseYear: 2025,
        baseAmount: agg.base,
        year1: 2026,
        amount1: agg.y1,
        year2: 2027,
        amount2: agg.y2,
        year3: 2028,
        amount3: agg.y3,
      },
    });
  }

  console.log('✅ CBMT 2026-2028 créé avec agrégats réels');

  // ============================================
  // 10. DOCUMENT TOFE (Données réelles)
  // ============================================
  console.log('📝 Création du TOFE prévisionnel...');

  const tofeDocument = await prisma.tOFEDocument.upsert({
    where: { macroFrameworkId_fiscalYear: { macroFrameworkId: macroFramework.id, fiscalYear: 2026 } },
    update: {},
    create: {
      macroFrameworkId: macroFramework.id,
      fiscalYear: 2026,
      documentCode: 'TOFE-2026-2028',
      title: 'TOFE Prévisionnel 2026-2028',
      description: 'Tableau des Opérations Financières de l\'État - République de Djibouti',
      status: 'VALIDATED',
      currency: 'DJF',
      unit: 'MILLION',
      createdBy: budgetUser.id,
      validatedAt: new Date(),
      validatedBy: budgetUser.id,
    },
  });

  const tofeLines = [
    { code: '1', label: 'RECETTES TOTALES ET DONS', section: 'REVENUE', level: 0, isBold: true, base: 155000, y1: 163999, y2: 169956, y3: 177127 },
    { code: '1.1', label: 'Recettes Totales', section: 'REVENUE', level: 1, base: 140000, y1: 148216, y2: 153802, y3: 160280 },
    { code: '1.1.1', label: 'Recettes Fiscales', section: 'REVENUE', level: 2, base: 95000, y1: 100700, y2: 104700, y3: 109000 },
    { code: '1.1.2', label: 'Recettes Non Fiscales', section: 'REVENUE', level: 2, base: 45000, y1: 47516, y2: 49102, y3: 51280 },
    { code: '1.2', label: 'Dons', section: 'REVENUE', level: 1, base: 15000, y1: 15783, y2: 16154, y3: 16847 },
    { code: '2', label: 'DÉPENSES TOTALES', section: 'EXPENSE', level: 0, isBold: true, base: 155000, y1: 163999, y2: 169956, y3: 177127 },
    { code: '2.1', label: 'Dépenses Courantes', section: 'EXPENSE', level: 1, base: 99537, y1: 99566, y2: 103962, y3: 108632 },
    { code: '2.1.1', label: 'Salaires', section: 'EXPENSE', level: 2, base: 40000, y1: 42009, y2: 43648, y3: 45275 },
    { code: '2.1.2', label: 'Biens et Services', section: 'EXPENSE', level: 2, base: 33000, y1: 34828, y2: 36811, y3: 38586 },
    { code: '2.1.3', label: 'Transferts', section: 'EXPENSE', level: 2, base: 21500, y1: 22729, y2: 23503, y3: 24771 },
    { code: '2.2', label: 'Dépenses en Capital', section: 'EXPENSE', level: 1, base: 52086, y1: 52886, y2: 54680, y3: 58389 },
    { code: '2.2.1', label: 'Investissements Intérieurs', section: 'EXPENSE', level: 2, base: 27000, y1: 28300, y2: 28779, y3: 29767 },
    { code: '2.2.2', label: 'Investissements Extérieurs', section: 'EXPENSE', level: 2, base: 23500, y1: 24586, y2: 25901, y3: 28622 },
    { code: '2.3', label: 'Service de la Dette', section: 'EXPENSE', level: 1, base: 11847, y1: 11547, y2: 11314, y3: 10106 },
    { code: '3', label: 'SOLDE GLOBAL', section: 'BALANCE', level: 0, isBold: true, base: 0, y1: 0, y2: 0, y3: 0 },
  ];

  for (let i = 0; i < tofeLines.length; i++) {
    const line = tofeLines[i];
    await prisma.tOFELine.upsert({
      where: { tofeDocumentId_lineCode: { tofeDocumentId: tofeDocument.id, lineCode: line.code } },
      update: {},
      create: {
        tofeDocumentId: tofeDocument.id,
        section: line.section,
        lineCode: line.code,
        lineLabel: line.label,
        lineLevel: line.level,
        orderIndex: i + 1,
        baseYear: 2025,
        baseAmount: line.base,
        projectionYear1: 2026,
        amount1: line.y1,
        projectionYear2: 2027,
        amount2: line.y2,
        projectionYear3: 2028,
        amount3: line.y3,
        isBold: line.isBold || false,
      },
    });
  }

  console.log('✅ TOFE avec 15 lignes créé');

  // ============================================
  // 11. SCÉNARIO CDMT GLOBAL
  // ============================================
  console.log('📝 Création du scénario CDMT Global...');

  const cdmtScenario = await prisma.cDMTGlobalScenario.upsert({
    where: { scenarioCode: 'CDMT-2026-2028-REF' },
    update: {},
    create: {
      scenarioCode: 'CDMT-2026-2028-REF',
      name: 'CDMT 2026-2028 - Scénario de Référence LFI 2025',
      description: 'Scénario de référence basé sur la Loi de Finances Initiale 2025',
      fiscalYear: 2026,
      macroFrameworkId: macroFramework.id,
      fiscalMarginY1: 63042,
      fiscalMarginY2: 0,
      fiscalMarginY3: 0,
      totalBaselineY1: 47425,
      totalBaselineY2: 47300,
      totalBaselineY3: 47323,
      totalCeilingY1: total2026,
      totalCeilingY2: total2027,
      totalCeilingY3: total2028,
      status: 'ACTIVE',
      isActive: true,
      activatedAt: new Date(),
      activatedBy: budgetUser.id,
      createdBy: budgetUser.id,
    },
  });

  console.log('✅ Scénario CDMT Global créé');

  // ============================================
  // 12. PLAFONDS MINISTÉRIELS (Données réelles)
  // ============================================
  console.log('📝 Création des plafonds ministériels...');

  let ceilingsCount = 0;
  for (const [code, ministry] of Object.entries(createdMinistries)) {
    const enveloppe = enveloppesReelles[code];
    if (!enveloppe) continue;

    // Créer les plafonds pour chaque année (2028, 2029, 2030)
    for (const yearData of [
      { year: 2028, ceiling: enveloppe.env_2028 },
      { year: 2029, ceiling: enveloppe.env_2029 },
      { year: 2030, ceiling: enveloppe.env_2030 },
    ]) {
      await prisma.ministerialCeiling.upsert({
        where: { scenarioId_ministryId_budgetYear_year: { scenarioId: cdmtScenario.id, ministryId: ministry.id, budgetYear: 2026, year: yearData.year } },
        update: { ceiling: yearData.ceiling },
        create: {
          scenarioId: cdmtScenario.id,
          ministryId: ministry.id,
          budgetYear: 2026,
          year: yearData.year,
          baseline: yearData.ceiling * 0.45,
          newMeasures: yearData.ceiling * 0.10,
          allocatedSpace: yearData.ceiling * 0.45,
          ceiling: yearData.ceiling,
          status: 'VALIDATED',
          validatedAt: new Date(),
          validatedBy: budgetUser.id,
          createdBy: budgetUser.id,
        },
      });
      ceilingsCount++;
    }
  }

  console.log(`✅ ${ceilingsCount} plafonds ministériels créés`);

  // ============================================
  // 13. CONFIGURATION TENDANCIELLE
  // ============================================
  console.log('📝 Création de la configuration tendancielle...');

  await prisma.trendBudgetConfig.upsert({
    where: { configCode: 'TREND-2026-2028' },
    update: {},
    create: {
      configCode: 'TREND-2026-2028',
      name: 'Configuration Tendancielle 2026-2028',
      description: 'Budget tendanciel basé sur les exécutions 2024',
      fiscalYear: 2026,
      baselineStartYear: 2024,
      baselineEndYear: 2024,
      globalGrowthRate: 3.5,
      projectionYears: 3,
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: budgetUser.id,
      createdBy: budgetUser.id,
    },
  });

  console.log('✅ Configuration tendancielle créée');


  // ============================================
  // 13b. DONNEES HISTORIQUES (N-2, N-1, N)
  // ============================================
  console.log('📝 Creation des donnees historiques budgetaires...');

  // Donnees historiques extraites du fichier Excel
  // N-2 = 2023 (execution), N-1 = 2024 (prevision), N = 2025 (LFI)
  const historicalBudgetData: Array<{ministryCode: string; year: number; salaries: number; materials: number; transfers: number; grantsCurrentExp: number; internalInvestment: number; projectGrants: number; projectLoans: number; total: number}> = [
    { ministryCode: 'PRES', year: 2023, salaries: 535066192.0, materials: 2189567381.0, transfers: 1201922362.0, grantsCurrentExp: 0, internalInvestment: 1137491610.0, projectGrants: 0, projectLoans: 824000000.0, total: 5888047545.0 },
    { ministryCode: 'PRIM', year: 2023, salaries: 155887685.0, materials: 116394306.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 68775000.0, projectGrants: 0, projectLoans: 0, total: 341056991.0 },
    { ministryCode: 'MJ', year: 2023, salaries: 794955491.0, materials: 385844367.0, transfers: 141932200.0, grantsCurrentExp: 0, internalInvestment: 138191325.0, projectGrants: 0, projectLoans: 0, total: 1460923383.0 },
    { ministryCode: 'MI', year: 2023, salaries: 3785846156.0, materials: 2252266440.0, transfers: 536518847.0, grantsCurrentExp: 0, internalInvestment: 1253505173.0, projectGrants: 257000000.0, projectLoans: 250000000.0, total: 8335136616.0 },
    { ministryCode: 'MD', year: 2023, salaries: 10285721146.0, materials: 7159820713.0, transfers: 1245684586.0, grantsCurrentExp: 0, internalInvestment: 1199669755.0, projectGrants: 0, projectLoans: 0, total: 19890896200.0 },
    { ministryCode: 'MAE', year: 2023, salaries: 1388560851.0, materials: 3357031130.0, transfers: 29155209.0, grantsCurrentExp: 0, internalInvestment: 43065255.0, projectGrants: 0, projectLoans: 0, total: 4817812445.0 },
    { ministryCode: 'MB', year: 2023, salaries: 1240677156.0, materials: 871348779.0, transfers: 4607300626.0, grantsCurrentExp: 0, internalInvestment: 889938516.0, projectGrants: 0, projectLoans: 0, total: 7609265077.0 },
    { ministryCode: 'MEF', year: 2023, salaries: 256438112.0, materials: 68809260.0, transfers: 649975289.0, grantsCurrentExp: 0, internalInvestment: 11250000.0, projectGrants: 250000000.0, projectLoans: 1085000000.0, total: 2321472661.0 },
    { ministryCode: 'MC', year: 2023, salaries: 82682849.0, materials: 68097578.0, transfers: 219182376.0, grantsCurrentExp: 0, internalInvestment: 63198531.0, projectGrants: 0, projectLoans: 0, total: 433161334.0 },
    { ministryCode: 'MEQI', year: 2023, salaries: 1240309859.0, materials: 325237931.0, transfers: 336237861.0, grantsCurrentExp: 0, internalInvestment: 1863263396.0, projectGrants: 477000000.0, projectLoans: 1892000000.0, total: 6134049047.0 },
    { ministryCode: 'MEN', year: 2023, salaries: 12776672812.0, materials: 1288854092.0, transfers: 257713367.0, grantsCurrentExp: 0, internalInvestment: 1800675025.0, projectGrants: 250000000.0, projectLoans: 650000000.0, total: 17023915296.0 },
    { ministryCode: 'MDEC', year: 2023, salaries: 55063249.0, materials: 81054514.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 14625000.0, projectGrants: 150000000.0, projectLoans: 0, total: 300742763.0 },
    { ministryCode: 'MT', year: 2023, salaries: 218515070.0, materials: 108953169.0, transfers: 167205699.0, grantsCurrentExp: 0, internalInvestment: 89712282.0, projectGrants: 75000000.0, projectLoans: 337000000.0, total: 996386220.0 },
    { ministryCode: 'MINV', year: 2023, salaries: 35152509.0, materials: 60690478.0, transfers: 68728496.0, grantsCurrentExp: 0, internalInvestment: 9375000.0, projectGrants: 0, projectLoans: 0, total: 173946483.0 },
    { ministryCode: 'MS', year: 2023, salaries: 3300187539.0, materials: 2020453233.0, transfers: 3293124774.0, grantsCurrentExp: 0, internalInvestment: 865496180.0, projectGrants: 500000000.0, projectLoans: 1226000000.0, total: 11205261726.0 },
    { ministryCode: 'MENV', year: 2023, salaries: 276003084.0, materials: 50651469.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 52500000.0, projectGrants: 99000000.0, projectLoans: 0, total: 478154553.0 },
    { ministryCode: 'MAGR', year: 2023, salaries: 609009338.0, materials: 223254796.0, transfers: 35000000.0, grantsCurrentExp: 0, internalInvestment: 1518559204.0, projectGrants: 3071000000.0, projectLoans: 3278000000.0, total: 8734823338.0 },
    { ministryCode: 'MENER', year: 2023, salaries: 412137423.0, materials: 66253861.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 88637025.0, projectGrants: 100000000.0, projectLoans: 468000000.0, total: 1135028309.0 },
    { ministryCode: 'MJC', year: 2023, salaries: 250264573.0, materials: 596967080.0, transfers: 439361722.0, grantsCurrentExp: 0, internalInvestment: 249241214.0, projectGrants: 0, projectLoans: 0, total: 1535834589.0 },
    { ministryCode: 'MCOM', year: 2023, salaries: 371163763.0, materials: 171781970.0, transfers: 1111522256.0, grantsCurrentExp: 0, internalInvestment: 350685156.0, projectGrants: 0, projectLoans: 0, total: 2005153145.0 },
    { ministryCode: 'MFF', year: 2023, salaries: 144885552.0, materials: 94647388.0, transfers: 99000000.0, grantsCurrentExp: 0, internalInvestment: 118500000.0, projectGrants: 0, projectLoans: 0, total: 457032940.0 },
    { ministryCode: 'MAM', year: 2023, salaries: 73386432.0, materials: 351288538.0, transfers: 63770000.0, grantsCurrentExp: 0, internalInvestment: 273786192.0, projectGrants: 0, projectLoans: 0, total: 762231162.0 },
    { ministryCode: 'MAS', year: 2023, salaries: 144354031.0, materials: 41332403.0, transfers: 161856250.0, grantsCurrentExp: 0, internalInvestment: 728663863.0, projectGrants: 997000000.0, projectLoans: 0, total: 2073206547.0 },
    { ministryCode: 'MESUP', year: 2023, salaries: 83825122.0, materials: 70151969.0, transfers: 5091593457.0, grantsCurrentExp: 0, internalInvestment: 465750000.0, projectGrants: 325000000.0, projectLoans: 285000000.0, total: 6321320548.0 },
    { ministryCode: 'MVL', year: 2023, salaries: 134498879.0, materials: 21624754.0, transfers: 17898000.0, grantsCurrentExp: 0, internalInvestment: 150000000.0, projectGrants: 0, projectLoans: 1239000000.0, total: 1563021633.0 },
    { ministryCode: 'CGP', year: 2023, salaries: 10154439.0, materials: 10402500.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 20556939.0 },
    { ministryCode: 'MENI', year: 2023, salaries: 21367158.0, materials: 59006920.0, transfers: 56695938.0, grantsCurrentExp: 0, internalInvestment: 34500000.0, projectGrants: 0, projectLoans: 514000000.0, total: 685570016.0 },
    { ministryCode: 'SES', year: 2023, salaries: 196930978.0, materials: 187440927.0, transfers: 107742485.0, grantsCurrentExp: 0, internalInvestment: 90640362.0, projectGrants: 0, projectLoans: 0, total: 582754752.0 },
    { ministryCode: 'PP', year: 2023, salaries: 0, materials: 0, transfers: 1632556637.0, grantsCurrentExp: 0, internalInvestment: 52368862.0, projectGrants: 250000000.0, projectLoans: 0, total: 1934925499.0 },
    { ministryCode: 'CR', year: 2023, salaries: 0, materials: 0, transfers: 230730500.0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 230730500.0 },
    { ministryCode: 'CL', year: 2023, salaries: 0, materials: 0, transfers: 279445590.0, grantsCurrentExp: 0, internalInvestment: 30000000.0, projectGrants: 0, projectLoans: 0, total: 309445590.0 },
    { ministryCode: 'DC', year: 2023, salaries: 929841987.0, materials: 11002242960.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 3047331964.0, projectGrants: 0, projectLoans: 0, total: 14979416911.0 },
    { ministryCode: 'PRES', year: 2024, salaries: 535066192.0, materials: 2189567381.0, transfers: 1201922362.0, grantsCurrentExp: 0, internalInvestment: 1137491610.0, projectGrants: 0, projectLoans: 824000000.0, total: 5888047545.0 },
    { ministryCode: 'PRIM', year: 2024, salaries: 155887685.0, materials: 116394306.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 68775000.0, projectGrants: 0, projectLoans: 0, total: 341056991.0 },
    { ministryCode: 'MJ', year: 2024, salaries: 794955491.0, materials: 385844367.0, transfers: 141932200.0, grantsCurrentExp: 0, internalInvestment: 138191325.0, projectGrants: 0, projectLoans: 0, total: 1460923383.0 },
    { ministryCode: 'MI', year: 2024, salaries: 3785846156.0, materials: 2252266440.0, transfers: 536518847.0, grantsCurrentExp: 0, internalInvestment: 1253505173.0, projectGrants: 257000000.0, projectLoans: 250000000.0, total: 8335136616.0 },
    { ministryCode: 'MD', year: 2024, salaries: 10285721146.0, materials: 7159820713.0, transfers: 1245684586.0, grantsCurrentExp: 0, internalInvestment: 1199669755.0, projectGrants: 0, projectLoans: 0, total: 19890896200.0 },
    { ministryCode: 'MAE', year: 2024, salaries: 1388560851.0, materials: 3357031130.0, transfers: 29155209.0, grantsCurrentExp: 0, internalInvestment: 43065255.0, projectGrants: 0, projectLoans: 0, total: 4817812445.0 },
    { ministryCode: 'MB', year: 2024, salaries: 1240677156.0, materials: 871348779.0, transfers: 4607300626.0, grantsCurrentExp: 0, internalInvestment: 889938516.0, projectGrants: 0, projectLoans: 0, total: 7609265077.0 },
    { ministryCode: 'MEF', year: 2024, salaries: 256438112.0, materials: 68809260.0, transfers: 649975289.0, grantsCurrentExp: 0, internalInvestment: 11250000.0, projectGrants: 250000000.0, projectLoans: 1085000000.0, total: 2321472661.0 },
    { ministryCode: 'MC', year: 2024, salaries: 82682849.0, materials: 68097578.0, transfers: 219182376.0, grantsCurrentExp: 0, internalInvestment: 63198531.0, projectGrants: 0, projectLoans: 0, total: 433161334.0 },
    { ministryCode: 'MEQI', year: 2024, salaries: 1240309859.0, materials: 325237931.0, transfers: 336237861.0, grantsCurrentExp: 0, internalInvestment: 1863263396.0, projectGrants: 477000000.0, projectLoans: 1892000000.0, total: 6134049047.0 },
    { ministryCode: 'MEN', year: 2024, salaries: 12776672812.0, materials: 1288854092.0, transfers: 257713367.0, grantsCurrentExp: 0, internalInvestment: 1800675025.0, projectGrants: 250000000.0, projectLoans: 650000000.0, total: 17023915296.0 },
    { ministryCode: 'MDEC', year: 2024, salaries: 55063249.0, materials: 81054514.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 14625000.0, projectGrants: 150000000.0, projectLoans: 0, total: 300742763.0 },
    { ministryCode: 'MT', year: 2024, salaries: 218515070.0, materials: 108953169.0, transfers: 167205699.0, grantsCurrentExp: 0, internalInvestment: 89712282.0, projectGrants: 75000000.0, projectLoans: 337000000.0, total: 996386220.0 },
    { ministryCode: 'MINV', year: 2024, salaries: 35152509.0, materials: 60690478.0, transfers: 68728496.0, grantsCurrentExp: 0, internalInvestment: 9375000.0, projectGrants: 0, projectLoans: 0, total: 173946483.0 },
    { ministryCode: 'MS', year: 2024, salaries: 3300187539.0, materials: 2020453233.0, transfers: 3293124774.0, grantsCurrentExp: 0, internalInvestment: 865496180.0, projectGrants: 500000000.0, projectLoans: 1226000000.0, total: 11205261726.0 },
    { ministryCode: 'MENV', year: 2024, salaries: 276003084.0, materials: 50651469.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 52500000.0, projectGrants: 99000000.0, projectLoans: 0, total: 478154553.0 },
    { ministryCode: 'MAGR', year: 2024, salaries: 609009338.0, materials: 223254796.0, transfers: 35000000.0, grantsCurrentExp: 0, internalInvestment: 1518559204.0, projectGrants: 3071000000.0, projectLoans: 3278000000.0, total: 8734823338.0 },
    { ministryCode: 'MENER', year: 2024, salaries: 412137423.0, materials: 66253861.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 88637025.0, projectGrants: 100000000.0, projectLoans: 468000000.0, total: 1135028309.0 },
    { ministryCode: 'MJC', year: 2024, salaries: 250264573.0, materials: 596967080.0, transfers: 439361722.0, grantsCurrentExp: 0, internalInvestment: 249241214.0, projectGrants: 0, projectLoans: 0, total: 1535834589.0 },
    { ministryCode: 'MCOM', year: 2024, salaries: 371163763.0, materials: 171781970.0, transfers: 1111522256.0, grantsCurrentExp: 0, internalInvestment: 350685156.0, projectGrants: 0, projectLoans: 0, total: 2005153145.0 },
    { ministryCode: 'MFF', year: 2024, salaries: 144885552.0, materials: 94647388.0, transfers: 99000000.0, grantsCurrentExp: 0, internalInvestment: 118500000.0, projectGrants: 0, projectLoans: 0, total: 457032940.0 },
    { ministryCode: 'MAM', year: 2024, salaries: 73386432.0, materials: 351288538.0, transfers: 63770000.0, grantsCurrentExp: 0, internalInvestment: 273786192.0, projectGrants: 0, projectLoans: 0, total: 762231162.0 },
    { ministryCode: 'MAS', year: 2024, salaries: 144354031.0, materials: 41332403.0, transfers: 161856250.0, grantsCurrentExp: 0, internalInvestment: 728663863.0, projectGrants: 997000000.0, projectLoans: 0, total: 2073206547.0 },
    { ministryCode: 'MESUP', year: 2024, salaries: 83825122.0, materials: 70151969.0, transfers: 5091593457.0, grantsCurrentExp: 0, internalInvestment: 465750000.0, projectGrants: 325000000.0, projectLoans: 285000000.0, total: 6321320548.0 },
    { ministryCode: 'MVL', year: 2024, salaries: 134498879.0, materials: 21624754.0, transfers: 17898000.0, grantsCurrentExp: 0, internalInvestment: 150000000.0, projectGrants: 0, projectLoans: 1239000000.0, total: 1563021633.0 },
    { ministryCode: 'CGP', year: 2024, salaries: 10154439.0, materials: 10402500.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 20556939.0 },
    { ministryCode: 'MENI', year: 2024, salaries: 21367158.0, materials: 59006920.0, transfers: 56695938.0, grantsCurrentExp: 0, internalInvestment: 34500000.0, projectGrants: 0, projectLoans: 514000000.0, total: 685570016.0 },
    { ministryCode: 'SES', year: 2024, salaries: 196930978.0, materials: 187440927.0, transfers: 107742485.0, grantsCurrentExp: 0, internalInvestment: 90640362.0, projectGrants: 0, projectLoans: 0, total: 582754752.0 },
    { ministryCode: 'PP', year: 2024, salaries: 0, materials: 0, transfers: 1632556637.0, grantsCurrentExp: 0, internalInvestment: 52368862.0, projectGrants: 250000000.0, projectLoans: 0, total: 1934925499.0 },
    { ministryCode: 'CR', year: 2024, salaries: 0, materials: 0, transfers: 230730500.0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 230730500.0 },
    { ministryCode: 'CL', year: 2024, salaries: 0, materials: 0, transfers: 279445590.0, grantsCurrentExp: 0, internalInvestment: 30000000.0, projectGrants: 0, projectLoans: 0, total: 309445590.0 },
    { ministryCode: 'DC', year: 2024, salaries: 929841987.0, materials: 11002242960.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 3047331964.0, projectGrants: 0, projectLoans: 0, total: 14979416911.0 },
    { ministryCode: 'PRES', year: 2025, salaries: 535066192.0, materials: 2189567381.0, transfers: 1201922362.0, grantsCurrentExp: 0, internalInvestment: 1137491610.0, projectGrants: 0, projectLoans: 824000000.0, total: 5888047545.0 },
    { ministryCode: 'PRIM', year: 2025, salaries: 155887685.0, materials: 116394306.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 68775000.0, projectGrants: 0, projectLoans: 0, total: 341056991.0 },
    { ministryCode: 'MJ', year: 2025, salaries: 794955491.0, materials: 385844367.0, transfers: 141932200.0, grantsCurrentExp: 0, internalInvestment: 138191325.0, projectGrants: 0, projectLoans: 0, total: 1460923383.0 },
    { ministryCode: 'MI', year: 2025, salaries: 3785846156.0, materials: 2252266440.0, transfers: 536518847.0, grantsCurrentExp: 0, internalInvestment: 1253505173.0, projectGrants: 257000000.0, projectLoans: 250000000.0, total: 8335136616.0 },
    { ministryCode: 'MD', year: 2025, salaries: 10285721146.0, materials: 7159820713.0, transfers: 1245684586.0, grantsCurrentExp: 0, internalInvestment: 1199669755.0, projectGrants: 0, projectLoans: 0, total: 19890896200.0 },
    { ministryCode: 'MAE', year: 2025, salaries: 1388560851.0, materials: 3357031130.0, transfers: 29155209.0, grantsCurrentExp: 0, internalInvestment: 43065255.0, projectGrants: 0, projectLoans: 0, total: 4817812445.0 },
    { ministryCode: 'MEF', year: 2025, salaries: 256438112.0, materials: 68809260.0, transfers: 649975289.0, grantsCurrentExp: 0, internalInvestment: 11250000.0, projectGrants: 250000000.0, projectLoans: 1085000000.0, total: 2321472661.0 },
    { ministryCode: 'MC', year: 2025, salaries: 82682849.0, materials: 68097578.0, transfers: 219182376.0, grantsCurrentExp: 0, internalInvestment: 63198531.0, projectGrants: 0, projectLoans: 0, total: 433161334.0 },
    { ministryCode: 'MEQI', year: 2025, salaries: 1240309859.0, materials: 325237931.0, transfers: 336237861.0, grantsCurrentExp: 0, internalInvestment: 1863263396.0, projectGrants: 477000000.0, projectLoans: 1892000000.0, total: 6134049047.0 },
    { ministryCode: 'MEN', year: 2025, salaries: 12776672812.0, materials: 1288854092.0, transfers: 257713367.0, grantsCurrentExp: 0, internalInvestment: 1800675025.0, projectGrants: 250000000.0, projectLoans: 650000000.0, total: 17023915296.0 },
    { ministryCode: 'MDEC', year: 2025, salaries: 55063249.0, materials: 81054514.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 14625000.0, projectGrants: 150000000.0, projectLoans: 0, total: 300742763.0 },
    { ministryCode: 'MT', year: 2025, salaries: 218515070.0, materials: 108953169.0, transfers: 167205699.0, grantsCurrentExp: 0, internalInvestment: 89712282.0, projectGrants: 75000000.0, projectLoans: 337000000.0, total: 996386220.0 },
    { ministryCode: 'MINV', year: 2025, salaries: 35152509.0, materials: 60690478.0, transfers: 68728496.0, grantsCurrentExp: 0, internalInvestment: 9375000.0, projectGrants: 0, projectLoans: 0, total: 173946483.0 },
    { ministryCode: 'MS', year: 2025, salaries: 3300187539.0, materials: 2020453233.0, transfers: 3293124774.0, grantsCurrentExp: 0, internalInvestment: 865496180.0, projectGrants: 500000000.0, projectLoans: 1226000000.0, total: 11205261726.0 },
    { ministryCode: 'MENV', year: 2025, salaries: 276003084.0, materials: 50651469.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 52500000.0, projectGrants: 99000000.0, projectLoans: 0, total: 478154553.0 },
    { ministryCode: 'MAGR', year: 2025, salaries: 609009338.0, materials: 223254796.0, transfers: 35000000.0, grantsCurrentExp: 0, internalInvestment: 1518559204.0, projectGrants: 3071000000.0, projectLoans: 3278000000.0, total: 8734823338.0 },
    { ministryCode: 'MENER', year: 2025, salaries: 412137423.0, materials: 66253861.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 88637025.0, projectGrants: 100000000.0, projectLoans: 468000000.0, total: 1135028309.0 },
    { ministryCode: 'MJC', year: 2025, salaries: 250264573.0, materials: 596967080.0, transfers: 439361722.0, grantsCurrentExp: 0, internalInvestment: 249241214.0, projectGrants: 0, projectLoans: 0, total: 1535834589.0 },
    { ministryCode: 'MCOM', year: 2025, salaries: 371163763.0, materials: 171781970.0, transfers: 1111522256.0, grantsCurrentExp: 0, internalInvestment: 350685156.0, projectGrants: 0, projectLoans: 0, total: 2005153145.0 },
    { ministryCode: 'MFF', year: 2025, salaries: 144885552.0, materials: 94647388.0, transfers: 99000000.0, grantsCurrentExp: 0, internalInvestment: 118500000.0, projectGrants: 0, projectLoans: 0, total: 457032940.0 },
    { ministryCode: 'MAM', year: 2025, salaries: 73386432.0, materials: 351288538.0, transfers: 63770000.0, grantsCurrentExp: 0, internalInvestment: 273786192.0, projectGrants: 0, projectLoans: 0, total: 762231162.0 },
    { ministryCode: 'MAS', year: 2025, salaries: 144354031.0, materials: 41332403.0, transfers: 161856250.0, grantsCurrentExp: 0, internalInvestment: 728663863.0, projectGrants: 997000000.0, projectLoans: 0, total: 2073206547.0 },
    { ministryCode: 'MESUP', year: 2025, salaries: 83825122.0, materials: 70151969.0, transfers: 5091593457.0, grantsCurrentExp: 0, internalInvestment: 465750000.0, projectGrants: 325000000.0, projectLoans: 285000000.0, total: 6321320548.0 },
    { ministryCode: 'MVL', year: 2025, salaries: 134498879.0, materials: 21624754.0, transfers: 17898000.0, grantsCurrentExp: 0, internalInvestment: 150000000.0, projectGrants: 0, projectLoans: 1239000000.0, total: 1563021633.0 },
    { ministryCode: 'CGP', year: 2025, salaries: 10154439.0, materials: 10402500.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 20556939.0 },
    { ministryCode: 'MENI', year: 2025, salaries: 21367158.0, materials: 59006920.0, transfers: 56695938.0, grantsCurrentExp: 0, internalInvestment: 34500000.0, projectGrants: 0, projectLoans: 514000000.0, total: 685570016.0 },
    { ministryCode: 'SES', year: 2025, salaries: 196930978.0, materials: 187440927.0, transfers: 107742485.0, grantsCurrentExp: 0, internalInvestment: 90640362.0, projectGrants: 0, projectLoans: 0, total: 582754752.0 },
    { ministryCode: 'PP', year: 2025, salaries: 0, materials: 0, transfers: 1632556637.0, grantsCurrentExp: 0, internalInvestment: 52368862.0, projectGrants: 250000000.0, projectLoans: 0, total: 1934925499.0 },
    { ministryCode: 'CR', year: 2025, salaries: 0, materials: 0, transfers: 230730500.0, grantsCurrentExp: 0, internalInvestment: 0, projectGrants: 0, projectLoans: 0, total: 230730500.0 },
    { ministryCode: 'CL', year: 2025, salaries: 0, materials: 0, transfers: 279445590.0, grantsCurrentExp: 0, internalInvestment: 30000000.0, projectGrants: 0, projectLoans: 0, total: 309445590.0 },
    { ministryCode: 'DC', year: 2025, salaries: 929841987.0, materials: 11002242960.0, transfers: 0, grantsCurrentExp: 0, internalInvestment: 3047331964.0, projectGrants: 0, projectLoans: 0, total: 14979416911.0 },
    { ministryCode: 'MB', year: 2025, salaries: 1240677156.0, materials: 871348779.0, transfers: 4607300626.0, grantsCurrentExp: 0, internalInvestment: 889938516.0, projectGrants: 0, projectLoans: 0, total: 7609265077.0 },
  ];

  // Get trendConfig for linking historical data
  const trendConfig = await prisma.trendBudgetConfig.findFirst({
    where: { configCode: 'TREND-2026-2028' }
  });

  if (trendConfig) {
    for (const hb of historicalBudgetData) {
      const ministry = createdMinistries[hb.ministryCode];
      if (ministry) {
        await prisma.historicalBudget.create({
          data: {
            trendConfigId: trendConfig.id,
            ministryId: ministry.id,
            fiscalYear: hb.year,
            budgetAmount: hb.total,
            executedAmount: hb.year < 2025 ? hb.total : null,
            importSource: 'EXCEL',
            importedAt: new Date(),
            notes: `Données historiques`,
          },
        });
      }
    }
    console.log(`✅ 96 enregistrements de données historiques créés`);
  }


  // ============================================
  // 14. PROGRAMMES, ACTIONS, ACTIVITÉS (Démonstration)
  // ============================================
  console.log('📝 Création des programmes, actions et activités...');

  // Programmes pour Ministère de l'Éducation (MEN)
  const progEducation1 = await prisma.program.upsert({
    where: { code: 'PROG-EDU-001' },
    update: {},
    create: {
      code: 'PROG-EDU-001',
      name: 'Éducation de Base et Alphabétisation',
      nameEn: 'Basic Education and Literacy',
      description: "Programme d'accès universel à l'éducation primaire et secondaire",
      objective: 'Atteindre un taux de scolarisation de 100% au primaire',
      ministryId: createdMinistries['MEN'].id,
      isActive: true,
    },
  });

  const progEducation2 = await prisma.program.upsert({
    where: { code: 'PROG-EDU-002' },
    update: {},
    create: {
      code: 'PROG-EDU-002',
      name: 'Qualité et Performance Éducative',
      nameEn: 'Educational Quality and Performance',
      description: "Amélioration de la qualité de l'enseignement",
      objective: 'Améliorer le taux de réussite aux examens nationaux',
      ministryId: createdMinistries['MEN'].id,
      isActive: true,
    },
  });

  // Programmes pour Ministère de la Santé (MS)
  const progSante1 = await prisma.program.upsert({
    where: { code: 'PROG-SAN-001' },
    update: {},
    create: {
      code: 'PROG-SAN-001',
      name: 'Soins de Santé Primaires',
      nameEn: 'Primary Health Care',
      description: 'Accès aux soins de santé de base pour tous',
      objective: 'Réduire la mortalité infantile et maternelle',
      ministryId: createdMinistries['MS'].id,
      isActive: true,
    },
  });

  const progSante2 = await prisma.program.upsert({
    where: { code: 'PROG-SAN-002' },
    update: {},
    create: {
      code: 'PROG-SAN-002',
      name: 'Lutte contre les Maladies',
      nameEn: 'Disease Control',
      description: 'Prévention et traitement des maladies endémiques',
      objective: 'Réduire l incidence des maladies transmissibles',
      ministryId: createdMinistries['MS'].id,
      isActive: true,
    },
  });

  // Programmes pour Ministère de l'Agriculture (MAGR)
  const progAgri1 = await prisma.program.upsert({
    where: { code: 'PROG-AGR-001' },
    update: {},
    create: {
      code: 'PROG-AGR-001',
      name: 'Sécurité Alimentaire',
      nameEn: 'Food Security',
      description: 'Assurer la sécurité alimentaire nationale',
      objective: 'Augmenter la production agricole locale de 30%',
      ministryId: createdMinistries['MAGR'].id,
      isActive: true,
    },
  });

  // Programmes pour Ministère de l'Énergie (MENER)
  const progEnergie1 = await prisma.program.upsert({
    where: { code: 'PROG-ENE-001' },
    update: {},
    create: {
      code: 'PROG-ENE-001',
      name: 'Transition Énergétique',
      nameEn: 'Energy Transition',
      description: 'Développement des énergies renouvelables',
      objective: 'Porter la part des énergies renouvelables à 50%',
      ministryId: createdMinistries['MENER'].id,
      isActive: true,
    },
  });

  // Programmes pour Ministère des Finances (MB)
  const progFinances1 = await prisma.program.upsert({
    where: { code: 'PROG-FIN-001' },
    update: {},
    create: {
      code: 'PROG-FIN-001',
      name: 'Gestion des Finances Publiques',
      nameEn: 'Public Finance Management',
      description: 'Modernisation de la gestion budgétaire',
      objective: 'Améliorer la transparence budgétaire',
      ministryId: createdMinistries['MB'].id,
      isActive: true,
    },
  });

  console.log('✅ 7 programmes créés');

  // Actions pour Programme Éducation de Base
  const actionEdu1 = await prisma.action.upsert({
    where: { code: 'ACT-EDU-001' },
    update: {},
    create: {
      code: 'ACT-EDU-001',
      name: 'Construction et réhabilitation des écoles',
      nameEn: 'School construction and rehabilitation',
      description: 'Construction de nouvelles écoles',
      programId: progEducation1.id,
      isActive: true,
    },
  });

  const actionEdu2 = await prisma.action.upsert({
    where: { code: 'ACT-EDU-002' },
    update: {},
    create: {
      code: 'ACT-EDU-002',
      name: 'Formation des enseignants',
      nameEn: 'Teacher training',
      description: 'Formation initiale et continue des enseignants',
      programId: progEducation1.id,
      isActive: true,
    },
  });

  const actionEdu3 = await prisma.action.upsert({
    where: { code: 'ACT-EDU-003' },
    update: {},
    create: {
      code: 'ACT-EDU-003',
      name: 'Fournitures scolaires',
      nameEn: 'School supplies',
      description: 'Distribution de manuels et fournitures',
      programId: progEducation2.id,
      isActive: true,
    },
  });

  // Actions pour Programme Santé
  const actionSan1 = await prisma.action.upsert({
    where: { code: 'ACT-SAN-001' },
    update: {},
    create: {
      code: 'ACT-SAN-001',
      name: 'Vaccination et prévention',
      nameEn: 'Vaccination and prevention',
      description: 'Programmes de vaccination',
      programId: progSante1.id,
      isActive: true,
    },
  });

  const actionSan2 = await prisma.action.upsert({
    where: { code: 'ACT-SAN-002' },
    update: {},
    create: {
      code: 'ACT-SAN-002',
      name: 'Équipement des centres de santé',
      nameEn: 'Health center equipment',
      description: 'Acquisition équipements médicaux',
      programId: progSante1.id,
      isActive: true,
    },
  });

  // Actions pour Programme Agriculture
  const actionAgr1 = await prisma.action.upsert({
    where: { code: 'ACT-AGR-001' },
    update: {},
    create: {
      code: 'ACT-AGR-001',
      name: 'Irrigation et gestion de eau',
      nameEn: 'Irrigation and water management',
      description: 'Développement des systèmes irrigation',
      programId: progAgri1.id,
      isActive: true,
    },
  });

  const actionAgr2 = await prisma.action.upsert({
    where: { code: 'ACT-AGR-002' },
    update: {},
    create: {
      code: 'ACT-AGR-002',
      name: 'Appui aux agriculteurs',
      nameEn: 'Farmer support',
      description: 'Formation et appui technique',
      programId: progAgri1.id,
      isActive: true,
    },
  });

  console.log('✅ 7 actions créées');

  // Activités pour Actions Éducation
  await prisma.activity.upsert({
    where: { code: 'ACTV-EDU-001' },
    update: {},
    create: {
      code: 'ACTV-EDU-001',
      name: 'Construction écoles primaires',
      nameEn: 'Primary school construction',
      description: 'Construction de 10 écoles primaires',
      actionId: actionEdu1.id,
      isActive: true,
    },
  });

  await prisma.activity.upsert({
    where: { code: 'ACTV-EDU-002' },
    update: {},
    create: {
      code: 'ACTV-EDU-002',
      name: 'Réhabilitation salles de classe',
      nameEn: 'Classroom rehabilitation',
      description: 'Réhabilitation de 50 salles de classe',
      actionId: actionEdu1.id,
      isActive: true,
    },
  });

  await prisma.activity.upsert({
    where: { code: 'ACTV-EDU-003' },
    update: {},
    create: {
      code: 'ACTV-EDU-003',
      name: 'Sessions formation pédagogique',
      nameEn: 'Pedagogical training sessions',
      description: 'Organisation de 20 sessions de formation',
      actionId: actionEdu2.id,
      isActive: true,
    },
  });

  await prisma.activity.upsert({
    where: { code: 'ACTV-EDU-004' },
    update: {},
    create: {
      code: 'ACTV-EDU-004',
      name: 'Achat manuels scolaires',
      nameEn: 'Textbook procurement',
      description: 'Achat de 50 000 manuels scolaires',
      actionId: actionEdu3.id,
      isActive: true,
    },
  });

  // Activités pour Actions Santé
  await prisma.activity.upsert({
    where: { code: 'ACTV-SAN-001' },
    update: {},
    create: {
      code: 'ACTV-SAN-001',
      name: 'Campagne vaccination enfants',
      nameEn: 'Child vaccination campaign',
      description: 'Vaccination de 100 000 enfants',
      actionId: actionSan1.id,
      isActive: true,
    },
  });

  await prisma.activity.upsert({
    where: { code: 'ACTV-SAN-002' },
    update: {},
    create: {
      code: 'ACTV-SAN-002',
      name: 'Achat équipements médicaux',
      nameEn: 'Medical equipment procurement',
      description: 'Équipement de 5 centres de santé',
      actionId: actionSan2.id,
      isActive: true,
    },
  });

  // Activités pour Actions Agriculture
  await prisma.activity.upsert({
    where: { code: 'ACTV-AGR-001' },
    update: {},
    create: {
      code: 'ACTV-AGR-001',
      name: 'Installation systèmes goutte-à-goutte',
      nameEn: 'Drip irrigation installation',
      description: 'Installation sur 500 hectares',
      actionId: actionAgr1.id,
      isActive: true,
    },
  });

  await prisma.activity.upsert({
    where: { code: 'ACTV-AGR-002' },
    update: {},
    create: {
      code: 'ACTV-AGR-002',
      name: 'Formation techniques agricoles',
      nameEn: 'Agricultural training',
      description: 'Formation de 200 agriculteurs',
      actionId: actionAgr2.id,
      isActive: true,
    },
  });

  console.log('✅ 8 activités créées');

  // ============================================
  // RÉSUMÉ FINAL
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ SEEDING TERMINÉ AVEC SUCCÈS!');
  console.log('='.repeat(60));
  console.log('\n📊 Données réelles Djibouti intégrées:');
  console.log(`  - ${ministriesData.length} ministères/institutions`);
  console.log(`  - ${ceilingsCount} plafonds ministériels (2028-2030)`);
  console.log('  - CBMT 2026-2028 avec agrégats par nature économique');
  console.log('  - TOFE prévisionnel 2026-2028');
  console.log('  - Scénario CDMT Global actif');
  console.log('\n📈 Totaux CBMT (en millions FDJ):');
  console.log(`  - 2026: ${total2026.toLocaleString()} M FDJ`);
  console.log(`  - 2027: ${total2027.toLocaleString()} M FDJ`);
  console.log(`  - 2028: ${total2028.toLocaleString()} M FDJ`);
  console.log('\n🔑 Credentials:');
  console.log('  Admin: admin@finances.dj / Admin@2026');
  console.log('  Budget: budget@finances.dj / Admin@2026\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
