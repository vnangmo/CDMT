# Matrice des Droits d'Acces - CDMT

*Generated on: 2026-01-05*

## Resume des Roles

| Code | Nom | Description | Utilisateurs | Permissions |
|------|-----|-------------|--------------|-------------|
| ADMIN_SYSTEM | Administrateur Système | Accès complet au système, gestion des utilisateurs et configuration | 1 | 43 |
| DIR_BUDGET | Direction du Budget | Pilotage du processus CDMT, élaboration CBMT et CDMT Global | 1 | 68 |
| DIR_DETTE | Direction de la Dette | Gestion de la dette publique, projections de service de la dette | 1 | 34 |
| DIR_PLANIFICATION | Direction de la Planification | Gestion PIE et PIP, validation des investissements | 1 | 44 |
| DIR_SOLDE | Direction de la Solde | Gestion des données de masse salariale | 1 | 33 |
| MINISTRY | Ministère Sectoriel | Élaboration des CDMT Sectoriels | 1 | 26 |
| PTF | Partenaire Technique et Financier | Consultation uniquement | 1 | 25 |

## Matrice des Permissions par Module

### Legende
- ✓ : Acces complet
- ○ : Acces partiel
- ✗ : Pas d'acces

### Module: ANALYTICS

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

### Module: AUDIT

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| EXPORT | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: BUDGET

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| EXPORT | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| IMPORT | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| READ_OWN | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| UPDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: cbmt

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CBMT_CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CBMT_DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CBMT_READ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CBMT_UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CBMT_VALIDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: CBMT

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| PUBLISH | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: cdmt_global

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CDMT_GLOBAL_CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_GLOBAL_DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_GLOBAL_READ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_GLOBAL_UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_GLOBAL_VALIDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: CDMT_GLOBAL

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| PUBLISH | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: CDMT_SECTOR

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| READ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RETURN | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| SUBMIT | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VIEW_ALL | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| VIEW_OWN | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

### Module: cdmt_sectoral

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CDMT_SECTORAL_CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_SECTORAL_DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_SECTORAL_READ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_SECTORAL_UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CDMT_SECTORAL_VALIDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: COMMENT

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

### Module: DASHBOARD

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Module: DETTE

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| EXPORT | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| IMPORT | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| UPDATE | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |

### Module: EXECUTION

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| EXPORT | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| IMPORT | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: macro

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| MACRO_CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MACRO_DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MACRO_READ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MACRO_UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: MACRO

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| PUBLISH | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: NOTIFICATION

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| READ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SEND | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: PIE

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| EXPORT | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| IMPORT | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

### Module: PIP

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| DELETE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| EXPORT | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| IMPORT | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UPDATE | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| VALIDATE | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

### Module: referential

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| REF_CREATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF_DELETE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF_READ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF_UPDATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: REFERENTIEL

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| REF:CREATE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF:DELETE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF:EXPORT | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| REF:IMPORT | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REF:READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| REF:UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: REPORT

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| EXPORT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Module: reporting

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| REPORT_EXPORT | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| REPORT_GENERATE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: ROLE

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| ASSIGN_PERMISSION | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CREATE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: SOLDE

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| CREATE | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| DELETE | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| EXPORT | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| IMPORT | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| UPDATE | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |

### Module: system

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| SYSTEM_CONFIG | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| USER_MANAGE | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: SYSTEM

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| ADMIN | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| BACKUP | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CONFIG | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| LOGS | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: USER

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| ASSIGN_ROLE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CREATE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| DELETE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: VERSION

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| COMPARE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CREATE | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| READ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RESTORE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Module: WORKFLOW

| Permission | ADMIN | BUDGET | DETTE | PLANIF | SOLDE | MINIST | PTF |
|------------|------|------|------|------|------|------|------|
| REJECT | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| SUBMIT | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| VALIDATE | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| VIEW | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Statistiques

- **Total des roles**: 7
- **Total des permissions**: 137
- **Modules couverts**: 29

## Details des Roles

### Administrateur Système (ADMIN_SYSTEM)

**Description**: Accès complet au système, gestion des utilisateurs et configuration

**Permissions (43)**:
- **SYSTEM**: ADMIN, CONFIG, LOGS, BACKUP
- **USER**: CREATE, READ, UPDATE, DELETE, ASSIGN_ROLE
- **ROLE**: CREATE, READ, UPDATE, DELETE, ASSIGN_PERMISSION
- **REFERENTIEL**: REF:CREATE, REF:READ, REF:UPDATE, REF:DELETE, REF:IMPORT, REF:EXPORT
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: VIEW_ALL
- **BUDGET**: READ
- **EXECUTION**: READ
- **PIE**: READ
- **PIP**: READ
- **DETTE**: READ
- **SOLDE**: READ
- **VERSION**: CREATE, READ, UPDATE, DELETE, RESTORE, COMPARE
- **AUDIT**: READ, EXPORT
- **REPORT**: CREATE, READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW

### Direction du Budget (DIR_BUDGET)

