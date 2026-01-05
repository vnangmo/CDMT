# PLAN DE DÉVELOPPEMENT
## Application Web de Gestion du CDMT - République de Djibouti

---

## 1. VUE D'ENSEMBLE DU PROJET

### 1.1 Objectif
Développer une plateforme web complète pour automatiser l'élaboration du Cadre de Dépenses à Moyen Terme (CDMT) incluant:
- Cadre Macroéconomique et TOFE prévisionnel
- CBMT (Cadre Budgétaire à Moyen Terme)
- CDMT Global
- CDMT Sectoriels

### 1.2 Périmètre fonctionnel
**6 modules principaux:**
1. Gestion du Cadre Macroéconomique et CBMT
2. Élaboration du CDMT Global
3. Élaboration des CDMT Sectoriels
4. Gestion des Référentiels
5. Workflow et Validation
6. Reporting et Tableaux de Bord

### 1.3 Utilisateurs cibles
- Administrateur Système
- Direction du Budget (Ministère des Finances)
- Direction de la Planification
- Ministères et Institutions Sectoriels (50+)
- Direction de la Dette
- Direction de la Solde
- Partenaires Techniques et Financiers (consultation)

### 1.4 Calendrier global
- **Phase de développement:** 12-18 mois
- **Phase pilote:** 3 mois
- **Déploiement complet:** 6 mois

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technologique recommandée

#### Frontend
- **Framework:** React.js avec TypeScript
- **UI Library:** Material-UI (MUI)
- **Gestion d'état:** Redux Toolkit
- **Routing:** React Router v6
- **Graphiques:** Chart.js + Recharts
- **Génération PDF:** jsPDF + html2canvas
- **Tableaux de données:** AG-Grid ou TanStack Table
- **Validation de formulaires:** React Hook Form + Yup
- **Requêtes API:** React Query (TanStack Query)
- **Internationalisation:** i18next

#### Backend
- **Framework:** Node.js avec Express.js + TypeScript
- **API:** RESTful API
- **Authentification:** JWT + Passport.js
- **Validation:** Joi
- **ORM:** Prisma ou TypeORM
- **Documentation API:** Swagger/OpenAPI
- **Emails:** Nodemailer
- **Tâches planifiées:** Node-cron
- **Gestion de fichiers:** Multer

#### Base de données
- **Principale:** PostgreSQL 15+
- **Cache:** Redis
- **Migrations:** Prisma Migrate ou TypeORM Migrations

#### Infrastructure
- **Hébergement:** Serveurs locaux ou Cloud (AWS/Azure)
- **Containerisation:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **SSL/TLS:** Let's Encrypt ou certificat gouvernemental
- **Monitoring:** PM2 + Prometheus + Grafana (optionnel)
- **Backup:** Scripts automatisés + stockage redondant

#### DevOps
- **Contrôle de version:** Git (GitHub/GitLab)
- **CI/CD:** GitHub Actions ou GitLab CI
- **Tests:** Jest + React Testing Library + Supertest
- **Linting:** ESLint + Prettier

### 2.2 Architecture applicative

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│          React + Redux + Material-UI                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────┴──────────────────────────────────┐
│                  API GATEWAY (Nginx)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Auth     │  CBMT    │  CDMT    │  Workflow      │   │
│  │  Module   │  Module  │  Module  │  Module        │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────┬──────────────────┬──────────────────────┘
               │                  │
       ┌───────┴────┐      ┌─────┴──────┐
       │ PostgreSQL │      │   Redis    │
       │  (Primary) │      │  (Cache)   │
       └────────────┘      └────────────┘
