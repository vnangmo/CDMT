# CDMT Application - Manuel Utilisateur

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**REQ-MAINT-01 :** Manuel utilisateur détaillé

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Premiers Pas](#2-premiers-pas)
3. [Navigation dans l'Application](#3-navigation-dans-lapplication)
4. [Gestion des Référentiels](#4-gestion-des-référentiels)
5. [Module TOFE](#5-module-tofe)
6. [Module CBMT](#6-module-cbmt)
7. [Module CDMT Global](#7-module-cdmt-global)
8. [Module CDMT Sectoriel](#8-module-cdmt-sectoriel)
9. [Workflow de Validation](#9-workflow-de-validation)
10. [Rapports et Exports](#10-rapports-et-exports)
11. [Paramètres et Préférences](#11-paramètres-et-préférences)
12. [FAQ et Dépannage](#12-faq-et-dépannage)

---

## 1. Introduction

### 1.1 Qu'est-ce que le CDMT ?

Le **Cadre de Dépenses à Moyen Terme (CDMT)** est un outil de planification budgétaire pluriannuelle qui permet :

- La programmation des dépenses sur 3 à 5 ans
- L'alignement du budget avec les priorités stratégiques
- Le suivi de l'exécution budgétaire
- La coordination entre les ministères

### 1.2 Objectifs de l'Application

| Objectif | Description |
|----------|-------------|
| **Centralisation** | Regrouper toutes les données budgétaires |
| **Automatisation** | Calculs automatiques et génération de rapports |
| **Collaboration** | Workflow de validation multi-acteurs |
| **Transparence** | Traçabilité complète des modifications |

### 1.3 Profils Utilisateurs

| Profil | Responsabilités |
|--------|-----------------|
| Administrateur Système | Gestion technique, utilisateurs, paramètres |
| Direction du Budget | Validation finale, plafonds ministériels |
| Cellule CDMT | Coordination, consolidation |
| Ministère Sectoriel | Saisie CDMT sectoriel |
| Contrôleur Financier | Vérification, conformité |
| Auditeur | Consultation, rapports |
| Consultant | Lecture seule |

---

## 2. Premiers Pas

### 2.1 Connexion à l'Application

1. Ouvrez votre navigateur (Chrome, Firefox, Edge ou Safari)
2. Accédez à l'URL : `https://cdmt.finances.dj`
3. Entrez vos identifiants :
   - **Email** : votre adresse email professionnelle
   - **Mot de passe** : votre mot de passe

```
┌─────────────────────────────────────┐
│          CDMT - Connexion           │
├─────────────────────────────────────┤
│                                     │
│  Email:     [________________]      │
│                                     │
│  Mot de passe: [________________]   │
│                                     │
│  [ ] Se souvenir de moi             │
│                                     │
│       [ SE CONNECTER ]              │
│                                     │
│  Mot de passe oublié ?              │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Authentification à Deux Facteurs (2FA)

Si le 2FA est activé sur votre compte :

1. Après la saisie du mot de passe, une nouvelle page s'affiche
2. Ouvrez votre application d'authentification (Google Authenticator, Authy)
3. Entrez le code à 6 chiffres affiché
4. Cliquez sur **Vérifier**

> **Astuce :** Les codes 2FA changent toutes les 30 secondes. Attendez un nouveau code si l'actuel est presque expiré.

### 2.3 Premier Accès

Lors de votre première connexion :

1. **Changer le mot de passe temporaire** (obligatoire)
   - Minimum 12 caractères
   - Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole

2. **Configurer vos préférences**
   - Langue (Français, English, العربية)
   - Thème (Clair/Sombre)
   - Notifications

---

## 3. Navigation dans l'Application

### 3.1 Interface Principale

```
┌─────────────────────────────────────────────────────────────────────┐
│  CDMT            🔔 Notifications     FR ▼    👤 Nom Utilisateur    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                                   │
│  │ 📊 Tableau   │   ┌─────────────────────────────────────────────┐ │
│  │    de bord   │   │                                             │ │
│  ├──────────────┤   │         CONTENU PRINCIPAL                   │ │
│  │ 📋 TOFE      │   │                                             │ │
│  ├──────────────┤   │  - Tableaux de données                      │ │
│  │ 📈 CBMT      │   │  - Graphiques                               │ │
│  ├──────────────┤   │  - Formulaires                              │ │
│  │ 📑 CDMT      │   │  - Rapports                                 │ │
│  │   Global     │   │                                             │ │
│  ├──────────────┤   │                                             │ │
│  │ 🏛️ CDMT     │   │                                             │ │
│  │   Sectoriel  │   │                                             │ │
│  ├──────────────┤   └─────────────────────────────────────────────┘ │
│  │ ⚙️ Paramètres│                                                   │
│  └──────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Menu Principal

| Icône | Menu | Description |
|-------|------|-------------|
| 📊 | Tableau de bord | Vue d'ensemble, alertes, statistiques |
| 📋 | TOFE | Tableau des Opérations Financières |
| 📈 | CBMT | Cadre Budgétaire à Moyen Terme |
| 📑 | CDMT Global | Vue consolidée tous ministères |
| 🏛️ | CDMT Sectoriel | CDMT par ministère |
| 📁 | Référentiels | Données de base |
| 🔄 | Workflow | Validation des documents |
| 📊 | Rapports | Génération et export |
| ⚙️ | Paramètres | Configuration utilisateur |
| 👥 | Administration | Gestion utilisateurs (admin) |

### 3.3 Barre d'Outils

| Bouton | Action |
|--------|--------|
| 🔄 Actualiser | Recharger les données |
| ➕ Ajouter | Créer un nouvel élément |
| ✏️ Modifier | Éditer l'élément sélectionné |
| 🗑️ Supprimer | Supprimer l'élément sélectionné |
| 📥 Importer | Importer depuis Excel |
| 📤 Exporter | Exporter vers Excel/PDF |
| 🖨️ Imprimer | Imprimer le document |

---

## 4. Gestion des Référentiels

### 4.1 Ministères

**Accès :** Référentiels → Ministères

Actions disponibles :
- **Consulter** la liste des ministères
- **Ajouter** un nouveau ministère (Admin)
- **Modifier** les informations
- **Activer/Désactiver** un ministère

### 4.2 Structure Programmatique

**Hiérarchie :**
```
Ministère
└── Programme
    └── Action
        └── Activité
```

**Pour ajouter un programme :**
1. Sélectionnez le ministère parent
2. Cliquez sur **+ Ajouter Programme**
3. Remplissez le formulaire :
   - Code (ex: P01)
   - Nom
   - Description
   - Objectif

### 4.3 Années Fiscales

**Accès :** Référentiels → Années Fiscales

Configurez les exercices budgétaires :
- Année de référence
- Date de début/fin
- Statut (En cours, Clôturé)

---

## 5. Module TOFE

### 5.1 Présentation

Le **TOFE (Tableau des Opérations Financières de l'État)** présente une vue consolidée des finances publiques.

### 5.2 Structure du TOFE

```
RECETTES
├── Recettes fiscales
│   ├── Impôts directs
│   └── Impôts indirects
├── Recettes non fiscales
└── Dons

DÉPENSES
├── Dépenses courantes
│   ├── Salaires
│   ├── Biens et services
│   └── Intérêts
└── Dépenses en capital
    ├── Investissements nationaux
    └── Investissements sur financement extérieur

SOLDE = Recettes - Dépenses
```

### 5.3 Saisie des Données

1. Sélectionnez l'année fiscale
2. Choisissez la version du document
3. Cliquez sur **Modifier**
4. Saisissez les montants par catégorie
5. Cliquez sur **Enregistrer**

> **Note :** Les totaux et le solde sont calculés automatiquement.

### 5.4 Export du TOFE

1. Cliquez sur **📤 Exporter**
2. Choisissez le format :
   - Excel (.xlsx)
   - PDF
3. Le fichier se télécharge automatiquement

---

## 6. Module CBMT

### 6.1 Présentation

Le **CBMT (Cadre Budgétaire à Moyen Terme)** définit les plafonds de dépenses par ministère sur 3 ans.

### 6.2 Tableau des Plafonds

| Ministère | N-1 (Exécuté) | N (LFI) | N+1 | N+2 | N+3 |
|-----------|---------------|---------|-----|-----|-----|
| Éducation | 5 000 | 5 500 | 5 800 | 6 100 | 6 400 |
| Santé | 3 000 | 3 200 | 3 400 | 3 600 | 3 800 |
| ... | ... | ... | ... | ... | ... |

### 6.3 Définition des Plafonds

1. Sélectionnez l'exercice de référence
2. Cliquez sur un ministère
3. Saisissez les plafonds pour N+1, N+2, N+3
4. Validez avec **Enregistrer**

### 6.4 Analyse des Écarts

L'onglet **Analyse** affiche :
- Comparaison N vs N-1
- Taux de croissance
- Répartition sectorielle (graphique)

---

## 7. Module CDMT Global

### 7.1 Présentation

Le **CDMT Global** consolide tous les CDMT sectoriels et présente :
- La vue d'ensemble des dépenses par ministère
- Les projections pluriannuelles
- Les analyses comparatives

### 7.2 Navigation

**Onglets disponibles :**

| Onglet | Contenu |
|--------|---------|
| Synthèse | Tableau récapitulatif |
| Par Ministère | Détail par secteur |
| Par Nature | Classification économique |
| Tendances | Évolution historique |
| Graphiques | Visualisations |

### 7.3 Génération du CDMT Global

1. Accédez à **CDMT Global**
2. Sélectionnez l'exercice
3. Vérifiez que tous les CDMT sectoriels sont validés
4. Cliquez sur **Consolider**
5. Vérifiez les données consolidées
6. Soumettez pour validation

---

## 8. Module CDMT Sectoriel

### 8.1 Présentation

Chaque ministère prépare son **CDMT Sectoriel** avec :
- Le budget tendanciel (projection des dépenses actuelles)
- Les mesures nouvelles proposées
- Les projets d'investissement

### 8.2 Budget Tendanciel

**Étapes de saisie :**

1. **Import des données historiques**
   - Cliquez sur **📥 Importer**
   - Sélectionnez le fichier Excel
   - Vérifiez les données importées

2. **Calcul automatique**
   - Le système projette les dépenses tendancielles
   - Basé sur les règles de croissance paramétrées

3. **Ajustements**
   - Modifiez les projections si nécessaire
   - Justifiez les écarts

### 8.3 Mesures Nouvelles

**Pour ajouter une mesure nouvelle :**

1. Cliquez sur **+ Nouvelle Mesure**
2. Remplissez :
   - Intitulé
   - Programme concerné
   - Type (fonctionnement/investissement)
   - Coût estimé (N+1, N+2, N+3)
   - Justification
3. Joignez les documents de support
4. Enregistrez

### 8.4 Projets d'Investissement

**Types de projets :**
- **PIE** : Projets d'Investissement Exceptionnels
- **PIP** : Programme d'Investissement Public

**Saisie d'un projet :**
1. Sélectionnez le type
2. Entrez les informations :
   - Nom du projet
   - Localisation
   - Source de financement
   - Échéancier des décaissements
3. Attachez l'étude de faisabilité

---

## 9. Workflow de Validation

### 9.1 États d'un Document

| État | Description | Couleur |
|------|-------------|---------|
| Brouillon | En cours de rédaction | ⚪ Gris |
| Soumis | Envoyé pour validation | 🔵 Bleu |
| En révision | Retourné pour corrections | 🟡 Orange |
| Validé | Approuvé | 🟢 Vert |
| Rejeté | Refusé définitivement | 🔴 Rouge |

### 9.2 Processus de Validation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  BROUILLON   │────▶│    SOUMIS    │────▶│   VALIDÉ     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ EN RÉVISION  │
                    └──────────────┘
```

### 9.3 Soumettre un Document

1. Ouvrez le document
2. Vérifiez la complétude des données
3. Cliquez sur **Soumettre pour validation**
4. Ajoutez un commentaire (optionnel)
5. Confirmez

### 9.4 Valider un Document (Valideur)

1. Accédez à **Workflow → Documents en attente**
2. Sélectionnez le document
3. Examinez les données
4. Choisissez une action :
   - **Valider** : Approuver le document
   - **Retourner** : Demander des corrections
   - **Rejeter** : Refuser définitivement
5. Ajoutez un commentaire
6. Confirmez

---

## 10. Rapports et Exports

### 10.1 Types de Rapports

| Rapport | Description | Format |
|---------|-------------|--------|
| TOFE Complet | Tableau des opérations financières | Excel, PDF |
| CBMT Synthèse | Plafonds ministériels | Excel, PDF |
| CDMT Global | Vue consolidée | Excel, PDF |
| CDMT Sectoriel | Par ministère | Excel, PDF |
| Matrice d'Accès | Permissions utilisateurs | PDF |
| Journal d'Audit | Historique des actions | Excel |

### 10.2 Génération d'un Rapport

1. Accédez à **Rapports**
2. Sélectionnez le type de rapport
3. Configurez les paramètres :
   - Période
   - Ministère (si applicable)
   - Format de sortie
4. Cliquez sur **Générer**
5. Téléchargez le fichier

### 10.3 Export Personnalisé

1. Cliquez sur **📤 Export Personnalisé**
2. Sélectionnez les colonnes à inclure
3. Appliquez des filtres
4. Choisissez le format
5. Exportez

### 10.4 Impression

Pour une impression optimisée :
1. Cliquez sur **🖨️ Imprimer**
2. L'aperçu s'affiche
3. Ajustez les paramètres d'impression
4. Imprimez

> **Conseil :** Utilisez le format A4 paysage pour les tableaux larges.

---

## 11. Paramètres et Préférences

### 11.1 Profil Utilisateur

**Accès :** Cliquez sur votre nom → **Mon Profil**

Modifiez :
- Informations personnelles
- Photo de profil
- Mot de passe
- Paramètres 2FA

### 11.2 Préférences d'Affichage

| Paramètre | Options |
|-----------|---------|
| Langue | Français, English, العربية |
| Thème | Clair, Sombre |
| Taille du texte | Normal, Grand |
| Contraste élevé | Oui/Non |

### 11.3 Notifications

Configurez vos alertes :
- ✉️ Email
- 🔔 Push (navigateur)
- 📱 SMS (si disponible)

Types de notifications :
- Documents en attente de validation
- Rappels de délais
- Résultats de validation
- Rapports périodiques

---

## 12. FAQ et Dépannage

### 12.1 Questions Fréquentes

**Q : J'ai oublié mon mot de passe**
> Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé.

**Q : Je n'arrive pas à me connecter avec le 2FA**
> Vérifiez que l'heure de votre téléphone est synchronisée. Utilisez un code de récupération si nécessaire.

**Q : Je ne vois pas certains menus**
> Les menus visibles dépendent de votre profil. Contactez l'administrateur pour vérifier vos permissions.

**Q : L'export Excel ne fonctionne pas**
> Désactivez le bloqueur de popups et réessayez. Vérifiez votre espace disque disponible.

**Q : Les données ne s'affichent pas correctement**
> Cliquez sur 🔄 Actualiser. Videz le cache de votre navigateur si le problème persiste.

### 12.2 Codes d'Erreur

| Code | Message | Solution |
|------|---------|----------|
| AUTH_001 | Session expirée | Reconnectez-vous |
| AUTH_003 | Accès non autorisé | Vérifiez vos permissions |
| VAL_001 | Données invalides | Corrigez les champs en rouge |
| SRV_500 | Erreur serveur | Réessayez plus tard |

### 12.3 Contact Support

**Support Technique :**
- Email : support@cdmt.finances.dj
- Téléphone : +253 XX XX XX XX
- Horaires : Dim-Jeu, 8h-16h (EAT)

**Signaler un Bug :**
1. Notez le message d'erreur exact
2. Capturez une copie d'écran
3. Décrivez les étapes pour reproduire
4. Envoyez au support technique

---

## Annexes

### A. Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| Ctrl + S | Enregistrer |
| Ctrl + P | Imprimer |
| Ctrl + F | Rechercher |
| Échap | Fermer la fenêtre |

### B. Glossaire

| Terme | Définition |
|-------|------------|
| **CDMT** | Cadre de Dépenses à Moyen Terme |
| **CBMT** | Cadre Budgétaire à Moyen Terme |
| **TOFE** | Tableau des Opérations Financières de l'État |
| **LFI** | Loi de Finances Initiale |
| **PIE** | Projet d'Investissement Exceptionnel |
| **PIP** | Programme d'Investissement Public |

---

**Propriétaire du Document :** Équipe Formation
**Approuvé Par :** Direction des Systèmes d'Information
**Prochaine Révision :** 2026-04-01
