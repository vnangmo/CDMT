# Système RBAC - Contrôle d'Accès Basé sur les Rôles

## Vue d'ensemble

Le système CDMT utilise un système de contrôle d'accès basé sur les rôles (RBAC) avec 7 rôles principaux et 110 permissions granulaires réparties sur 18 modules.

## Architecture

### Modèles de données

- **User**: Utilisateurs du système
- **Role**: Rôles (7 rôles prédéfinis)
- **Permission**: Permissions granulaires (110 permissions)
- **RolePermission**: Table de liaison entre rôles et permissions

### Les 7 Rôles

#### 1. ADMIN_SYSTEM - Administrateur Système
**Description**: Accès complet au système, gestion des utilisateurs et configuration

**Responsabilités**:
- Gestion complète des utilisateurs et des rôles
- Configuration système
- Consultation de tous les logs d'audit
- Gestion des sauvegardes
- Accès en lecture à tous les modules

**Nombre de permissions**: 43

#### 2. DIR_BUDGET - Direction du Budget
**Description**: Pilotage CDMT, cadrage macroéconomique, CBMT, consolidation des CDMT sectoriels

**Responsabilités**:
- Pilotage complet du processus CDMT
- Création et validation du cadre macroéconomique
- Élaboration et publication du CBMT
- Consolidation et validation des CDMT sectoriels
- Gestion complète des budgets et exécutions
- Gestion des référentiels

**Nombre de permissions**: 68

**Modules principaux**:
- MACRO (complet)
- CBMT (complet)
- CDMT_GLOBAL (complet)
- CDMT_SECTOR (validation/consultation tous)
- BUDGET (complet)
- EXECUTION (complet)
- REF (complet)

#### 3. DIR_PLANIFICATION - Direction de la Planification
**Description**: Gestion PIE et PIP, validation des investissements