```

---

## 3. MODÈLE DE DONNÉES (Schéma simplifié)

### 3.1 Entités principales

**Utilisateurs et Accès**
- `users` - Utilisateurs du système
- `roles` - Rôles (Admin, Dir. Budget, Ministère, etc.)
- `permissions` - Permissions granulaires
- `audit_logs` - Logs d'audit

**Référentiels**
- `ministries` - Ministères et institutions
- `programs` - Programmes budgétaires
- `actions` - Actions (niveau 2)
- `activities` - Activités (niveau 3)
- `economic_categories` - Catégories économiques (Titres)
- `financing_sources` - Sources de financement
- `functional_classification` - Classification fonctionnelle

**Cadre Macroéconomique**
- `macro_frameworks` - Cadres macroéconomiques
- `macro_hypotheses` - Hypothèses macro (PIB, inflation, etc.)
- `revenue_projections` - Projections de recettes
- `tofe` - TOFE prévisionnel

**CBMT**
- `cbmt_documents` - Documents CBMT
- `cbmt_revenue_aggregates` - Agrégats de recettes
- `cbmt_expense_aggregates` - Agrégats de dépenses
- `cbmt_reserves` - Réserves (précaution + arbitrage)
- `cbmt_scenarios` - Scénarios (optimiste/pessimiste/réaliste)

**CDMT Global**
- `cdmt_global_documents` - Documents CDMT Global
- `baseline_budgets` - Budgets tendanciels par ministère
- `central_new_measures` - Mesures nouvelles du niveau central
- `fiscal_space` - Marge de manœuvre
- `ministerial_ceilings` - Plafonds ministériels

**CDMT Sectoriels**
- `cdmt_sectoral_documents` - Documents CDMT Sectoriels
- `sectoral_baselines` - Tendanciels sectoriels
- `sectoral_new_measures` - Mesures nouvelles sectorielles
- `action_plans` - Plans d'action
- `projects` - Projets (PIE/PIP)
- `activity_costing` - Chiffrage des activités

**Workflow**
- `workflow_states` - États des documents (Brouillon, Soumis, Validé, etc.)
- `workflow_history` - Historique des changements d'état
- `comments` - Commentaires et observations
- `notifications` - Notifications

**Versions**
- `budget_years` - Années budgétaires
- `document_versions` - Versions de documents

---

## 4. PLAN DE DÉVELOPPEMENT PAR PHASES

### PHASE 1: INITIALISATION ET FONDATIONS (Mois 1-2)

#### Sprint 1.1: Configuration du projet (2 semaines)
**Objectifs:**
- Mise en place de l'infrastructure de développement
- Configuration des outils de base

**Tâches:**
1. Initialiser les dépôts Git (frontend + backend)
2. Configurer Docker et Docker Compose
3. Mettre en place React + TypeScript + Material-UI
4. Mettre en place Node.js + Express + TypeScript
5. Configurer PostgreSQL et Redis
6. Mettre en place ESLint, Prettier, Husky
7. Configurer les environnements (dev, staging, prod)
8. Créer la structure de dossiers
9. Configurer Swagger pour la documentation API
10. Mettre en place le pipeline CI/CD de base

**Livrables:**
- Environnement de développement fonctionnel
- Repositories configurés
- Documentation de setup

#### Sprint 1.2: Authentification et base utilisateurs (2 semaines)
**Objectifs:**
- Système d'authentification sécurisé
- Gestion des utilisateurs et rôles

**Tâches:**
1. Concevoir le modèle de données utilisateurs
2. Implémenter l'inscription/connexion (JWT)
3. Créer le système de rôles et permissions (RBAC)
4. Développer les écrans de login/logout
5. Implémenter la gestion du mot de passe (reset, changement)
6. Créer l'interface d'administration des utilisateurs
7. Implémenter l'audit trail de base
8. Ajouter la gestion de session
9. Tests unitaires et d'intégration
10. Documentation API

**Livrables:**
- Module d'authentification complet
- Interface de gestion des utilisateurs
- Tests et documentation

---

### PHASE 2: MODULES RÉFÉRENTIELS (Mois 3-4)

#### Sprint 2.1: Gestion des référentiels (3 semaines)
**Objectifs:**
- Créer tous les référentiels de base

**Tâches:**
1. Concevoir le modèle de données des référentiels
2. API CRUD pour les ministères/institutions
3. API CRUD pour la structure programmatique
4. API CRUD pour les classifications économiques
5. API CRUD pour les sources de financement
6. API CRUD pour la classification fonctionnelle
7. Interface de gestion des ministères
8. Interface de gestion de la structure programmatique
9. Interface de gestion des classifications
10. Import/Export Excel des référentiels
11. Validation des données
12. Tests et documentation

**Livrables:**
- Module de gestion des référentiels complet
- Interfaces CRUD fonctionnelles
- Capacité d'import/export

#### Sprint 2.2: Gestion des versions et années budgétaires (1 semaine)
**Objectifs:**
- Système de versioning des documents

**Tâches:**
1. Modèle de données pour les versions
2. API de gestion des années budgétaires
3. API de gestion des versions de documents
4. Interface de sélection d'année/version
5. Historisation automatique
6. Tests et documentation

**Livrables:**
- Système de versioning opérationnel

---

### PHASE 3: MODULE CADRE MACROÉCONOMIQUE ET CBMT (Mois 5-6)

#### Sprint 3.1: Cadre Macroéconomique (2 semaines)
**Objectifs:**
- Saisie et projection des hypothèses macro

**Tâches:**
1. Modèle de données du cadre macro
2. API pour les hypothèses macroéconomiques
3. API pour les projections de recettes
4. API pour les projections de dépenses
5. Moteur de calcul des projections
6. Interface de saisie des hypothèses macro
7. Interface de projection des recettes
8. Interface de projection des dépenses
9. Validation et règles de cohérence
10. Tests et documentation

**Livrables:**
- Module cadre macroéconomique fonctionnel
- Calculs automatiques opérationnels

#### Sprint 3.2: TOFE Prévisionnel (1 semaine)
**Objectifs:**
- Génération automatique du TOFE

**Tâches:**
1. Modèle de données TOFE
2. API de génération du TOFE
3. Moteur de calcul des soldes
4. Interface d'affichage du TOFE
5. Vérification de cohérence CBMT-TOFE
6. Export PDF/Excel du TOFE
7. Tests et documentation

**Livrables:**
- TOFE prévisionnel généré automatiquement
- Export en formats multiples

#### Sprint 3.3: CBMT (3 semaines)
**Objectifs:**
- Élaboration complète du CBMT

**Tâches:**
1. Modèle de données CBMT
2. API pour les agrégats de recettes/dépenses
3. API de gestion des réserves
4. API de gestion des scénarios
5. Moteur de calcul du CBMT
6. Interface de saisie du CBMT
7. Interface de gestion des scénarios
8. Analyse de sensibilité
9. Comparaison de scénarios
10. Réconciliation CBMT-TOFE
11. Alertes d'incohérence
12. Export CBMT (PDF/Excel)
13. Tests et documentation

**Livrables:**
- Module CBMT complet
- Gestion multi-scénarios
- Exports automatiques

---

### PHASE 4: MODULE CDMT GLOBAL (Mois 7-8)

#### Sprint 4.1: Budgets Tendanciels (2 semaines)
**Objectifs:**
- Calcul automatique des tendanciels

**Tâches:**
1. Modèle de données des tendanciels
2. API d'import des budgets antérieurs
3. Moteur de calcul des tendanciels
4. Identification des dépenses temporaires
5. Application des hypothèses de croissance
6. Distinction ministères prioritaires/non prioritaires
7. Interface de configuration des hypothèses
8. Interface d'affichage des tendanciels
9. Ajustements manuels possibles
10. Tests et documentation

**Livrables:**
- Calcul automatique des tendanciels
- Paramétrages flexibles

#### Sprint 4.2: Marge de manœuvre et mesures nouvelles (2 semaines)
**Objectifs:**
- Gestion de la marge de manœuvre

**Tâches:**
1. Modèle de données marge de manœuvre
2. API de calcul de la marge
3. API de gestion des mesures nouvelles centrales
4. Moteur de calcul de la marge disponible
5. Interface de visualisation de la marge
6. Interface de saisie des mesures nouvelles
7. Imputation automatique sur la marge
8. Traçabilité des décisions
9. Alertes de dépassement
10. Tests et documentation

**Livrables:**
- Gestion complète de la marge de manœuvre
- Traçabilité des arbitrages

#### Sprint 4.3: Plafonds ministériels (2 semaines)
**Objectifs:**
- Répartition et calcul des plafonds

**Tâches:**
1. Modèle de données des plafonds
2. API de répartition de la marge
3. API de calcul des plafonds ministériels
4. Moteur de calcul: Tendanciel + Mesures + Marge
5. Interface de répartition de la marge
6. Simulation et scénarios de répartition
7. Interface d'affichage des plafonds par ministère
8. Décomposition par catégorie de dépense
9. Export du CDMT Global (PDF/Excel)
10. Itérations CBMT ↔ CDMT Global
11. Tests et documentation

**Livrables:**
- Module CDMT Global complet
- Calcul automatique des plafonds
- Capacité d'itération

---

### PHASE 5: MODULE CDMT SECTORIELS (Mois 9-11)

#### Sprint 5.1: Structure programmatique sectorielle (2 semaines)
**Objectifs:**
- Configuration de la structure par ministère

**Tâches:**
1. Modèle de données structure programmatique
2. API de gestion programmes/actions/activités
3. API de gestion des objectifs et indicateurs
4. Interface de configuration de la structure
5. Hiérarchie à 3 niveaux (Programme > Action > Activité)
6. Association avec les classifications
7. Tests et documentation

**Livrables:**
- Configuration flexible de la structure programmatique

#### Sprint 5.2: Tendanciels sectoriels (2 semaines)
**Objectifs:**
- Calcul des tendanciels au niveau sectoriel

**Tâches:**
1. Modèle de données tendanciels sectoriels
2. API de calcul des tendanciels par programme
3. Intégration des plafonds du CDMT Global
4. Retrait des dépenses exceptionnelles
5. Projection par programme/action
6. Intégration PIE/PIP
7. Revue des projets et requêtes
8. Interface de visualisation des tendanciels
9. Interface de gestion PIE/PIP
10. Notification automatique des plafonds
11. Tests et documentation

**Livrables:**
- Tendanciels sectoriels calculés automatiquement
- Intégration PIE/PIP

#### Sprint 5.3: Mesures nouvelles et plans d'action (3 semaines)
**Objectifs:**
- Saisie et chiffrage des mesures sectorielles

**Tâches:**
1. Modèle de données mesures nouvelles sectorielles
2. Modèle de données plans d'action
3. API de gestion des mesures nouvelles
4. API de chiffrage des plans d'action
5. Moteur de calcul des coûts (quantités × coûts unitaires)
6. Interface de saisie des mesures nouvelles
7. Interface de saisie des activités nouvelles
8. Interface de saisie des projets nouveaux
9. Interface de chiffrage détaillé
10. Contrainte de respect de la marge disponible
11. Alertes de dépassement
12. Tests et documentation

**Livrables:**
- Gestion complète des mesures nouvelles
- Chiffrage détaillé des activités

#### Sprint 5.4: Priorisation et consolidation (2 semaines)
**Objectifs:**
- Priorisation et cohérence CDMT Sectoriel ↔ Global

**Tâches:**
1. Modèle de données de priorisation
2. API de notation/classement des activités
3. API de consolidation sectoriel ↔ global
4. Moteur de simulation sous contrainte budgétaire
5. Interface de priorisation des activités
6. Interface de simulation budgétaire
7. Contrôle automatique du respect des plafonds
8. Alertes en cas de dépassement
9. Consolidation automatique
10. Export CDMT Sectoriel (PDF/Excel)
11. Tests et documentation

**Livrables:**
- Module CDMT Sectoriel complet
- Priorisation fonctionnelle
- Contrôle de cohérence automatique

---

### PHASE 6: WORKFLOW ET VALIDATION (Mois 12-13)

#### Sprint 6.1: Circuit de validation (3 semaines)
**Objectifs:**
- Workflow complet de validation

**Tâches:**
1. Modèle de données workflow
2. API de gestion des états de documents
3. API de soumission/validation/rejet
4. Moteur de workflow configurable
5. Interface de soumission (ministères)
6. Interface d'examen (Direction du Budget)
7. Interface de validation finale
8. Gestion des commentaires et observations
9. Possibilité de rejet avec justification
10. Retour en révision
11. Tests et documentation

**Livrables:**
- Workflow de validation opérationnel
- Circuit multi-niveaux

#### Sprint 6.2: Notifications et historique (1 semaine)
**Objectifs:**
- Système de notifications

**Tâches:**
1. Modèle de données notifications
2. API de notifications
3. Service d'emails (Nodemailer)
4. Notifications in-app
5. Rappels automatiques
6. Interface de gestion des notifications
7. Historique complet des opérations
8. Journal d'audit détaillé
9. Tests et documentation

**Livrables:**
- Système de notifications complet
- Audit trail exhaustif

---

### PHASE 7: REPORTING ET TABLEAUX DE BORD (Mois 14-15)

#### Sprint 7.1: Génération de documents (2 semaines)
**Objectifs:**
- Export automatique des documents réglementaires

**Tâches:**
1. Templates PDF pour TOFE
2. Templates PDF pour CBMT
3. Templates PDF pour CDMT Global
4. Templates PDF pour CDMT Sectoriels
5. Export Excel pour tous les documents
6. Service de génération PDF (jsPDF)
7. Service de génération Excel
8. Interface de génération de documents
9. Personnalisation des exports
10. Tests et documentation

**Livrables:**
- Génération automatique des documents
- Formats multiples (PDF/Excel)

#### Sprint 7.2: Tableaux de bord (3 semaines)
**Objectifs:**
- Dashboards analytiques

**Tâches:**
1. Conception des tableaux de bord
2. API de données agrégées
3. Dashboard CBMT (vue d'ensemble)
4. Dashboard CDMT Global (par ministère)
5. Dashboard CDMT Sectoriels (suivi élaboration)
6. Dashboard consolidé (tous ministères)
7. Indicateurs clés (KPIs)
8. Graphiques interactifs (Chart.js/Recharts)
9. Filtres et drill-down
10. Export des dashboards
11. Tests et documentation

**Livrables:**
- Tableaux de bord analytiques complets
- Visualisations interactives

#### Sprint 7.3: Analyses et rapports personnalisés (1 semaine)
**Objectifs:**
- Analyses comparatives

**Tâches:**
1. API d'analyses comparatives
2. Évolution pluriannuelle
3. Comparaison inter-ministères
4. Tendanciel vs réalisé
5. Budget vs prévision
6. Interface d'analyse comparative
7. Exports personnalisés (colonnes, filtres)
8. Tests et documentation

**Livrables:**
- Module d'analyses comparatives
- Exports personnalisables

---

### PHASE 8: OPTIMISATION ET FINALISATION (Mois 16-17)

#### Sprint 8.1: Performance et optimisation (2 semaines)
**Objectifs:**
- Optimiser les performances

**Tâches:**
1. Profiling de l'application
2. Optimisation des requêtes SQL
3. Mise en cache (Redis) des données fréquentes
4. Pagination et lazy loading
5. Optimisation du bundle frontend
6. Code splitting
7. Compression des assets
8. Optimisation des images
9. Tests de charge
10. Amélioration des temps de réponse

**Livrables:**
- Application performante (<2s chargement)
- Optimisations appliquées

#### Sprint 8.2: Sécurité et tests (2 semaines)
**Objectifs:**
- Sécurisation complète

**Tâches:**
1. Audit de sécurité
2. Tests de pénétration
3. Validation des entrées (XSS, SQL Injection)
4. CSRF protection
5. Rate limiting
6. Configuration HTTPS/SSL
7. Sécurisation des headers HTTP
8. Tests de sécurité automatisés
9. Mise en place des backups automatiques
10. Plan de reprise d'activité

**Livrables:**
- Application sécurisée
- Conformité aux standards de sécurité

#### Sprint 8.3: Internationalisation (1 semaine)
**Objectifs:**
- Support multi-langues

**Tâches:**
1. Configuration i18next
2. Traduction interface (Français/Anglais/Arabe)
3. Sélecteur de langue
4. Traduction des documents générés
5. RTL support (Arabe)
6. Tests multilingues

**Livrables:**
- Application multilingue (FR/EN/AR)

#### Sprint 8.4: Accessibilité (1 semaine)
**Objectifs:**
- Conformité WCAG 2.1 AA

**Tâches:**
1. Audit d'accessibilité
2. Support lecteurs d'écran
3. Navigation au clavier
4. Contraste des couleurs
5. Labels ARIA
6. Tests d'accessibilité
7. Corrections

**Livrables:**
- Application accessible (WCAG 2.1 AA)

---

### PHASE 9: DOCUMENTATION ET FORMATION (Mois 18)

#### Sprint 9.1: Documentation (2 semaines)
**Objectifs:**
- Documentation complète

**Tâches:**
1. Documentation technique (architecture, API)
2. Manuel administrateur
3. Manuel utilisateur (par profil)
4. Guide de déploiement
5. Guide de maintenance
6. Documentation API (Swagger)
7. Diagrammes (architecture, flux, etc.)
8. FAQ
9. Vidéos tutoriels (optionnel)
10. Traduction de la documentation

**Livrables:**
- Documentation complète
- Manuels par profil utilisateur

#### Sprint 9.2: Matériel de formation (2 semaines)
**Objectifs:**
- Préparation des formations

**Tâches:**
1. Guides de formation (Administrateurs)
2. Guides de formation (Direction du Budget)
3. Guides de formation (Ministères)
4. Supports de présentation (PowerPoint)
5. Exercices pratiques
6. Études de cas
7. Vidéos de démonstration
8. Environment de formation (données fictives)
9. Questionnaires d'évaluation

**Livrables:**
- Matériel pédagogique complet
- Environment de formation prêt

---

### PHASE 10: DÉPLOIEMENT ET TRANSITION (Mois 19-21)

#### Mois 19: Phase pilote (3 mois)
**Objectifs:**
- Test en conditions réelles

**Tâches:**
1. Déploiement sur environnement de production
2. Import des données de référence
3. Formation des administrateurs (3 jours)
4. Formation Direction du Budget (5 jours)
5. Formation 3-5 ministères pilotes (3 jours)
6. Utilisation avec 3-5 ministères pilotes
7. Collecte des retours utilisateurs
8. Corrections de bugs
9. Ajustements fonctionnels
10. Optimisations

**Livrables:**
- Application en production (pilote)
- Retours utilisateurs collectés
- Corrections appliquées

#### Mois 20-21: Déploiement complet (3 mois)
**Objectifs:**
- Généralisation à tous les ministères

**Tâches:**
1. Formation de tous les ministères (par vagues)
2. Déploiement progressif
3. Support technique intensif
4. Monitoring et résolution d'incidents
5. Ajustements finaux
6. Migration complète des données
7. Documentation des processus opérationnels
8. Transfert de compétences
9. Mise en place du support (hot-line)
10. Recette finale

**Livrables:**
- Application déployée pour tous les ministères
- Support opérationnel en place
- Recette validée

---

## 5. GESTION DES RISQUES

### 5.1 Risques techniques
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Complexité des calculs budgétaires | Élevée | Élevé | Validation avec experts métier, tests unitaires exhaustifs |
| Performance avec gros volumes | Moyenne | Élevé | Optimisation SQL, mise en cache, pagination |
| Sécurité des données sensibles | Moyenne | Critique | Audit sécurité, tests de pénétration, chiffrement |
| Compatibilité navigateurs | Faible | Moyen | Tests cross-browser, utilisation de polyfills |

### 5.2 Risques organisationnels
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Résistance au changement | Élevée | Élevé | Formation intensive, accompagnement, communication |
| Disponibilité des experts métier | Moyenne | Élevé | Planification des sessions de validation, documentation |
| Retard dans les décisions | Moyenne | Moyen | Points de décision identifiés, escalation claire |

### 5.3 Risques projet
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Dérive du périmètre | Moyenne | Élevé | Gestion stricte des changements, comité de pilotage |
| Sous-estimation de la complexité | Moyenne | Moyen | Buffers dans le planning, développement itératif |
| Turnover de l'équipe | Faible | Élevé | Documentation continue, pair programming |

---

## 6. ÉQUIPE PROJET RECOMMANDÉE

### 6.1 Composition de l'équipe
- **Chef de projet:** 1 (temps plein)
- **Architecte technique:** 1 (50%)
- **Développeurs fullstack:** 3-4 (temps plein)
- **Développeur frontend:** 1-2 (temps plein)
- **Développeur backend:** 1-2 (temps plein)
- **Expert base de données:** 1 (50%)
- **UX/UI Designer:** 1 (50%)
- **QA/Testeur:** 1 (temps plein)
- **DevOps:** 1 (50%)
- **Expert métier (CDMT):** 1-2 (conseil, 20%)
- **Formateur:** 1-2 (phases 9-10)

### 6.2 Rôles côté client
- **Sponsor projet:** Direction du Budget
- **Product Owner:** Direction du Budget (1 personne)
- **Référents métier:** Par module (5-6 personnes)
- **Testeurs utilisateurs:** Représentants ministères (10-15)

---

## 7. JALONS ET LIVRABLES CLÉS

| Jalon | Date (mois) | Livrables |
|-------|-------------|-----------|
| **J1: Démarrage** | M1 | Plan projet validé, équipe constituée |
| **J2: Fondations** | M2 | Authentification, infrastructure |
| **J3: Référentiels** | M4 | Référentiels opérationnels |
| **J4: CBMT** | M6 | Module CBMT complet |
| **J5: CDMT Global** | M8 | Module CDMT Global complet |
| **J6: CDMT Sectoriel** | M11 | Module CDMT Sectoriel complet |
| **J7: Workflow** | M13 | Workflow de validation opérationnel |
| **J8: Reporting** | M15 | Tableaux de bord et exports |
| **J9: Finalisation** | M17 | Application complète et optimisée |
| **J10: Documentation** | M18 | Documentation et formation prêtes |
| **J11: Pilote** | M19 | Phase pilote terminée |
| **J12: Déploiement** | M21 | Déploiement complet |

---

## 8. CRITÈRES DE SUCCÈS

### 8.1 Critères fonctionnels
- ✅ Tous les modules développés et opérationnels
- ✅ Calculs automatiques validés par experts métier
- ✅ Workflow de validation fonctionnel
- ✅ Génération automatique des documents réglementaires
- ✅ 50+ ministères peuvent utiliser l'application

### 8.2 Critères techniques
- ✅ Temps de réponse < 2 secondes
- ✅ Support de 100+ utilisateurs simultanés
- ✅ Taux de disponibilité > 99%
- ✅ Conformité sécurité (HTTPS, authentification, audit)
- ✅ Backups automatiques quotidiens

### 8.3 Critères utilisateurs
- ✅ Taux de satisfaction > 80%
- ✅ Taux d'adoption > 90% (ministères)
- ✅ Réduction du temps d'élaboration CDMT > 50%
- ✅ Taux d'erreurs < 5%

---

## 9. MAINTENANCE ET SUPPORT POST-DÉPLOIEMENT

### 9.1 Support technique (Année 1)
- **Hot-line:** Disponible pendant les heures ouvrables
- **Temps de réponse:**
  - Critique: < 4 heures
  - Élevé: < 1 jour
  - Moyen: < 3 jours
  - Faible: < 1 semaine
- **Support on-site:** Si nécessaire

### 9.2 Maintenance
- **Corrective:** Résolution des bugs
- **Évolutive:** Améliorations fonctionnelles (15-20% budget initial/an)
- **Adaptive:** Mises à jour technologiques
- **Préventive:** Monitoring, optimisations

### 9.3 Mises à jour
- **Mineures:** Mensuelles (bugs, petites améliorations)
- **Majeures:** Trimestrielles (nouvelles fonctionnalités)
- **Sécurité:** Immédiate si critique

---

## 10. BUDGET ESTIMATIF (Ordre de grandeur)

### 10.1 Coûts de développement
| Poste | Estimation |
|-------|------------|
| Équipe de développement (18 mois) | À définir |
| Infrastructure et licences | À définir |
| Formation | À définir |
| Déploiement | À définir |
| **TOTAL** | **À chiffrer selon budget GEDES** |

### 10.2 Coûts récurrents (annuels)
| Poste | Estimation |
|-------|------------|
| Hébergement | À définir |
| Maintenance et support | 15-20% du coût initial |
| Évolutions | À définir |
| Licences | À définir |

---

## 11. PROCHAINES ÉTAPES

### 11.1 Validation du plan
1. Présentation au comité de pilotage
2. Validation du périmètre et du calendrier
3. Validation du budget
4. Signature du plan de développement

### 11.2 Lancement du projet
1. Constitution de l'équipe projet
2. Mise en place de l'infrastructure
3. Kick-off meeting
4. Démarrage Sprint 1.1

### 11.3 Gouvernance
- **Comité de pilotage:** Mensuel
- **Revue de sprint:** Bi-hebdomadaire
- **Point d'avancement:** Hebdomadaire
- **Rapport d'activité:** Mensuel

---

## ANNEXES

### A. Méthodologie de développement
**Approche Agile (Scrum)**
- Sprints de 2-3 semaines
- Daily stand-ups
- Sprint planning
- Sprint review & retrospective
- Product backlog priorisé
- Développement itératif et incrémental

### B. Environnements
1. **Développement:** Environnement local (Docker)
2. **Intégration:** Serveur de test (CI/CD)
3. **Staging:** Environnement de pré-production
4. **Production:** Environnement de production

### C. Standards de développement
- Code reviews obligatoires
- Tests unitaires (couverture > 70%)
- Tests d'intégration
- Documentation inline (JSDoc/TSDoc)
- Commit messages conventionnels
- Branches Git (feature/bugfix/hotfix)

### D. Outils de suivi
- **Gestion de projet:** Jira ou Azure DevOps
- **Documentation:** Confluence ou Notion
- **Communication:** Slack ou Teams
- **Dépôts:** GitHub ou GitLab
- **Monitoring:** Grafana + Prometheus

---

**Document préparé le:** 03 janvier 2026
**Version:** 1.0
**Statut:** Draft pour validation
