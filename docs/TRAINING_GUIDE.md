# CDMT Application - Guide de Formation

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**REQ-MAINT-01 :** Guides de formation

---

## Table des Matières

1. [Présentation des Formations](#1-présentation-des-formations)
2. [Formation Administrateur](#2-formation-administrateur)
3. [Formation Direction du Budget](#3-formation-direction-du-budget)
4. [Formation Cellule CDMT](#4-formation-cellule-cdmt)
5. [Formation Ministère Sectoriel](#5-formation-ministère-sectoriel)
6. [Formation Contrôleur Financier](#6-formation-contrôleur-financier)
7. [Exercices Pratiques](#7-exercices-pratiques)
8. [Évaluation des Compétences](#8-évaluation-des-compétences)

---

## 1. Présentation des Formations

### 1.1 Objectifs de Formation

À l'issue de la formation, les participants seront capables de :

| Profil | Compétences acquises |
|--------|----------------------|
| Tous | Navigation, consultation, export |
| Admin | Gestion utilisateurs, paramétrage |
| Dir. Budget | Validation CDMT, définition plafonds |
| Cellule CDMT | Consolidation, coordination |
| Ministère | Saisie CDMT sectoriel |
| Contrôleur | Vérification, conformité |

### 1.2 Parcours de Formation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PARCOURS DE FORMATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NIVEAU 1: FONDAMENTAUX (4 heures)                                  │
│  ├── Module 1.1: Présentation du CDMT                               │
│  ├── Module 1.2: Navigation dans l'application                      │
│  ├── Module 1.3: Consultation des données                           │
│  └── Module 1.4: Export et impression                               │
│                                                                      │
│  NIVEAU 2: MÉTIER (8 heures - selon profil)                         │
│  ├── Module 2.1: Saisie des données                                 │
│  ├── Module 2.2: Workflow de validation                             │
│  ├── Module 2.3: Rapports et analyses                               │
│  └── Module 2.4: Exercices pratiques                                │
│                                                                      │
│  NIVEAU 3: AVANCÉ (4 heures - selon profil)                         │
│  ├── Module 3.1: Administration système                             │
│  ├── Module 3.2: Paramétrage avancé                                 │
│  └── Module 3.3: Dépannage                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Durée par Profil

| Profil | Niveau 1 | Niveau 2 | Niveau 3 | Total |
|--------|----------|----------|----------|-------|
| Administrateur | 4h | 8h | 4h | **16h** |
| Direction Budget | 4h | 6h | - | **10h** |
| Cellule CDMT | 4h | 8h | 2h | **14h** |
| Ministère Sectoriel | 4h | 8h | - | **12h** |
| Contrôleur Financier | 4h | 4h | - | **8h** |
| Auditeur/Consultant | 4h | 2h | - | **6h** |

---

## 2. Formation Administrateur

### 2.1 Module: Gestion des Utilisateurs

**Durée :** 2 heures

**Objectifs :**
- Créer et gérer les comptes utilisateurs
- Attribuer les rôles et permissions
- Gérer les accès ministériels

**Contenu :**

#### 2.1.1 Création d'un Utilisateur

```
Étape 1: Accéder à Administration → Utilisateurs
Étape 2: Cliquer sur "+ Nouvel Utilisateur"
Étape 3: Remplir le formulaire:
         - Email (obligatoire)
         - Nom, Prénom
         - Téléphone
         - Rôle (sélectionner dans la liste)
         - Ministère (si applicable)
Étape 4: Cliquer sur "Créer"
Étape 5: Un email est envoyé avec le mot de passe temporaire
```

#### 2.1.2 Gestion des Rôles

| Action | Procédure |
|--------|-----------|
| Voir les permissions | Administration → Rôles → Sélectionner un rôle |
| Modifier les permissions | Cocher/décocher les cases CRUD par module |
| Créer un rôle personnalisé | + Nouveau Rôle → Définir les permissions |

#### 2.1.3 Exercice Pratique

> **Scénario :** Créer un utilisateur pour M. Ahmed, nouveau responsable budget au Ministère de la Santé.
>
> 1. Créer le compte avec l'email ahmed@sante.dj
> 2. Attribuer le rôle "Ministère Sectoriel"
> 3. Associer au Ministère de la Santé
> 4. Vérifier les permissions accordées

### 2.2 Module: Paramétrage Système

**Durée :** 2 heures

**Objectifs :**
- Configurer les années fiscales
- Paramétrer les règles de calcul
- Gérer les référentiels

**Contenu :**

#### 2.2.1 Configuration des Années Fiscales

```
Accès: Paramètres → Années Fiscales

Actions:
┌────────────────────────────────────────────────────┐
│ Année 2026                                         │
├────────────────────────────────────────────────────┤
│ Date début:    01/01/2026                          │
│ Date fin:      31/12/2026                          │
│ Statut:        [En cours ▼]                        │
│ Base de calcul: 2025                               │
│ Horizon CDMT:   3 ans                              │
│                                                    │
│ [Enregistrer]  [Annuler]                          │
└────────────────────────────────────────────────────┘
```

#### 2.2.2 Paramètres de Calcul

| Paramètre | Description | Valeur type |
|-----------|-------------|-------------|
| Taux d'inflation | Croissance prix | 3% |
| Taux de croissance PIB | Projection économique | 5% |
| Taux de change USD | Conversion monétaire | 177 FDJ |

### 2.3 Module: Sécurité et Audit

**Durée :** 2 heures

**Objectifs :**
- Consulter les logs d'audit
- Gérer la sécurité des comptes
- Répondre aux incidents

**Contenu :**

#### 2.3.1 Journal d'Audit

```
Accès: Administration → Journal d'Audit

Filtres disponibles:
- Période (dates)
- Utilisateur
- Type d'action (CREATE, UPDATE, DELETE, LOGIN)
- Module concerné

Exemple de log:
┌─────────────────────────────────────────────────────────────────┐
│ 2026-01-05 10:30:15 | ahmed@sante.dj | UPDATE | Budget         │
│ Modification du CDMT Sectoriel 2026 - Ministère de la Santé    │
│ Ancien montant: 3,200,000 | Nouveau montant: 3,450,000         │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Gestion des Incidents

| Incident | Action |
|----------|--------|
| Compte bloqué (5 tentatives) | Débloquer via Admin → Utilisateurs |
| 2FA perdu | Générer nouveaux codes de récupération |
| Accès suspect | Analyser logs, désactiver compte si nécessaire |

---

## 3. Formation Direction du Budget

### 3.1 Module: Définition des Plafonds CBMT

**Durée :** 3 heures

**Objectifs :**
- Comprendre la méthodologie CBMT
- Définir les plafonds ministériels
- Analyser les arbitrages budgétaires

**Contenu :**

#### 3.1.1 Processus CBMT

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PROCESSUS CBMT                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CADRAGE MACRO                                                    │
│     │ Définir l'enveloppe globale disponible                        │
│     │ Basé sur projections de recettes                              │
│     ▼                                                                │
│  2. RÉPARTITION SECTORIELLE                                         │
│     │ Allouer par ministère prioritaire                             │
│     │ Tenir compte des priorités gouvernementales                   │
│     ▼                                                                │
│  3. NOTIFICATION DES PLAFONDS                                        │
│     │ Communiquer aux ministères                                     │
│     │ Via le système CDMT                                            │
│     ▼                                                                │
│  4. DIALOGUE BUDGÉTAIRE                                              │
│     │ Recevoir les propositions ministérielles                       │
│     │ Arbitrer les demandes                                          │
│     ▼                                                                │
│  5. VALIDATION FINALE                                                │
│     Approuver le CBMT consolidé                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.1.2 Saisie des Plafonds

```
Accès: CBMT → Plafonds Ministériels

Étapes:
1. Sélectionner l'exercice (ex: 2027)
2. Cliquer sur un ministère
3. Saisir les montants:
   - N+1: Plafond pour 2027
   - N+2: Projection pour 2028
   - N+3: Projection pour 2029
4. Ajouter une note explicative si nécessaire
5. Enregistrer

Conseil: Commencer par les ministères prioritaires
```

#### 3.1.3 Exercice Pratique

> **Scénario :** Définir les plafonds CBMT 2027-2029 pour les 5 ministères prioritaires.
>
> Données:
> - Enveloppe globale: 150 milliards FDJ
> - Croissance annuelle cible: 5%
> - Priorité: Éducation (+8%), Santé (+7%)

### 3.2 Module: Validation du CDMT Global

**Durée :** 3 heures

**Objectifs :**
- Examiner les CDMT sectoriels consolidés
- Vérifier la cohérence avec le CBMT
- Valider ou retourner pour correction

**Contenu :**

#### 3.2.1 Tableau de Bord Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│                CDMT GLOBAL 2027 - En attente de validation          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ✅ Ministère de l'Éducation     - Soumis le 15/11/2026            │
│  ✅ Ministère de la Santé        - Soumis le 16/11/2026            │
│  ⏳ Ministère de l'Agriculture   - En cours de rédaction           │
│  ✅ Ministère des Infrastructures - Soumis le 14/11/2026           │
│  ❌ Ministère du Commerce        - Rejeté (plafond dépassé)        │
│                                                                      │
│  Total soumis: 4/5                                                   │
│  Plafond respecté: 3/4                                               │
│                                                                      │
│  [Examiner les CDMT soumis]  [Générer rapport comparatif]           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Critères de Validation

| Critère | Vérification |
|---------|--------------|
| Respect du plafond | Total ≤ Plafond CBMT |
| Cohérence | Alignement avec priorités |
| Complétude | Toutes les rubriques renseignées |
| Justifications | Mesures nouvelles documentées |

---

## 4. Formation Cellule CDMT

### 4.1 Module: Coordination des CDMT Sectoriels

**Durée :** 4 heures

**Objectifs :**
- Accompagner les ministères dans l'élaboration
- Vérifier la conformité méthodologique
- Consolider les données

**Contenu :**

#### 4.1.1 Calendrier Budgétaire

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CALENDRIER CDMT 2027                               │
├──────────────┬──────────────────────────────────────────────────────┤
│ 15 Juin      │ Notification des plafonds CBMT                       │
│ 30 Juin      │ Lettre de cadrage aux ministères                     │
│ 15 Juillet   │ Début de l'élaboration des CDMT sectoriels          │
│ 15 Septembre │ Soumission des projets CDMT sectoriels               │
│ 30 Septembre │ Première consolidation                               │
│ 15 Octobre   │ Dialogue budgétaire                                  │
│ 30 Octobre   │ CDMT sectoriels finalisés                            │
│ 15 Novembre  │ CDMT Global consolidé                                │
│ 30 Novembre  │ Validation par la Direction du Budget                │
│ 15 Décembre  │ Adoption par le Conseil des Ministres                │
└──────────────┴──────────────────────────────────────────────────────┘
```

#### 4.1.2 Vérifications Méthodologiques

Checklist par CDMT sectoriel:

- [ ] Données historiques complètes (N-2, N-1, N)
- [ ] Budget tendanciel calculé correctement
- [ ] Mesures nouvelles justifiées
- [ ] Projets PIE/PIP documentés
- [ ] Respect du plafond CBMT
- [ ] Indicateurs de performance définis
- [ ] Cohérence avec le Plan National

#### 4.1.3 Consolidation

```
Accès: CDMT Global → Consolidation

Étapes:
1. Vérifier que tous les CDMT sectoriels sont validés
2. Cliquer sur "Consolider"
3. Vérifier les totaux par:
   - Ministère
   - Nature économique
   - Source de financement
4. Générer le rapport de consolidation
5. Identifier les écarts éventuels
6. Soumettre pour validation finale
```

### 4.2 Module: Suivi et Reporting

**Durée :** 4 heures

**Objectifs :**
- Suivre l'avancement de l'élaboration
- Produire des rapports de suivi
- Alerter sur les retards

**Contenu :**

#### 4.2.1 Tableau de Bord de Suivi

```
Accès: Tableau de bord → Vue Cellule CDMT

Indicateurs affichés:
┌─────────────────────────────────────────────────────────────────────┐
│  📊 SUIVI ÉLABORATION CDMT 2027                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CDMT Sectoriels: 12/15 soumis (80%)                                │
│  [████████████████░░░░] 80%                                         │
│                                                                      │
│  En retard: 3 ministères                                            │
│  - Agriculture (délai: -5 jours)                                    │
│  - Transports (délai: -3 jours)                                     │
│  - Jeunesse (délai: -1 jour)                                        │
│                                                                      │
│  Alertes:                                                           │
│  ⚠️ Commerce: Plafond dépassé de 15%                                │
│  ⚠️ Santé: Mesures nouvelles > 20% du tendanciel                   │
│                                                                      │
│  [Envoyer rappels]  [Générer rapport]  [Exporter Excel]             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Formation Ministère Sectoriel

### 5.1 Module: Saisie du CDMT Sectoriel

**Durée :** 6 heures

**Objectifs :**
- Importer les données historiques
- Calculer le budget tendanciel
- Proposer des mesures nouvelles
- Soumettre le CDMT pour validation

**Contenu :**

#### 5.1.1 Étapes d'Élaboration

```
┌─────────────────────────────────────────────────────────────────────┐
│               ÉLABORATION CDMT SECTORIEL                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ÉTAPE 1: IMPORT DES DONNÉES HISTORIQUES                            │
│  ────────────────────────────────────────                           │
│  1. Télécharger le modèle Excel                                     │
│  2. Renseigner les exécutions N-2, N-1                              │
│  3. Importer le fichier dans l'application                          │
│  4. Vérifier les données importées                                  │
│                                                                      │
│  ÉTAPE 2: CALCUL DU TENDANCIEL                                      │
│  ─────────────────────────────                                      │
│  1. Cliquer sur "Calculer tendanciel"                               │
│  2. Vérifier les projections automatiques                           │
│  3. Ajuster si nécessaire (justifier)                               │
│                                                                      │
│  ÉTAPE 3: MESURES NOUVELLES                                         │
│  ─────────────────────────                                          │
│  1. Ajouter chaque mesure proposée                                  │
│  2. Détailler le coût et la justification                           │
│  3. Respecter le plafond alloué                                     │
│                                                                      │
│  ÉTAPE 4: PROJETS D'INVESTISSEMENT                                  │
│  ─────────────────────────────────                                  │
│  1. Lister les projets PIE/PIP                                      │
│  2. Planifier les décaissements                                     │
│  3. Identifier les sources de financement                           │
│                                                                      │
│  ÉTAPE 5: SOUMISSION                                                │
│  ───────────────────                                                │
│  1. Vérifier la complétude                                          │
│  2. Soumettre pour validation                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Import Excel

```
Accès: CDMT Sectoriel → Import

Format du fichier Excel:
┌───────────┬───────────┬──────────┬──────────┬──────────┐
│ Programme │ Action    │ Exéc N-2 │ Exéc N-1 │ LFI N    │
├───────────┼───────────┼──────────┼──────────┼──────────┤
│ P01       │ A01       │ 500,000  │ 550,000  │ 600,000  │
│ P01       │ A02       │ 300,000  │ 320,000  │ 350,000  │
│ P02       │ A01       │ 200,000  │ 210,000  │ 220,000  │
└───────────┴───────────┴──────────┴──────────┴──────────┘

Étapes d'import:
1. Cliquer sur "📥 Importer"
2. Sélectionner le fichier
3. Vérifier le mapping des colonnes
4. Valider l'import
5. Contrôler les données importées
```

#### 5.1.3 Mesures Nouvelles

```
Formulaire de saisie:

┌─────────────────────────────────────────────────────────────────────┐
│                 NOUVELLE MESURE                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Intitulé:     [Construction de 10 écoles rurales_________]         │
│                                                                      │
│  Programme:    [P02 - Infrastructure éducative ▼]                   │
│                                                                      │
│  Type:         ○ Fonctionnement  ● Investissement                   │
│                                                                      │
│  Coût (en millions FDJ):                                            │
│  ┌─────────────┬─────────────┬─────────────┐                        │
│  │ N+1: 2027   │ N+2: 2028   │ N+3: 2029   │                        │
│  ├─────────────┼─────────────┼─────────────┤                        │
│  │ [  500    ] │ [  500    ] │ [  500    ] │                        │
│  └─────────────┴─────────────┴─────────────┘                        │
│                                                                      │
│  Justification:                                                      │
│  [Amélioration de l'accès à l'éducation en zone rurale,            │
│   conformément au Plan National de Développement.                   │
│   Population cible: 5,000 élèves supplémentaires.___________]       │
│                                                                      │
│  Pièce jointe: [Étude de faisabilité.pdf] [Parcourir...]            │
│                                                                      │
│  [Enregistrer]  [Annuler]                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Module: Indicateurs de Performance

**Durée :** 2 heures

**Objectifs :**
- Définir les indicateurs par programme
- Fixer les cibles pluriannuelles
- Suivre les réalisations

**Contenu :**

| Élément | Description | Exemple |
|---------|-------------|---------|
| Objectif | But visé par le programme | Améliorer l'accès à l'éducation |
| Indicateur | Mesure quantifiable | Taux de scolarisation |
| Baseline | Valeur de référence | 75% (2025) |
| Cible N+1 | Objectif année 1 | 78% |
| Cible N+3 | Objectif année 3 | 85% |

---

## 6. Formation Contrôleur Financier

### 6.1 Module: Vérification de Conformité

**Durée :** 4 heures

**Objectifs :**
- Contrôler la régularité des CDMT
- Vérifier le respect des procédures
- Signaler les anomalies

**Contenu :**

#### 6.1.1 Points de Contrôle

| Contrôle | Critère | Action si non-conforme |
|----------|---------|------------------------|
| Plafond | Total ≤ CBMT | Signaler le dépassement |
| Justifications | Mesures documentées | Demander complément |
| Cohérence | Liens programme-action | Vérifier la nomenclature |
| Calculs | Totaux corrects | Corriger les erreurs |
| Délais | Soumission dans les temps | Noter le retard |

#### 6.1.2 Rapport de Contrôle

```
Accès: Workflow → Documents à vérifier

Actions:
1. Sélectionner le CDMT à contrôler
2. Examiner chaque rubrique
3. Ajouter des observations
4. Émettre un avis:
   - ✅ Favorable
   - ⚠️ Favorable avec réserves
   - ❌ Défavorable
5. Soumettre le rapport
```

---

## 7. Exercices Pratiques

### 7.1 Exercice 1: Création de Compte (Admin)

**Durée :** 15 minutes

**Scénario :**
> Vous êtes administrateur système. Créez un compte pour Mme Fatima, nouvelle responsable budget au Ministère de l'Agriculture.

**Étapes attendues :**
1. Accéder à Administration → Utilisateurs
2. Créer un nouvel utilisateur
3. Remplir: fatima@agriculture.dj, rôle "Ministère Sectoriel"
4. Associer au Ministère de l'Agriculture
5. Vérifier que l'email d'invitation est envoyé

### 7.2 Exercice 2: Saisie CDMT Sectoriel

**Durée :** 45 minutes

**Scénario :**
> En tant que responsable du Ministère de la Santé, élaborez le CDMT 2027.

**Données fournies :**
- Exécution 2025: 3,000 M FDJ
- LFI 2026: 3,200 M FDJ
- Plafond CBMT 2027: 3,500 M FDJ
- Mesure nouvelle: Construction d'un hôpital (400 M FDJ)

**Étapes attendues :**
1. Importer les données historiques
2. Calculer le tendanciel
3. Ajouter la mesure nouvelle
4. Vérifier le respect du plafond
5. Soumettre pour validation

### 7.3 Exercice 3: Validation CDMT (Dir. Budget)

**Durée :** 30 minutes

**Scénario :**
> Vous devez valider le CDMT du Ministère de l'Éducation.

**Critères de validation :**
- Plafond CBMT: 5,500 M FDJ
- Priorité gouvernementale: Éducation primaire

**Étapes attendues :**
1. Examiner le CDMT soumis
2. Vérifier le respect du plafond
3. Analyser les mesures nouvelles
4. Ajouter des commentaires si nécessaire
5. Valider ou retourner avec observations

---

## 8. Évaluation des Compétences

### 8.1 QCM de Validation

**Après chaque module, un QCM de 10 questions permet de valider les acquis.**

Exemple de questions:

1. **Quel est le délai maximum pour soumettre un CDMT sectoriel ?**
   - a) 15 Septembre
   - b) 30 Septembre ✓
   - c) 15 Octobre

2. **Le budget tendanciel représente :**
   - a) Les nouvelles dépenses proposées
   - b) La projection des dépenses actuelles ✓
   - c) Le plafond CBMT

3. **Qui peut valider définitivement le CDMT Global ?**
   - a) Le Ministère sectoriel
   - b) La Cellule CDMT
   - c) La Direction du Budget ✓

### 8.2 Critères de Réussite

| Niveau | Score requis | Certification |
|--------|--------------|---------------|
| Bronze | 60-74% | Utilisateur de base |
| Argent | 75-89% | Utilisateur confirmé |
| Or | 90-100% | Expert CDMT |

### 8.3 Attestation de Formation

À l'issue de la formation, une attestation est délivrée mentionnant:
- Nom du participant
- Profil formé
- Modules suivis
- Score obtenu
- Date de validation

---

## Annexes

### A. Support de Formation

Tous les supports sont disponibles:
- Présentations PowerPoint
- Guides pas-à-pas (PDF)
- Vidéos tutorielles
- Exercices corrigés

**Accès :** https://cdmt.finances.dj/formation

### B. Contacts Formation

| Rôle | Contact |
|------|---------|
| Responsable Formation | formation@cdmt.finances.dj |
| Support Technique | support@cdmt.finances.dj |
| Cellule CDMT | cdmt@budget.gouv.dj |

---

**Propriétaire du Document :** Équipe Formation
**Approuvé Par :** Direction des Ressources Humaines
**Prochaine Révision :** 2026-07-01