**Responsabilités**:
- Gestion complète du PIE (Plan d'Investissement de l'État)
- Gestion complète du PIP (Programme d'Investissement Public)
- Validation des projets d'investissement
- Consultation des CDMT et budgets

**Nombre de permissions**: 44

**Modules principaux**:
- PIE (complet)
- PIP (complet)
- CDMT (consultation)
- BUDGET (consultation)

#### 4. MINISTRY - Ministère Sectoriel
**Description**: Élaboration et soumission du CDMT sectoriel

**Responsabilités**:
- Élaboration de son propre CDMT sectoriel
- Soumission du CDMT pour validation
- Consultation des référentiels
- Consultation du cadre macro et du CBMT
- Consultation de ses propres budgets

**Nombre de permissions**: 26

**Restrictions**:
- Ne peut voir que son propre CDMT sectoriel (CDMT_SECTOR:VIEW_OWN)
- Ne peut voir que ses propres budgets (BUDGET:READ_OWN)
- Pas de droits de validation
- Lecture seule sur les référentiels

#### 5. DIR_DETTE - Direction de la Dette
**Description**: Gestion de la dette publique, projections de service de la dette

**Responsabilités**:
- Gestion complète de la dette publique
- Projections du service de la dette
- Validation des projections de dette
- Consultation des CDMT et budgets

**Nombre de permissions**: 34

**Modules principaux**:
- DETTE (complet)
- CDMT (consultation)
- BUDGET (consultation)
- MACRO (consultation)

#### 6. DIR_SOLDE - Direction de la Solde
**Description**: Gestion des données de masse salariale

**Responsabilités**:
- Gestion complète des données de solde/masse salariale
- Import/export des données de solde
- Consultation des CDMT et budgets

**Nombre de permissions**: 33

**Modules principaux**:
- SOLDE (complet)
- CDMT (consultation)
- BUDGET (consultation)

#### 7. PTF - Partenaire Technique et Financier
**Description**: Consultation et suivi des documents CDMT

**Responsabilités**:
- Consultation de tous les documents CDMT
- Consultation des budgets, PIE, PIP
- Export de rapports
- Ajout de commentaires

**Nombre de permissions**: 25

**Restrictions**:
- Accès lecture seule sur tous les modules
- Peut créer et lire des commentaires
- Pas de droits de modification ou validation
- Pas d'accès aux données système

## Modules de Permissions

### SYSTEM (4 permissions)
- SYSTEM:ADMIN
- SYSTEM:CONFIG
- SYSTEM:LOGS
- SYSTEM:BACKUP

### USER (5 permissions)
- USER:CREATE
- USER:READ
- USER:UPDATE
- USER:DELETE
- USER:ASSIGN_ROLE

### ROLE (5 permissions)
- ROLE:CREATE
- ROLE:READ
- ROLE:UPDATE
- ROLE:DELETE
- ROLE:ASSIGN_PERMISSION

### REFERENTIEL (6 permissions)
- REF:CREATE
- REF:READ
- REF:UPDATE
- REF:DELETE
- REF:IMPORT
- REF:EXPORT

### MACRO (6 permissions)
- MACRO:CREATE
- MACRO:READ
- MACRO:UPDATE
- MACRO:DELETE
- MACRO:VALIDATE
- MACRO:PUBLISH

### CBMT (6 permissions)
- CBMT:CREATE
- CBMT:READ
- CBMT:UPDATE
- CBMT:DELETE
- CBMT:VALIDATE
- CBMT:PUBLISH

### CDMT_GLOBAL (6 permissions)
- CDMT_GLOBAL:CREATE
- CDMT_GLOBAL:READ
- CDMT_GLOBAL:UPDATE
- CDMT_GLOBAL:DELETE
- CDMT_GLOBAL:VALIDATE
- CDMT_GLOBAL:PUBLISH

### CDMT_SECTOR (9 permissions)
- CDMT_SECTOR:CREATE
- CDMT_SECTOR:READ
- CDMT_SECTOR:UPDATE
- CDMT_SECTOR:DELETE
- CDMT_SECTOR:SUBMIT
- CDMT_SECTOR:VALIDATE
- CDMT_SECTOR:RETURN
- CDMT_SECTOR:VIEW_OWN (Ministères uniquement)
- CDMT_SECTOR:VIEW_ALL (Dir. Budget, Dir. Planif)

### BUDGET (7 permissions)
- BUDGET:CREATE
- BUDGET:READ
- BUDGET:UPDATE
- BUDGET:DELETE
- BUDGET:IMPORT
- BUDGET:EXPORT
- BUDGET:READ_OWN (Ministères uniquement)

### EXECUTION (6 permissions)
- EXECUTION:CREATE
- EXECUTION:READ
- EXECUTION:UPDATE
- EXECUTION:DELETE
- EXECUTION:IMPORT
- EXECUTION:EXPORT

### PIE (7 permissions)
- PIE:CREATE
- PIE:READ
- PIE:UPDATE
- PIE:DELETE
- PIE:IMPORT
- PIE:EXPORT
- PIE:VALIDATE

### PIP (7 permissions)
- PIP:CREATE
- PIP:READ
- PIP:UPDATE
- PIP:DELETE
- PIP:IMPORT
- PIP:EXPORT
- PIP:VALIDATE

### DETTE (7 permissions)
- DETTE:CREATE
- DETTE:READ
- DETTE:UPDATE
- DETTE:DELETE
- DETTE:IMPORT
- DETTE:EXPORT
- DETTE:VALIDATE

### SOLDE (6 permissions)
- SOLDE:CREATE
- SOLDE:READ
- SOLDE:UPDATE
- SOLDE:DELETE
- SOLDE:IMPORT
- SOLDE:EXPORT

### VERSION (6 permissions)
- VERSION:CREATE
- VERSION:READ
- VERSION:UPDATE
- VERSION:DELETE
- VERSION:RESTORE
- VERSION:COMPARE

### REPORT & ANALYTICS (5 permissions)
- REPORT:CREATE
- REPORT:READ
- REPORT:EXPORT
- ANALYTICS:VIEW
- DASHBOARD:VIEW

### WORKFLOW (4 permissions)
- WORKFLOW:SUBMIT
- WORKFLOW:VALIDATE
- WORKFLOW:REJECT
- WORKFLOW:VIEW

### COMMENT (4 permissions)
- COMMENT:CREATE
- COMMENT:READ
- COMMENT:UPDATE
- COMMENT:DELETE

### NOTIFICATION (2 permissions)
- NOTIFICATION:READ
- NOTIFICATION:SEND

### AUDIT (2 permissions)
- AUDIT:READ
- AUDIT:EXPORT

## Utilisation dans le Code

### Middleware d'authentification

```typescript
import { authenticate, authorize, requireRole } from '../middleware/auth.middleware';

// Vérifier qu'un utilisateur est authentifié
router.get('/resource', authenticate, controller.getResource);

// Vérifier qu'un utilisateur a une permission spécifique
router.post('/budget',
  authenticate,
  authorize(['BUDGET:CREATE']),
  controller.createBudget
);

// Vérifier qu'un utilisateur a l'une des permissions
router.get('/cdmt',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'CDMT_SECTOR:READ']),
  controller.getCDMT
);

// Vérifier qu'un utilisateur a un rôle spécifique
router.get('/admin',
  authenticate,
  requireRole(['ADMIN_SYSTEM']),
  controller.adminPanel
);
```

### Accès aux informations utilisateur

```typescript
// Dans un contrôleur ou middleware
export const someController = async (req: Request, res: Response) => {
  // Informations disponibles après authenticate
  const userId = req.user.userId;
  const email = req.user.email;
  const roleId = req.user.roleId;
  const roleCode = req.user.roleCode;
  const permissions = req.user.permissions; // Array de codes de permissions

  // Vérifier une permission spécifique
  if (req.user.permissions.includes('BUDGET:CREATE')) {
    // L'utilisateur peut créer un budget
  }
};
```

## Utilisateurs de Test

Les utilisateurs suivants ont été créés pour le développement et les tests:

| Email | Rôle | Password |
|-------|------|----------|
| admin@finances.dj | ADMIN_SYSTEM | Password123! |
| budget@finances.dj | DIR_BUDGET | Password123! |
| planification@finances.dj | DIR_PLANIFICATION | Password123! |
| dette@finances.dj | DIR_DETTE | Password123! |
| solde@finances.dj | DIR_SOLDE | Password123! |
| ptf@worldbank.org | PTF | Password123! |
| ministry@finances.dj | MINISTRY | Password123! |

## Test de Connexion

```bash
# Exemple de requête de login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budget@finances.dj",
    "password": "Password123!"
  }'

# Réponse attendue
{
  "status": "success",
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "...",
      "email": "budget@finances.dj",
      "firstName": "Directeur",
      "lastName": "Budget",
      "role": {
        "id": "...",
        "code": "DIR_BUDGET",
        "name": "Direction du Budget"
      }
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

## Seed Script

Le script de seed RBAC se trouve dans `prisma/seed-roles.ts`.

Pour exécuter le seed:

```bash
cd backend
npx ts-node prisma/seed-roles.ts
```

Résultat:
- ✅ 110 permissions créées
- ✅ 7 rôles créés
- ✅ 273 associations rôles-permissions
- ✅ 7 utilisateurs de test

## Personnalisation

### Ajouter une nouvelle permission

1. Ajouter la permission dans `prisma/seed-roles.ts`:
```typescript
{ code: 'MODULE:ACTION', name: 'Description', module: 'MODULE' }
```

2. Ajouter la permission aux rôles concernés dans `rolePermissionsMap`

3. Ré-exécuter le seed script

### Ajouter un nouveau rôle

1. Ajouter le rôle dans l'array `roles` de `prisma/seed-roles.ts`
2. Ajouter une entrée dans `rolePermissionsMap` avec les permissions
3. Ré-exécuter le seed script

## Sécurité

- Les mots de passe sont hashés avec bcrypt (10 rounds)
- Les tokens JWT expirent après 24h (access token) et 7 jours (refresh token)
- L'administrateur système (ADMIN_SYSTEM) a toutes les permissions
- Les permissions sont vérifiées à chaque requête via le middleware `authorize()`
- Les ministères ne peuvent voir que leurs propres données (CDMT_SECTOR:VIEW_OWN)

## Workflow Typique

### 1. Cadrage Macroéconomique (DIR_BUDGET)
- Crée le cadre macro (MACRO:CREATE)
- Valide le cadre macro (MACRO:VALIDATE)
- Publie le cadre macro (MACRO:PUBLISH)

### 2. CBMT (DIR_BUDGET)
- Crée le CBMT basé sur le cadre macro (CBMT:CREATE)
- Valide le CBMT (CBMT:VALIDATE)
- Publie le CBMT (CBMT:PUBLISH)

### 3. CDMT Sectoriel (MINISTRY)
- Consulte le cadre macro et CBMT (MACRO:READ, CBMT:READ)
- Crée son CDMT sectoriel (CDMT_SECTOR:CREATE)
- Soumet pour validation (CDMT_SECTOR:SUBMIT)

### 4. Validation CDMT Sectoriel (DIR_BUDGET)
- Consulte tous les CDMT sectoriels (CDMT_SECTOR:VIEW_ALL)
- Valide ou retourne (CDMT_SECTOR:VALIDATE / CDMT_SECTOR:RETURN)

### 5. Consolidation (DIR_BUDGET)
- Crée le CDMT global (CDMT_GLOBAL:CREATE)
- Valide (CDMT_GLOBAL:VALIDATE)
- Publie (CDMT_GLOBAL:PUBLISH)

### 6. Suivi PTF
- Consulte tous les documents (lecture seule)
- Ajoute des commentaires (COMMENT:CREATE)