**Description**: Pilotage du processus CDMT, élaboration CBMT et CDMT Global

**Permissions (68)**:
- **USER**: READ
- **ROLE**: READ
- **REFERENTIEL**: REF:CREATE, REF:READ, REF:UPDATE, REF:DELETE, REF:IMPORT, REF:EXPORT
- **MACRO**: CREATE, READ, UPDATE, DELETE, VALIDATE, PUBLISH
- **CBMT**: CREATE, READ, UPDATE, DELETE, VALIDATE, PUBLISH
- **CDMT_GLOBAL**: CREATE, READ, UPDATE, DELETE, VALIDATE, PUBLISH
- **CDMT_SECTOR**: READ, VIEW_ALL, VALIDATE, RETURN
- **BUDGET**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT
- **EXECUTION**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT
- **PIE**: READ, VALIDATE
- **PIP**: READ, VALIDATE
- **DETTE**: READ
- **SOLDE**: READ
- **VERSION**: CREATE, READ, RESTORE, COMPARE
- **WORKFLOW**: SUBMIT, VALIDATE, REJECT, VIEW
- **COMMENT**: CREATE, READ, UPDATE, DELETE
- **NOTIFICATION**: READ, SEND
- **REPORT**: CREATE, READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW
- **AUDIT**: READ

### Direction de la Dette (DIR_DETTE)

**Description**: Gestion de la dette publique, projections de service de la dette

**Permissions (34)**:
- **USER**: READ
- **ROLE**: READ
- **REFERENTIEL**: REF:READ
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: READ
- **BUDGET**: READ
- **EXECUTION**: READ
- **PIE**: READ
- **PIP**: READ
- **DETTE**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT, VALIDATE
- **SOLDE**: READ
- **VERSION**: CREATE, READ, COMPARE
- **WORKFLOW**: SUBMIT, VALIDATE, VIEW
- **COMMENT**: CREATE, READ, UPDATE
- **NOTIFICATION**: READ
- **REPORT**: CREATE, READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW

### Direction de la Planification (DIR_PLANIFICATION)

**Description**: Gestion PIE et PIP, validation des investissements

**Permissions (44)**:
- **USER**: READ
- **ROLE**: READ
- **REFERENTIEL**: REF:READ, REF:EXPORT
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: READ, VIEW_ALL
- **BUDGET**: READ, EXPORT
- **EXECUTION**: READ, EXPORT
- **PIE**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT, VALIDATE
- **PIP**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT, VALIDATE
- **DETTE**: READ
- **SOLDE**: READ
- **VERSION**: CREATE, READ, COMPARE
- **WORKFLOW**: SUBMIT, VALIDATE, VIEW
- **COMMENT**: CREATE, READ, UPDATE
- **NOTIFICATION**: READ
- **REPORT**: CREATE, READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW

### Direction de la Solde (DIR_SOLDE)

**Description**: Gestion des données de masse salariale

**Permissions (33)**:
- **USER**: READ
- **ROLE**: READ
- **REFERENTIEL**: REF:READ
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: READ
- **BUDGET**: READ
- **EXECUTION**: READ
- **PIE**: READ
- **PIP**: READ
- **DETTE**: READ
- **SOLDE**: CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT
- **VERSION**: CREATE, READ, COMPARE
- **WORKFLOW**: SUBMIT, VALIDATE, VIEW
- **COMMENT**: CREATE, READ, UPDATE
- **NOTIFICATION**: READ
- **REPORT**: CREATE, READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW

### Ministère Sectoriel (MINISTRY)

**Description**: Élaboration des CDMT Sectoriels

**Permissions (26)**:
- **REFERENTIEL**: REF:READ
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: CREATE, READ, UPDATE, DELETE, SUBMIT, VIEW_OWN
- **BUDGET**: READ_OWN, EXPORT
- **EXECUTION**: READ, EXPORT
- **PIE**: READ
- **PIP**: READ
- **VERSION**: READ, COMPARE
- **WORKFLOW**: SUBMIT, VIEW
- **COMMENT**: CREATE, READ
- **NOTIFICATION**: READ
- **REPORT**: READ, EXPORT
- **DASHBOARD**: VIEW

### Partenaire Technique et Financier (PTF)

**Description**: Consultation uniquement

**Permissions (25)**:
- **REFERENTIEL**: REF:READ
- **MACRO**: READ
- **CBMT**: READ
- **CDMT_GLOBAL**: READ
- **CDMT_SECTOR**: READ
- **BUDGET**: READ, EXPORT
- **EXECUTION**: READ, EXPORT
- **PIE**: READ, EXPORT
- **PIP**: READ, EXPORT
- **DETTE**: READ
- **SOLDE**: READ
- **VERSION**: READ, COMPARE
- **WORKFLOW**: VIEW
- **COMMENT**: CREATE, READ
- **NOTIFICATION**: READ
- **REPORT**: READ, EXPORT
- **ANALYTICS**: VIEW
- **DASHBOARD**: VIEW

