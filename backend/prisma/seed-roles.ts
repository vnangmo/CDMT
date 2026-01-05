import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed complet du système RBAC pour CDMT
 *
 * 7 Rôles principaux:
 * 1. ADMIN_SYSTEM - Administrateur Système
 * 2. DIR_BUDGET - Direction du Budget (pilotage CDMT, cadrage macro, CBMT)
 * 3. DIR_PLANIFICATION - Direction de la Planification
 * 4. MINISTRY - Ministères Sectoriels
 * 5. DIR_DETTE - Direction de la Dette
 * 6. DIR_SOLDE - Direction de la Solde
 * 7. PTF - Partenaires Techniques et Financiers
 */

async function main() {
  console.log('🚀 Début du seed RBAC...');

  // ============================================
  // DÉFINITION DES PERMISSIONS
  // ============================================

  const permissions = [
    // === ADMINISTRATION SYSTÈME ===
    { code: 'SYSTEM:ADMIN', name: 'Administration système complète', module: 'SYSTEM' },
    { code: 'SYSTEM:CONFIG', name: 'Configuration système', module: 'SYSTEM' },
    { code: 'SYSTEM:LOGS', name: 'Consultation des logs', module: 'SYSTEM' },
    { code: 'SYSTEM:BACKUP', name: 'Gestion des sauvegardes', module: 'SYSTEM' },

    // === GESTION DES UTILISATEURS ===
    { code: 'USER:CREATE', name: 'Créer des utilisateurs', module: 'USER' },
    { code: 'USER:READ', name: 'Consulter les utilisateurs', module: 'USER' },
    { code: 'USER:UPDATE', name: 'Modifier les utilisateurs', module: 'USER' },
    { code: 'USER:DELETE', name: 'Supprimer les utilisateurs', module: 'USER' },
    { code: 'USER:ASSIGN_ROLE', name: 'Assigner des rôles', module: 'USER' },

    // === GESTION DES RÔLES ===
    { code: 'ROLE:CREATE', name: 'Créer des rôles', module: 'ROLE' },
    { code: 'ROLE:READ', name: 'Consulter les rôles', module: 'ROLE' },
    { code: 'ROLE:UPDATE', name: 'Modifier les rôles', module: 'ROLE' },
    { code: 'ROLE:DELETE', name: 'Supprimer les rôles', module: 'ROLE' },
    { code: 'ROLE:ASSIGN_PERMISSION', name: 'Assigner des permissions', module: 'ROLE' },

    // === RÉFÉRENTIELS ===
    { code: 'REF:CREATE', name: 'Créer des référentiels', module: 'REFERENTIEL' },
    { code: 'REF:READ', name: 'Consulter les référentiels', module: 'REFERENTIEL' },
    { code: 'REF:UPDATE', name: 'Modifier les référentiels', module: 'REFERENTIEL' },
    { code: 'REF:DELETE', name: 'Supprimer les référentiels', module: 'REFERENTIEL' },
    { code: 'REF:IMPORT', name: 'Importer des référentiels', module: 'REFERENTIEL' },
    { code: 'REF:EXPORT', name: 'Exporter des référentiels', module: 'REFERENTIEL' },

    // === CADRE MACROÉCONOMIQUE ===
    { code: 'MACRO:CREATE', name: 'Créer le cadre macro', module: 'MACRO' },
    { code: 'MACRO:READ', name: 'Consulter le cadre macro', module: 'MACRO' },
    { code: 'MACRO:UPDATE', name: 'Modifier le cadre macro', module: 'MACRO' },
    { code: 'MACRO:DELETE', name: 'Supprimer le cadre macro', module: 'MACRO' },
    { code: 'MACRO:VALIDATE', name: 'Valider le cadre macro', module: 'MACRO' },
    { code: 'MACRO:PUBLISH', name: 'Publier le cadre macro', module: 'MACRO' },

    // === CBMT (Cadre Budgétaire à Moyen Terme) ===
    { code: 'CBMT:CREATE', name: 'Créer le CBMT', module: 'CBMT' },
    { code: 'CBMT:READ', name: 'Consulter le CBMT', module: 'CBMT' },
    { code: 'CBMT:UPDATE', name: 'Modifier le CBMT', module: 'CBMT' },
    { code: 'CBMT:DELETE', name: 'Supprimer le CBMT', module: 'CBMT' },
    { code: 'CBMT:VALIDATE', name: 'Valider le CBMT', module: 'CBMT' },
    { code: 'CBMT:PUBLISH', name: 'Publier le CBMT', module: 'CBMT' },

    // === CDMT GLOBAL ===
    { code: 'CDMT_GLOBAL:CREATE', name: 'Créer le CDMT global', module: 'CDMT_GLOBAL' },
    { code: 'CDMT_GLOBAL:READ', name: 'Consulter le CDMT global', module: 'CDMT_GLOBAL' },
    { code: 'CDMT_GLOBAL:UPDATE', name: 'Modifier le CDMT global', module: 'CDMT_GLOBAL' },
    { code: 'CDMT_GLOBAL:DELETE', name: 'Supprimer le CDMT global', module: 'CDMT_GLOBAL' },
    { code: 'CDMT_GLOBAL:VALIDATE', name: 'Valider le CDMT global', module: 'CDMT_GLOBAL' },
    { code: 'CDMT_GLOBAL:PUBLISH', name: 'Publier le CDMT global', module: 'CDMT_GLOBAL' },

    // === CDMT SECTORIEL ===
    { code: 'CDMT_SECTOR:CREATE', name: 'Créer le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:READ', name: 'Consulter le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:UPDATE', name: 'Modifier le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:DELETE', name: 'Supprimer le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:SUBMIT', name: 'Soumettre le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:VALIDATE', name: 'Valider le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:RETURN', name: 'Retourner le CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:VIEW_OWN', name: 'Voir son propre CDMT sectoriel', module: 'CDMT_SECTOR' },
    { code: 'CDMT_SECTOR:VIEW_ALL', name: 'Voir tous les CDMT sectoriels', module: 'CDMT_SECTOR' },

    // === BUDGET ===
    { code: 'BUDGET:CREATE', name: 'Créer des budgets', module: 'BUDGET' },
    { code: 'BUDGET:READ', name: 'Consulter les budgets', module: 'BUDGET' },
    { code: 'BUDGET:UPDATE', name: 'Modifier les budgets', module: 'BUDGET' },
    { code: 'BUDGET:DELETE', name: 'Supprimer les budgets', module: 'BUDGET' },
    { code: 'BUDGET:IMPORT', name: 'Importer des budgets', module: 'BUDGET' },
    { code: 'BUDGET:EXPORT', name: 'Exporter des budgets', module: 'BUDGET' },
    { code: 'BUDGET:READ_OWN', name: 'Consulter ses propres budgets', module: 'BUDGET' },

    // === EXÉCUTION ===
    { code: 'EXECUTION:CREATE', name: 'Créer des exécutions', module: 'EXECUTION' },
    { code: 'EXECUTION:READ', name: 'Consulter les exécutions', module: 'EXECUTION' },
    { code: 'EXECUTION:UPDATE', name: 'Modifier les exécutions', module: 'EXECUTION' },
    { code: 'EXECUTION:DELETE', name: 'Supprimer les exécutions', module: 'EXECUTION' },
    { code: 'EXECUTION:IMPORT', name: 'Importer des exécutions', module: 'EXECUTION' },
    { code: 'EXECUTION:EXPORT', name: 'Exporter des exécutions', module: 'EXECUTION' },

    // === PIE (Plan d'Investissement de l'État) ===
    { code: 'PIE:CREATE', name: 'Créer des PIE', module: 'PIE' },
    { code: 'PIE:READ', name: 'Consulter les PIE', module: 'PIE' },
    { code: 'PIE:UPDATE', name: 'Modifier les PIE', module: 'PIE' },
    { code: 'PIE:DELETE', name: 'Supprimer les PIE', module: 'PIE' },
    { code: 'PIE:IMPORT', name: 'Importer des PIE', module: 'PIE' },
    { code: 'PIE:EXPORT', name: 'Exporter des PIE', module: 'PIE' },
    { code: 'PIE:VALIDATE', name: 'Valider les PIE', module: 'PIE' },

    // === PIP (Programme d'Investissement Public) ===
    { code: 'PIP:CREATE', name: 'Créer des PIP', module: 'PIP' },
    { code: 'PIP:READ', name: 'Consulter les PIP', module: 'PIP' },
    { code: 'PIP:UPDATE', name: 'Modifier les PIP', module: 'PIP' },
    { code: 'PIP:DELETE', name: 'Supprimer les PIP', module: 'PIP' },
    { code: 'PIP:IMPORT', name: 'Importer des PIP', module: 'PIP' },
    { code: 'PIP:EXPORT', name: 'Exporter des PIP', module: 'PIP' },
    { code: 'PIP:VALIDATE', name: 'Valider les PIP', module: 'PIP' },

    // === DETTE ===
    { code: 'DETTE:CREATE', name: 'Créer des dettes', module: 'DETTE' },
    { code: 'DETTE:READ', name: 'Consulter les dettes', module: 'DETTE' },
    { code: 'DETTE:UPDATE', name: 'Modifier les dettes', module: 'DETTE' },
    { code: 'DETTE:DELETE', name: 'Supprimer les dettes', module: 'DETTE' },
    { code: 'DETTE:IMPORT', name: 'Importer des dettes', module: 'DETTE' },
    { code: 'DETTE:EXPORT', name: 'Exporter des dettes', module: 'DETTE' },
    { code: 'DETTE:VALIDATE', name: 'Valider les projections de dette', module: 'DETTE' },

    // === SOLDE ===
    { code: 'SOLDE:CREATE', name: 'Créer des données de solde', module: 'SOLDE' },
    { code: 'SOLDE:READ', name: 'Consulter les soldes', module: 'SOLDE' },
    { code: 'SOLDE:UPDATE', name: 'Modifier les soldes', module: 'SOLDE' },
    { code: 'SOLDE:DELETE', name: 'Supprimer les soldes', module: 'SOLDE' },
    { code: 'SOLDE:IMPORT', name: 'Importer des soldes', module: 'SOLDE' },
    { code: 'SOLDE:EXPORT', name: 'Exporter des soldes', module: 'SOLDE' },

    // === VERSIONS ===
    { code: 'VERSION:CREATE', name: 'Créer des versions', module: 'VERSION' },
    { code: 'VERSION:READ', name: 'Consulter les versions', module: 'VERSION' },
    { code: 'VERSION:UPDATE', name: 'Modifier les versions', module: 'VERSION' },
    { code: 'VERSION:DELETE', name: 'Supprimer les versions', module: 'VERSION' },
    { code: 'VERSION:RESTORE', name: 'Restaurer des versions', module: 'VERSION' },
    { code: 'VERSION:COMPARE', name: 'Comparer des versions', module: 'VERSION' },

    // === REPORTING & ANALYTICS ===
    { code: 'REPORT:CREATE', name: 'Créer des rapports', module: 'REPORT' },
    { code: 'REPORT:READ', name: 'Consulter les rapports', module: 'REPORT' },
    { code: 'REPORT:EXPORT', name: 'Exporter des rapports', module: 'REPORT' },
    { code: 'ANALYTICS:VIEW', name: 'Voir les analytics', module: 'ANALYTICS' },
    { code: 'DASHBOARD:VIEW', name: 'Voir les tableaux de bord', module: 'DASHBOARD' },

    // === WORKFLOW ===
    { code: 'WORKFLOW:SUBMIT', name: 'Soumettre pour validation', module: 'WORKFLOW' },
    { code: 'WORKFLOW:VALIDATE', name: 'Valider un workflow', module: 'WORKFLOW' },
    { code: 'WORKFLOW:REJECT', name: 'Rejeter un workflow', module: 'WORKFLOW' },
    { code: 'WORKFLOW:VIEW', name: 'Voir l\'état du workflow', module: 'WORKFLOW' },

    // === COMMENTAIRES ===
    { code: 'COMMENT:CREATE', name: 'Créer des commentaires', module: 'COMMENT' },
    { code: 'COMMENT:READ', name: 'Lire les commentaires', module: 'COMMENT' },
    { code: 'COMMENT:UPDATE', name: 'Modifier les commentaires', module: 'COMMENT' },
    { code: 'COMMENT:DELETE', name: 'Supprimer les commentaires', module: 'COMMENT' },

    // === NOTIFICATIONS ===
    { code: 'NOTIFICATION:READ', name: 'Lire les notifications', module: 'NOTIFICATION' },
    { code: 'NOTIFICATION:SEND', name: 'Envoyer des notifications', module: 'NOTIFICATION' },

    // === AUDIT ===
    { code: 'AUDIT:READ', name: 'Consulter les logs d\'audit', module: 'AUDIT' },
    { code: 'AUDIT:EXPORT', name: 'Exporter les logs d\'audit', module: 'AUDIT' },
  ];

  console.log(`📝 Création de ${permissions.length} permissions...`);

  // Créer les permissions
  const createdPermissions = [];
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    createdPermissions.push(created);
  }

  console.log(`✅ ${createdPermissions.length} permissions créées`);

  // ============================================
  // DÉFINITION DES RÔLES
  // ============================================

  const roles = [
    {
      code: 'ADMIN_SYSTEM',
      name: 'Administrateur Système',
      description: 'Accès complet au système, gestion des utilisateurs et configuration',
    },
    {
      code: 'DIR_BUDGET',
      name: 'Direction du Budget',
      description: 'Pilotage CDMT, cadrage macroéconomique, CBMT, consolidation des CDMT sectoriels',
    },
    {
      code: 'DIR_PLANIFICATION',
      name: 'Direction de la Planification',
      description: 'Gestion PIE et PIP, validation des investissements',
    },
    {
      code: 'MINISTRY',
      name: 'Ministère Sectoriel',
      description: 'Élaboration et soumission du CDMT sectoriel',
    },
    {
      code: 'DIR_DETTE',
      name: 'Direction de la Dette',
      description: 'Gestion de la dette publique, projections de service de la dette',
    },
    {
      code: 'DIR_SOLDE',
      name: 'Direction de la Solde',
      description: 'Gestion des données de masse salariale',
    },
    {
      code: 'PTF',
      name: 'Partenaire Technique et Financier',
      description: 'Consultation et suivi des documents CDMT',
    },
  ];

  console.log(`👥 Création de ${roles.length} rôles...`);

  const createdRoles = [];
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
    createdRoles.push(created);
  }

  console.log(`✅ ${createdRoles.length} rôles créés`);

  // ============================================
  // MAPPING RÔLES → PERMISSIONS
  // ============================================

  const rolePermissionsMap: { [key: string]: string[] } = {
    // === ADMINISTRATEUR SYSTÈME ===
    ADMIN_SYSTEM: [
      // Toutes les permissions SYSTEM
      'SYSTEM:ADMIN',
      'SYSTEM:CONFIG',
      'SYSTEM:LOGS',
      'SYSTEM:BACKUP',
      // Toutes les permissions USER
      'USER:CREATE',
      'USER:READ',
      'USER:UPDATE',
      'USER:DELETE',
      'USER:ASSIGN_ROLE',
      // Toutes les permissions ROLE
      'ROLE:CREATE',
      'ROLE:READ',
      'ROLE:UPDATE',
      'ROLE:DELETE',
      'ROLE:ASSIGN_PERMISSION',
      // Toutes les permissions REF
      'REF:CREATE',
      'REF:READ',
      'REF:UPDATE',
      'REF:DELETE',
      'REF:IMPORT',
      'REF:EXPORT',
      // Consultation avancée
      'MACRO:READ',
      'CBMT:READ',
      'CDMT_GLOBAL:READ',
      'CDMT_SECTOR:VIEW_ALL',
      'BUDGET:READ',
      'EXECUTION:READ',
      'PIE:READ',
      'PIP:READ',
      'DETTE:READ',
      'SOLDE:READ',
      // Versions
      'VERSION:CREATE',
      'VERSION:READ',
      'VERSION:UPDATE',
      'VERSION:DELETE',
      'VERSION:RESTORE',
      'VERSION:COMPARE',
      // Audit
      'AUDIT:READ',
      'AUDIT:EXPORT',
      // Reports
      'REPORT:CREATE',
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
    ],

    // === DIRECTION DU BUDGET ===
    DIR_BUDGET: [
      // Consultation utilisateurs/rôles
      'USER:READ',
      'ROLE:READ',
      // Référentiels complets
      'REF:CREATE',
      'REF:READ',
      'REF:UPDATE',
      'REF:DELETE',
      'REF:IMPORT',
      'REF:EXPORT',
      // Cadre macro complet
      'MACRO:CREATE',
      'MACRO:READ',
      'MACRO:UPDATE',
      'MACRO:DELETE',
      'MACRO:VALIDATE',
      'MACRO:PUBLISH',
      // CBMT complet
      'CBMT:CREATE',
      'CBMT:READ',
      'CBMT:UPDATE',
      'CBMT:DELETE',
      'CBMT:VALIDATE',
      'CBMT:PUBLISH',
      // CDMT Global complet
      'CDMT_GLOBAL:CREATE',
      'CDMT_GLOBAL:READ',
      'CDMT_GLOBAL:UPDATE',
      'CDMT_GLOBAL:DELETE',
      'CDMT_GLOBAL:VALIDATE',
      'CDMT_GLOBAL:PUBLISH',
      // CDMT Sectoriels - Tous
      'CDMT_SECTOR:READ',
      'CDMT_SECTOR:VIEW_ALL',
      'CDMT_SECTOR:VALIDATE',
      'CDMT_SECTOR:RETURN',
      // Budgets complets
      'BUDGET:CREATE',
      'BUDGET:READ',
      'BUDGET:UPDATE',
      'BUDGET:DELETE',
      'BUDGET:IMPORT',
      'BUDGET:EXPORT',
      // Exécutions
      'EXECUTION:CREATE',
      'EXECUTION:READ',
      'EXECUTION:UPDATE',
      'EXECUTION:DELETE',
      'EXECUTION:IMPORT',
      'EXECUTION:EXPORT',
      // PIE lecture
      'PIE:READ',
      'PIE:VALIDATE',
      // PIP lecture
      'PIP:READ',
      'PIP:VALIDATE',
      // Dette lecture
      'DETTE:READ',
      // Solde lecture
      'SOLDE:READ',
      // Versions
      'VERSION:CREATE',
      'VERSION:READ',
      'VERSION:RESTORE',
      'VERSION:COMPARE',
      // Workflow
      'WORKFLOW:SUBMIT',
      'WORKFLOW:VALIDATE',
      'WORKFLOW:REJECT',
      'WORKFLOW:VIEW',
      // Commentaires
      'COMMENT:CREATE',
      'COMMENT:READ',
      'COMMENT:UPDATE',
      'COMMENT:DELETE',
      // Notifications
      'NOTIFICATION:READ',
      'NOTIFICATION:SEND',
      // Reports
      'REPORT:CREATE',
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
      // Audit
      'AUDIT:READ',
    ],

    // === DIRECTION DE LA PLANIFICATION ===
    DIR_PLANIFICATION: [
      // Consultation
      'USER:READ',
      'ROLE:READ',
      // Référentiels lecture
      'REF:READ',
      'REF:EXPORT',
      // Cadre macro lecture
      'MACRO:READ',
      // CBMT lecture
      'CBMT:READ',
      // CDMT lecture
      'CDMT_GLOBAL:READ',
      'CDMT_SECTOR:READ',
      'CDMT_SECTOR:VIEW_ALL',
      // Budget lecture
      'BUDGET:READ',
      'BUDGET:EXPORT',
      // Exécution lecture
      'EXECUTION:READ',
      'EXECUTION:EXPORT',
      // PIE complet
      'PIE:CREATE',
      'PIE:READ',
      'PIE:UPDATE',
      'PIE:DELETE',
      'PIE:IMPORT',
      'PIE:EXPORT',
      'PIE:VALIDATE',
      // PIP complet
      'PIP:CREATE',
      'PIP:READ',
      'PIP:UPDATE',
      'PIP:DELETE',
      'PIP:IMPORT',
      'PIP:EXPORT',
      'PIP:VALIDATE',
      // Dette lecture
      'DETTE:READ',
      // Solde lecture
      'SOLDE:READ',
      // Versions
      'VERSION:CREATE',
      'VERSION:READ',
      'VERSION:COMPARE',
      // Workflow
      'WORKFLOW:SUBMIT',
      'WORKFLOW:VALIDATE',
      'WORKFLOW:VIEW',
      // Commentaires
      'COMMENT:CREATE',
      'COMMENT:READ',
      'COMMENT:UPDATE',
      // Notifications
      'NOTIFICATION:READ',
      // Reports
      'REPORT:CREATE',
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
    ],

    // === MINISTÈRE SECTORIEL ===
    MINISTRY: [
      // Référentiels lecture seule
      'REF:READ',
      // Cadre macro lecture
      'MACRO:READ',
      // CBMT lecture
      'CBMT:READ',
      // CDMT Global lecture
      'CDMT_GLOBAL:READ',
      // CDMT Sectoriel - Son propre uniquement
      'CDMT_SECTOR:CREATE',
      'CDMT_SECTOR:READ',
      'CDMT_SECTOR:UPDATE',
      'CDMT_SECTOR:DELETE',
      'CDMT_SECTOR:SUBMIT',
      'CDMT_SECTOR:VIEW_OWN',
      // Budget - Ses propres budgets
      'BUDGET:READ_OWN',
      'BUDGET:EXPORT',
      // Exécution - Ses propres exécutions
      'EXECUTION:READ',
      'EXECUTION:EXPORT',
      // PIE lecture
      'PIE:READ',
      // PIP lecture
      'PIP:READ',
      // Versions
      'VERSION:READ',
      'VERSION:COMPARE',
      // Workflow
      'WORKFLOW:SUBMIT',
      'WORKFLOW:VIEW',
      // Commentaires
      'COMMENT:CREATE',
      'COMMENT:READ',
      // Notifications
      'NOTIFICATION:READ',
      // Reports limités
      'REPORT:READ',
      'REPORT:EXPORT',
      'DASHBOARD:VIEW',
    ],

    // === DIRECTION DE LA DETTE ===
    DIR_DETTE: [
      // Consultation
      'USER:READ',
      'ROLE:READ',
      // Référentiels lecture
      'REF:READ',
      // Cadre macro lecture
      'MACRO:READ',
      // CBMT lecture
      'CBMT:READ',
      // CDMT lecture
      'CDMT_GLOBAL:READ',
      'CDMT_SECTOR:READ',
      // Budget lecture
      'BUDGET:READ',
      // Exécution lecture
      'EXECUTION:READ',
      // PIE lecture
      'PIE:READ',
      // PIP lecture
      'PIP:READ',
      // Dette complet
      'DETTE:CREATE',
      'DETTE:READ',
      'DETTE:UPDATE',
      'DETTE:DELETE',
      'DETTE:IMPORT',
      'DETTE:EXPORT',
      'DETTE:VALIDATE',
      // Solde lecture
      'SOLDE:READ',
      // Versions
      'VERSION:CREATE',
      'VERSION:READ',
      'VERSION:COMPARE',
      // Workflow
      'WORKFLOW:SUBMIT',
      'WORKFLOW:VALIDATE',
      'WORKFLOW:VIEW',
      // Commentaires
      'COMMENT:CREATE',
      'COMMENT:READ',
      'COMMENT:UPDATE',
      // Notifications
      'NOTIFICATION:READ',
      // Reports
      'REPORT:CREATE',
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
    ],

    // === DIRECTION DE LA SOLDE ===
    DIR_SOLDE: [
      // Consultation
      'USER:READ',
      'ROLE:READ',
      // Référentiels lecture
      'REF:READ',
      // Cadre macro lecture
      'MACRO:READ',
      // CBMT lecture
      'CBMT:READ',
      // CDMT lecture
      'CDMT_GLOBAL:READ',
      'CDMT_SECTOR:READ',
      // Budget lecture
      'BUDGET:READ',
      // Exécution lecture
      'EXECUTION:READ',
      // PIE lecture
      'PIE:READ',
      // PIP lecture
      'PIP:READ',
      // Dette lecture
      'DETTE:READ',
      // Solde complet
      'SOLDE:CREATE',
      'SOLDE:READ',
      'SOLDE:UPDATE',
      'SOLDE:DELETE',
      'SOLDE:IMPORT',
      'SOLDE:EXPORT',
      // Versions
      'VERSION:CREATE',
      'VERSION:READ',
      'VERSION:COMPARE',
      // Workflow
      'WORKFLOW:SUBMIT',
      'WORKFLOW:VALIDATE',
      'WORKFLOW:VIEW',
      // Commentaires
      'COMMENT:CREATE',
      'COMMENT:READ',
      'COMMENT:UPDATE',
      // Notifications
      'NOTIFICATION:READ',
      // Reports
      'REPORT:CREATE',
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
    ],

    // === PARTENAIRE TECHNIQUE ET FINANCIER (PTF) ===
    PTF: [
      // Référentiels lecture seule
      'REF:READ',
      // Cadre macro lecture
      'MACRO:READ',
      // CBMT lecture
      'CBMT:READ',
      // CDMT lecture seule
      'CDMT_GLOBAL:READ',
      'CDMT_SECTOR:READ',
      // Budget lecture
      'BUDGET:READ',
      'BUDGET:EXPORT',
      // Exécution lecture
      'EXECUTION:READ',
      'EXECUTION:EXPORT',
      // PIE lecture
      'PIE:READ',
      'PIE:EXPORT',
      // PIP lecture
      'PIP:READ',
      'PIP:EXPORT',
      // Dette lecture
      'DETTE:READ',
      // Solde lecture
      'SOLDE:READ',
      // Versions lecture
      'VERSION:READ',
      'VERSION:COMPARE',
      // Workflow lecture
      'WORKFLOW:VIEW',
      // Commentaires lecture et création
      'COMMENT:CREATE',
      'COMMENT:READ',
      // Notifications
      'NOTIFICATION:READ',
      // Reports lecture
      'REPORT:READ',
      'REPORT:EXPORT',
      'ANALYTICS:VIEW',
      'DASHBOARD:VIEW',
    ],
  };

  console.log('🔗 Association des permissions aux rôles...');

  let totalAssociations = 0;

  for (const role of createdRoles) {
    const permissionCodes = rolePermissionsMap[role.code] || [];

    for (const permCode of permissionCodes) {
      const permission = createdPermissions.find((p) => p.code === permCode);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        totalAssociations++;
      } else {
        console.warn(`⚠️  Permission non trouvée: ${permCode} pour le rôle ${role.code}`);
      }
    }

    console.log(`  ✓ ${role.name}: ${permissionCodes.length} permissions`);
  }

  console.log(`✅ ${totalAssociations} associations rôles-permissions créées`);

  // ============================================
  // CRÉATION D'UTILISATEURS DE TEST (optionnel)
  // ============================================

  console.log('\n👤 Création des utilisateurs de test...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Admin système
  const adminRole = createdRoles.find((r) => r.code === 'ADMIN_SYSTEM');
  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@finances.dj' },
      update: {
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      },
      create: {
        email: 'admin@finances.dj',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Admin système créé/mis à jour');
  }

  // Directeur du Budget
  const budgetRole = createdRoles.find((r) => r.code === 'DIR_BUDGET');
  if (budgetRole) {
    await prisma.user.upsert({
      where: { email: 'budget@finances.dj' },
      update: {
        firstName: 'Directeur',
        lastName: 'Budget',
        password: hashedPassword,
        roleId: budgetRole.id,
        isActive: true,
      },
      create: {
        email: 'budget@finances.dj',
        firstName: 'Directeur',
        lastName: 'Budget',
        password: hashedPassword,
        roleId: budgetRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Directeur Budget créé/mis à jour');
  }

  // Directeur de la Planification
  const planRole = createdRoles.find((r) => r.code === 'DIR_PLANIFICATION');
  if (planRole) {
    await prisma.user.upsert({
      where: { email: 'planification@finances.dj' },
      update: {
        firstName: 'Directeur',
        lastName: 'Planification',
        password: hashedPassword,
        roleId: planRole.id,
        isActive: true,
      },
      create: {
        email: 'planification@finances.dj',
        firstName: 'Directeur',
        lastName: 'Planification',
        password: hashedPassword,
        roleId: planRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Directeur Planification créé/mis à jour');
  }

  // Directeur de la Dette
  const detteRole = createdRoles.find((r) => r.code === 'DIR_DETTE');
  if (detteRole) {
    await prisma.user.upsert({
      where: { email: 'dette@finances.dj' },
      update: {
        firstName: 'Directeur',
        lastName: 'Dette',
        password: hashedPassword,
        roleId: detteRole.id,
        isActive: true,
      },
      create: {
        email: 'dette@finances.dj',
        firstName: 'Directeur',
        lastName: 'Dette',
        password: hashedPassword,
        roleId: detteRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Directeur Dette créé/mis à jour');
  }

  // Directeur de la Solde
  const soldeRole = createdRoles.find((r) => r.code === 'DIR_SOLDE');
  if (soldeRole) {
    await prisma.user.upsert({
      where: { email: 'solde@finances.dj' },
      update: {
        firstName: 'Directeur',
        lastName: 'Solde',
        password: hashedPassword,
        roleId: soldeRole.id,
        isActive: true,
      },
      create: {
        email: 'solde@finances.dj',
        firstName: 'Directeur',
        lastName: 'Solde',
        password: hashedPassword,
        roleId: soldeRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Directeur Solde créé/mis à jour');
  }

  // PTF
  const ptfRole = createdRoles.find((r) => r.code === 'PTF');
  if (ptfRole) {
    await prisma.user.upsert({
      where: { email: 'ptf@worldbank.org' },
      update: {
        firstName: 'Partenaire',
        lastName: 'PTF',
        password: hashedPassword,
        roleId: ptfRole.id,
        isActive: true,
      },
      create: {
        email: 'ptf@worldbank.org',
        firstName: 'Partenaire',
        lastName: 'PTF',
        password: hashedPassword,
        roleId: ptfRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ PTF créé/mis à jour');
  }

  // Ministère (nécessite un ministère existant)
  const ministry = await prisma.ministry.findFirst();
  const ministryRole = createdRoles.find((r) => r.code === 'MINISTRY');
  if (ministry && ministryRole) {
    await prisma.user.upsert({
      where: { email: 'ministry@finances.dj' },
      update: {
        firstName: 'Responsable',
        lastName: 'Ministère',
        password: hashedPassword,
        roleId: ministryRole.id,
        ministryId: ministry.id,
        isActive: true,
      },
      create: {
        email: 'ministry@finances.dj',
        firstName: 'Responsable',
        lastName: 'Ministère',
        password: hashedPassword,
        roleId: ministryRole.id,
        ministryId: ministry.id,
        isActive: true,
      },
    });
    console.log('  ✓ Utilisateur Ministère créé/mis à jour');
  }

  console.log('\n✅ Seed RBAC terminé avec succès!\n');
  console.log('📊 Résumé:');
  console.log(`   - ${createdPermissions.length} permissions`);
  console.log(`   - ${createdRoles.length} rôles`);
  console.log(`   - ${totalAssociations} associations rôles-permissions`);
  console.log(`   - 7 utilisateurs de test`);
  console.log('\n🔐 Connexion de test:');
  console.log('   Email: admin@finances.dj');
  console.log('   Password: Password123!');
  console.log('   (ou budget@finances.dj, planification@finances.dj, etc.)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
