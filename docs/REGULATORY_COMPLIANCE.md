# CDMT Application - Conformité Réglementaire

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**Référence :** Section 6.1 - Contraintes Réglementaires

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Conformité LOLF Djibouti](#2-conformité-lolf-djibouti)
3. [Directives UEMOA](#3-directives-uemoa)
4. [Normes de Comptabilité Publique](#4-normes-de-comptabilité-publique)
5. [Matrice de Conformité](#5-matrice-de-conformité)
6. [Audit et Certification](#6-audit-et-certification)

---

## 1. Vue d'Ensemble

### 1.1 Cadre Réglementaire

L'application CDMT est conçue pour respecter le cadre réglementaire des finances publiques de la République de Djibouti et les standards internationaux applicables.

| Cadre | Applicabilité | Statut |
|-------|---------------|--------|
| LOLF Djibouti | Obligatoire | ✅ Conforme |
| Directives UEMOA | Référence | ✅ Aligné |
| Normes Comptabilité Publique | Obligatoire | ✅ Conforme |
| Standards IPSAS | Référence | ✅ Aligné |

### 1.2 Principes Directeurs

L'application respecte les principes fondamentaux des finances publiques :

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PRINCIPES BUDGÉTAIRES RESPECTÉS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │    ANNUALITÉ    │  │     UNITÉ       │  │  UNIVERSALITÉ   │      │
│  │  Budget annuel  │  │ Budget unique   │  │ Toutes recettes │      │
│  │  avec plurian.  │  │  consolidé      │  │ toutes dépenses │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  SPÉCIALITÉ     │  │   SINCÉRITÉ     │  │  ÉQUILIBRE      │      │
│  │ Crédits par     │  │ Prévisions      │  │ Recettes =      │      │
│  │ destination     │  │ réalistes       │  │ Dépenses        │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  TRANSPARENCE   │  │ PERFORMANCE     │  │ RESPONSABILITÉ  │      │
│  │ Traçabilité     │  │ Objectifs et    │  │ Gestionnaires   │      │
│  │ complète        │  │ indicateurs     │  │ identifiés      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Conformité LOLF Djibouti

### 2.1 Présentation de la LOLF

La **Loi Organique relative aux Lois de Finances (LOLF)** de Djibouti définit le cadre juridique de la gestion des finances publiques, incluant :

- La structure du budget de l'État
- Les règles de présentation budgétaire
- Le calendrier budgétaire
- Les mécanismes de contrôle

### 2.2 Structure Budgétaire Conforme

L'application implémente la structure budgétaire définie par la LOLF :

```
┌─────────────────────────────────────────────────────────────────────┐
│              STRUCTURE BUDGÉTAIRE LOLF                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NIVEAU 1: MISSION                                                   │
│  │  Politique publique majeure                                       │
│  │  Ex: Éducation et Formation                                       │
│  │                                                                   │
│  └──▶ NIVEAU 2: PROGRAMME                                           │
│       │  Politique publique confiée à un responsable                │
│       │  Ex: Enseignement Primaire                                  │
│       │  ✅ Implémenté: Table "programs"                            │
│       │                                                              │
│       └──▶ NIVEAU 3: ACTION                                         │
│            │  Composante du programme                                │
│            │  Ex: Construction d'écoles                              │
│            │  ✅ Implémenté: Table "actions"                        │
│            │                                                         │
│            └──▶ NIVEAU 4: ACTIVITÉ                                  │
│                 │  Détail opérationnel                               │
│                 │  ✅ Implémenté: Table "activities"                │
│                 │                                                    │
│                 └──▶ NIVEAU 5: LIGNE BUDGÉTAIRE                     │
│                      Par nature économique                           │
│                      ✅ Implémenté: Tables "budget_lines"           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Classification Budgétaire

| Classification | Description | Implémentation |
|----------------|-------------|----------------|
| **Administrative** | Par ministère/institution | Table `ministries` |
| **Fonctionnelle** | Par fonction (COFOG) | Table `functional_classifications` |
| **Économique** | Par nature de dépense | Table `economic_categories` |
| **Programmatique** | Par programme/action | Tables `programs`, `actions` |
| **Par source** | Financement interne/externe | Table `financing_sources` |

### 2.4 Documents Budgétaires

L'application génère les documents requis par la LOLF :

| Document | Article LOLF | Module CDMT |
|----------|--------------|-------------|
| **TOFE** | Art. 32 | `/tofe` - Tableau complet des opérations |
| **CBMT** | Art. 45 | `/cbmt` - Plafonds ministériels |
| **CDMT Global** | Art. 46 | `/cdmt-global` - Vue consolidée |
| **CDMT Sectoriel** | Art. 47 | `/sectoral-trends` - Par ministère |
| **PAP** | Art. 48 | Projets Annuels de Performance |
| **RAP** | Art. 49 | Rapports Annuels de Performance |

### 2.5 Calendrier Budgétaire

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CALENDRIER BUDGÉTAIRE LOLF                           │
├──────────────┬──────────────────────────────────────────────────────┤
│    Mois      │  Étape                                  │  Module    │
├──────────────┼──────────────────────────────────────────────────────┤
│   Janvier    │  Cadrage macroéconomique                │  TOFE      │
│   Février    │  Lettre de cadrage                      │  CBMT      │
│   Mars       │  Conférences budgétaires                │  Workflow  │
│   Avril      │  Arbitrages                             │  CBMT      │
│   Mai        │  Plafonds ministériels                  │  CBMT      │
│   Juin       │  Notification aux ministères            │  Notifs    │
│   Juillet    │  Élaboration CDMT sectoriels            │  Sectoral  │
│   Août       │  Suite élaboration                      │  Sectoral  │
│   Septembre  │  Consolidation                          │  Global    │
│   Octobre    │  Finalisation PLF                       │  Export    │
│   Novembre   │  Examen Parlement                       │  Reports   │
│   Décembre   │  Vote et promulgation                   │  Archive   │
├──────────────┴──────────────────────────────────────────────────────┤
│  ✅ Workflow intégré avec rappels automatiques                       │
│  ✅ Notifications par email aux échéances                            │
│  ✅ Tableau de bord de suivi du calendrier                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.6 Gestion des Crédits

| Type de Crédit | LOLF | Implémentation |
|----------------|------|----------------|
| **Crédits de paiement (CP)** | Art. 15 | Montants annuels budgétés |
| **Autorisations d'engagement (AE)** | Art. 16 | Engagements pluriannuels |
| **Crédits évaluatifs** | Art. 17 | Dépenses obligatoires |
| **Crédits limitatifs** | Art. 18 | Plafonds non dépassables |

### 2.7 Contrôle Budgétaire

```typescript
// Implémentation du contrôle des plafonds LOLF
class BudgetControlService {
  // Vérification du respect des plafonds (Art. 25 LOLF)
  async checkCeilingCompliance(ministryId: string, fiscalYear: string) {
    const ceiling = await this.getCBMTCeiling(ministryId, fiscalYear);
    const proposed = await this.getProposedBudget(ministryId, fiscalYear);

    return {
      ceiling: ceiling.amount,
      proposed: proposed.total,
      compliant: proposed.total <= ceiling.amount,
      variance: ceiling.amount - proposed.total,
      variancePercent: ((ceiling.amount - proposed.total) / ceiling.amount) * 100
    };
  }

  // Validation avant soumission
  async validateSubmission(documentId: string) {
    const checks = [
      this.checkCeilingCompliance,      // Art. 25
      this.checkMandatoryExpenses,      // Art. 17
      this.checkBalanceRequirement,     // Art. 34
      this.checkDocumentCompleteness,   // Art. 48
    ];

    const results = await Promise.all(checks.map(c => c(documentId)));
    return results.every(r => r.compliant);
  }
}
```

---

## 3. Directives UEMOA

### 3.1 Contexte

Bien que Djibouti ne soit pas membre de l'UEMOA, l'application s'aligne sur les **Directives UEMOA relatives aux finances publiques** qui constituent une référence de bonnes pratiques.

### 3.2 Directives Applicables

| Directive | Objet | Alignement CDMT |
|-----------|-------|-----------------|
| **N°01/2009** | Lois de finances | Structure TOFE conforme |
| **N°06/2009** | TOFE | Format standard respecté |
| **N°07/2009** | Plan comptable | Classifications compatibles |
| **N°08/2009** | Nomenclature budgétaire | Structure programme/action |
| **N°10/2009** | Transparence | Audit trail complet |

### 3.3 Format TOFE Harmonisé

L'application génère un TOFE conforme au format UEMOA :

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOFE - FORMAT UEMOA                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. RECETTES TOTALES ET DONS                                        │
│     1.1 Recettes totales                                            │
│         1.1.1 Recettes fiscales                                     │
│               - Impôts sur les revenus et bénéfices                 │
│               - Impôts sur les biens et services                    │
│               - Impôts sur le commerce extérieur                    │
│               - Autres recettes fiscales                            │
│         1.1.2 Recettes non fiscales                                 │
│     1.2 Dons                                                        │
│         1.2.1 Dons courants                                         │
│         1.2.2 Dons en capital                                       │
│                                                                      │
│  2. DÉPENSES TOTALES ET PRÊTS NETS                                  │
│     2.1 Dépenses totales                                            │
│         2.1.1 Dépenses courantes                                    │
│               - Traitements et salaires                             │
│               - Biens et services                                   │
│               - Intérêts de la dette                                │
│               - Transferts et subventions                           │
│         2.1.2 Dépenses en capital                                   │
│               - Sur financement intérieur                           │
│               - Sur financement extérieur                           │
│     2.2 Prêts nets                                                  │
│                                                                      │
│  3. SOLDE GLOBAL (base engagement)                                  │
│  4. SOLDE GLOBAL (base caisse)                                      │
│  5. FINANCEMENT                                                     │
│     5.1 Financement intérieur                                       │
│     5.2 Financement extérieur                                       │
│                                                                      │
│  ✅ Structure implémentée dans le module TOFE                        │
│  ✅ Export Excel/PDF conforme                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Budget-Programme UEMOA

| Principe UEMOA | Implémentation |
|----------------|----------------|
| Globalisation des crédits | Enveloppes par programme |
| Fongibilité asymétrique | Règles de transfert configurables |
| Responsabilisation | Gestionnaire par programme |
| Performance | Objectifs et indicateurs |

---

## 4. Normes de Comptabilité Publique

### 4.1 Principes Comptables Appliqués

| Principe | Description | Implémentation |
|----------|-------------|----------------|
| **Régularité** | Conformité aux règles | Validation workflow |
| **Sincérité** | Image fidèle | Contrôles de cohérence |
| **Fidélité** | Exactitude des comptes | Audit trail complet |
| **Prudence** | Provisions suffisantes | Alertes dépassement |
| **Permanence** | Méthodes constantes | Paramétrage verrouillé |
| **Non-compensation** | Pas de compensation | Recettes/Dépenses séparées |
| **Intangibilité** | Bilan d'ouverture | Versions verrouillées |

### 4.2 Plan Comptable de l'État

```
┌─────────────────────────────────────────────────────────────────────┐
│               PLAN COMPTABLE - CLASSES PRINCIPALES                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CLASSE 1 : Comptes de capitaux                                     │
│  CLASSE 2 : Comptes d'immobilisations                               │
│  CLASSE 3 : Comptes de stocks                                       │
│  CLASSE 4 : Comptes de tiers                                        │
│  CLASSE 5 : Comptes financiers                                      │
│  CLASSE 6 : Comptes de charges                    ◄── Dépenses CDMT │
│  CLASSE 7 : Comptes de produits                   ◄── Recettes TOFE │
│  CLASSE 8 : Comptes spéciaux                                        │
│                                                                      │
│  ✅ Mapping avec classifications économiques                         │
│  ✅ Export compatible logiciel comptable                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Classification Économique des Dépenses

| Code | Catégorie | Sous-catégories |
|------|-----------|-----------------|
| **21** | Personnel | Salaires, indemnités, cotisations |
| **22** | Biens et services | Fournitures, entretien, missions |
| **23** | Transferts | Subventions, bourses |
| **24** | Intérêts | Dette intérieure, extérieure |
| **25** | Investissements | Constructions, équipements |
| **26** | Autres | Dépenses exceptionnelles |

### 4.4 Séparation Ordonnateur/Comptable

```
┌─────────────────────────────────────────────────────────────────────┐
│           PRINCIPE DE SÉPARATION DES FONCTIONS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ORDONNATEUR                          COMPTABLE                      │
│  (Ministère Sectoriel)                (Contrôleur Financier)        │
│                                                                      │
│  ┌─────────────────────┐              ┌─────────────────────┐       │
│  │ • Engagement        │              │ • Vérification      │       │
│  │ • Liquidation       │    ──────▶   │ • Visa préalable    │       │
│  │ • Ordonnancement    │              │ • Paiement          │       │
│  └─────────────────────┘              └─────────────────────┘       │
│                                                                      │
│  ✅ Rôles séparés dans l'application                                 │
│  ✅ Workflow de validation distinct                                  │
│  ✅ Traçabilité par acteur                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Contrôles Intégrés

```typescript
// Contrôles de comptabilité publique
const accountingControls = {
  // Contrôle de disponibilité des crédits
  creditAvailability: async (expenditure) => {
    const available = await getAvailableCredit(expenditure.lineId);
    return expenditure.amount <= available;
  },

  // Contrôle de la chaîne de la dépense
  expenditureChain: async (documentId) => {
    const steps = ['ENGAGEMENT', 'LIQUIDATION', 'ORDONNANCEMENT'];
    const completed = await getCompletedSteps(documentId);
    return steps.every(s => completed.includes(s));
  },

  // Contrôle de l'imputation budgétaire
  budgetImputation: async (entry) => {
    const validCodes = await getValidBudgetCodes(entry.fiscalYear);
    return validCodes.includes(entry.budgetCode);
  },

  // Contrôle des pièces justificatives
  supportingDocuments: async (transactionId) => {
    const required = await getRequiredDocuments(transactionId);
    const attached = await getAttachedDocuments(transactionId);
    return required.every(r => attached.includes(r));
  }
};
```

---

## 5. Matrice de Conformité

### 5.1 LOLF Djibouti

| Article | Exigence | Module | Statut |
|---------|----------|--------|--------|
| Art. 5 | Budget annuel | Fiscal Years | ✅ |
| Art. 7 | Programmes/Actions | Programs, Actions | ✅ |
| Art. 15 | Crédits de paiement | Budget Lines | ✅ |
| Art. 25 | Plafonds ministériels | CBMT | ✅ |
| Art. 32 | TOFE | TOFE Module | ✅ |
| Art. 45 | CBMT | CBMT Module | ✅ |
| Art. 46 | CDMT Global | CDMT Global | ✅ |
| Art. 47 | CDMT Sectoriel | Sectoral Trends | ✅ |
| Art. 48 | PAP | Objectives, Indicators | ✅ |
| Art. 52 | Contrôle | Workflow, Audit | ✅ |

### 5.2 Directives UEMOA

| Directive | Exigence | Conformité |
|-----------|----------|------------|
| 01/2009 | Structure LF | ✅ Aligné |
| 06/2009 | Format TOFE | ✅ Conforme |
| 07/2009 | Plan comptable | ✅ Compatible |
| 08/2009 | Nomenclature | ✅ Aligné |
| 10/2009 | Transparence | ✅ Audit trail |

### 5.3 Comptabilité Publique

| Norme | Exigence | Conformité |
|-------|----------|------------|
| Séparation ordonnateur/comptable | Rôles distincts | ✅ |
| Chaîne de la dépense | E-L-O-P | ✅ |
| Pièces justificatives | Attachements | ✅ |
| Plan comptable | Classifications | ✅ |
| Non-compensation | Séparation R/D | ✅ |
| Annualité | Exercice fiscal | ✅ |

---

## 6. Audit et Certification

### 6.1 Piste d'Audit

Toutes les opérations sont tracées :

```json
{
  "id": "audit-123",
  "timestamp": "2026-01-05T10:30:00Z",
  "userId": "user-456",
  "userEmail": "agent@finances.dj",
  "userRole": "SECTORAL_MINISTRY",
  "action": "UPDATE",
  "entity": "CDMT_SECTORAL",
  "entityId": "cdmt-789",
  "changes": {
    "field": "amount",
    "oldValue": 5000000,
    "newValue": 5500000
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "justification": "Ajustement suite à arbitrage"
}
```

### 6.2 Rapports d'Audit

| Rapport | Contenu | Fréquence |
|---------|---------|-----------|
| Journal des modifications | Toutes les modifications | Temps réel |
| Rapport de conformité | Vérification des règles | Mensuel |
| Historique des validations | Workflow complet | Par document |
| Accès utilisateurs | Connexions et actions | Hebdomadaire |

### 6.3 Contrôles Externes

L'application facilite les contrôles de :
- **Inspection Générale des Finances (IGF)**
- **Cour des Comptes**
- **Auditeurs externes**

Via :
- Export complet des données
- Rapports personnalisables
- Accès en lecture seule pour auditeurs

---

## Annexes

### A. Références Légales

| Texte | Référence |
|-------|-----------|
| LOLF Djibouti | Loi n°XX/AN/2015 |
| Règlement Financier | Décret n°XX-XXX/PR/2016 |
| Directives UEMOA | Directive n°01-10/2009/CM/UEMOA |
| Plan Comptable | PCGEP adapté |

### B. Glossaire Réglementaire

| Terme | Définition |
|-------|------------|
| **AE** | Autorisation d'Engagement |
| **CP** | Crédits de Paiement |
| **LFI** | Loi de Finances Initiale |
| **LFR** | Loi de Finances Rectificative |
| **PLF** | Projet de Loi de Finances |
| **TOFE** | Tableau des Opérations Financières de l'État |
| **COFOG** | Classification of Functions of Government |

### C. Contact Conformité

**Cellule de Conformité Réglementaire**
- Email : conformite@budget.gouv.dj
- Direction du Budget - Ministère des Finances

---

**Propriétaire du Document :** Direction du Budget
**Approuvé Par :** Secrétaire Général - Ministère des Finances
**Prochaine Révision :** 2026-07-01
