# CDMT Application - Contraintes Techniques

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**Référence :** Section 6.2 - Contraintes Techniques

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Options d'Hébergement](#2-options-dhébergement)
3. [Interconnexion Système Budgétaire](#3-interconnexion-système-budgétaire)
4. [Compatibilité Infrastructure IT](#4-compatibilité-infrastructure-it)
5. [Spécifications Réseau](#5-spécifications-réseau)
6. [Sécurité Infrastructure](#6-sécurité-infrastructure)
7. [Plan de Déploiement](#7-plan-de-déploiement)

---

## 1. Vue d'Ensemble

### 1.1 Résumé des Contraintes

| Contrainte | Exigence | Solution |
|------------|----------|----------|
| Hébergement | Serveurs locaux ou cloud sécurisé | Architecture hybride supportée |
| Interconnexion | Système budgétaire existant | API REST + ETL configurable |
| Compatibilité IT | Infrastructure Ministère | Standards ouverts, containerisation |

### 1.2 Architecture Flexible

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OPTIONS DE DÉPLOIEMENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  OPTION A: ON-PREMISE          OPTION B: CLOUD         OPTION C:    │
│  (Serveurs Locaux)             (Cloud Sécurisé)        HYBRIDE      │
│                                                                      │
│  ┌─────────────────┐          ┌─────────────────┐    ┌───────────┐  │
│  │   Data Center   │          │   AWS / Azure   │    │  Hybride  │  │
│  │   Ministère     │          │   GovCloud      │    │           │  │
│  │                 │          │                 │    │ On-Prem + │  │
│  │ • Full control  │          │ • Scalabilité   │    │ Cloud     │  │
│  │ • Data souver.  │          │ • Haute dispo.  │    │           │  │
│  │ • Air-gapped    │          │ • Managed       │    │ • Backup  │  │
│  └─────────────────┘          └─────────────────┘    │   cloud   │  │
│                                                       │ • DR site │  │
│  ✅ Supporté                  ✅ Supporté             └───────────┘  │
│                                                       ✅ Recommandé  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Options d'Hébergement

### 2.1 Option A : Serveurs Locaux (On-Premise)

#### 2.1.1 Architecture On-Premise

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ARCHITECTURE ON-PREMISE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌─────────────────────┐                          │
│                    │   Load Balancer     │                          │
│                    │   (HAProxy/Nginx)   │                          │
│                    └──────────┬──────────┘                          │
│                               │                                      │
│              ┌────────────────┼────────────────┐                    │
│              │                │                │                    │
│              ▼                ▼                ▼                    │
│       ┌───────────┐    ┌───────────┐    ┌───────────┐              │
│       │ App Srv 1 │    │ App Srv 2 │    │ App Srv 3 │              │
│       │ (Primary) │    │ (Standby) │    │ (Standby) │              │
│       └─────┬─────┘    └─────┬─────┘    └─────┬─────┘              │
│             │                │                │                     │
│             └────────────────┼────────────────┘                     │
│                              │                                      │
│              ┌───────────────┼───────────────┐                      │
│              │               │               │                      │
│              ▼               ▼               ▼                      │
│       ┌───────────┐    ┌───────────┐   ┌───────────┐               │
│       │ PostgreSQL│    │   Redis   │   │  Storage  │               │
│       │  Primary  │───▶│  Cluster  │   │   (NAS)   │               │
│       │ + Replica │    │           │   │           │               │
│       └───────────┘    └───────────┘   └───────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Spécifications Matérielles

**Serveur d'Application (x2 minimum) :**

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Stockage | 100 GB SSD | 250 GB SSD |
| Réseau | 1 Gbps | 10 Gbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

**Serveur Base de Données (x2 Primary/Replica) :**

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 4 vCPU | 16 vCPU |
| RAM | 16 GB | 32 GB |
| Stockage | 500 GB SSD | 1 TB NVMe |
| IOPS | 3000 | 10000+ |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

**Serveur Redis :**

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Stockage | 50 GB SSD | 100 GB SSD |

#### 2.1.3 Avantages On-Premise

| Avantage | Description |
|----------|-------------|
| **Souveraineté des données** | Données sur le territoire national |
| **Contrôle total** | Maîtrise complète de l'infrastructure |
| **Conformité** | Facilite la conformité réglementaire |
| **Latence réduite** | Accès réseau local |
| **Coûts prévisibles** | Pas de coûts variables cloud |

#### 2.1.4 Prérequis On-Premise

- [ ] Alimentation électrique redondante (UPS + Groupe électrogène)
- [ ] Climatisation data center
- [ ] Connexion internet redondante
- [ ] Équipe système disponible 24/7
- [ ] Procédures de sauvegarde établies

---

### 2.2 Option B : Cloud Sécurisé

#### 2.2.1 Fournisseurs Cloud Compatibles

| Fournisseur | Service | Certification |
|-------------|---------|---------------|
| **AWS** | AWS GovCloud | ISO 27001, SOC 2 |
| **Microsoft Azure** | Azure Government | ISO 27001, FedRAMP |
| **Google Cloud** | GCP | ISO 27001, SOC 2 |
| **OVH** | Hosted Private Cloud | HDS, ISO 27001 |
| **Scaleway** | Sovereign Cloud | SecNumCloud |

#### 2.2.2 Architecture Cloud (AWS Exemple)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE AWS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                         VPC                                  │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │                  Public Subnet                       │    │    │
│  │  │  ┌─────────────┐        ┌─────────────┐             │    │    │
│  │  │  │     ALB     │        │   NAT GW    │             │    │    │
│  │  │  └──────┬──────┘        └─────────────┘             │    │    │
│  │  └─────────┼───────────────────────────────────────────┘    │    │
│  │            │                                                 │    │
│  │  ┌─────────┼───────────────────────────────────────────┐    │    │
│  │  │         │         Private Subnet                     │    │    │
│  │  │         ▼                                            │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │    │
│  │  │  │  ECS/EKS    │  │  ECS/EKS    │  │  ECS/EKS    │  │    │    │
│  │  │  │  Task 1     │  │  Task 2     │  │  Task 3     │  │    │    │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │    │    │
│  │  │         │                │                │         │    │    │
│  │  │         └────────────────┼────────────────┘         │    │    │
│  │  │                          │                          │    │    │
│  │  │         ┌────────────────┼────────────────┐         │    │    │
│  │  │         ▼                ▼                ▼         │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │    │
│  │  │  │  RDS        │  │ ElastiCache │  │     S3      │  │    │    │
│  │  │  │ PostgreSQL  │  │   Redis     │  │  (Backups)  │  │    │    │
│  │  │  │ Multi-AZ    │  │             │  │             │  │    │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.2.3 Services Cloud Utilisés

| Service | Fonction | Alternative On-Premise |
|---------|----------|------------------------|
| **ECS/EKS** | Conteneurs | Docker + Kubernetes |
| **RDS PostgreSQL** | Base de données | PostgreSQL natif |
| **ElastiCache** | Cache Redis | Redis Server |
| **S3** | Stockage objets | MinIO / NAS |
| **ALB** | Load Balancer | HAProxy / Nginx |
| **CloudWatch** | Monitoring | Prometheus + Grafana |
| **KMS** | Chiffrement | HashiCorp Vault |

#### 2.2.4 Estimation Coûts Cloud (AWS)

| Ressource | Spécification | Coût/mois (USD) |
|-----------|---------------|-----------------|
| ECS Fargate | 4 vCPU, 8 GB × 3 | ~$350 |
| RDS PostgreSQL | db.r6g.large Multi-AZ | ~$400 |
| ElastiCache | cache.t3.medium | ~$50 |
| ALB | Application Load Balancer | ~$25 |
| S3 | 100 GB + transferts | ~$10 |
| CloudWatch | Logs + Metrics | ~$30 |
| **Total estimé** | | **~$865/mois** |

---

### 2.3 Option C : Architecture Hybride (Recommandé)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE HYBRIDE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ON-PREMISE (Ministère)              CLOUD (AWS/Azure)             │
│   ─────────────────────               ─────────────────             │
│                                                                      │
│   ┌─────────────────────┐            ┌─────────────────────┐        │
│   │  PRODUCTION         │            │  DISASTER RECOVERY  │        │
│   │                     │            │                     │        │
│   │  • App Servers      │◀── VPN ──▶│  • Standby DB       │        │
│   │  • PostgreSQL       │  Sécurisé  │  • Backups S3      │        │
│   │  • Redis            │            │  • Replica async    │        │
│   │  • Fichiers         │            │                     │        │
│   └─────────────────────┘            └─────────────────────┘        │
│                                                                      │
│   Avantages:                                                         │
│   ✅ Données sensibles on-premise                                    │
│   ✅ Backup cloud sécurisé                                          │
│   ✅ Site de reprise en cas de sinistre                             │
│   ✅ Scalabilité cloud si besoin                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Interconnexion Système Budgétaire

### 3.1 Architecture d'Intégration

```
┌─────────────────────────────────────────────────────────────────────┐
│              INTERCONNEXION SYSTÈMES EXISTANTS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  Système    │    │  Système    │    │  Système    │              │
│  │  Comptable  │    │    Paie     │    │  Marchés    │              │
│  │  (SIGFIP)   │    │   (SIGRHP)  │    │  Publics    │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                      │
│         │    REST API      │    SFTP/API      │    API               │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    INTEGRATION LAYER                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │  API        │  │    ETL      │  │   Message   │          │    │
│  │  │  Gateway    │  │   Engine    │  │   Queue     │          │    │
│  │  │             │  │             │  │  (RabbitMQ) │          │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                               │
│                    │      CDMT       │                               │
│                    │   Application   │                               │
│                    └─────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Points d'Intégration

| Système Source | Données Échangées | Méthode | Fréquence |
|----------------|-------------------|---------|-----------|
| **SIGFIP** (Comptabilité) | Exécutions budgétaires | API REST | Quotidien |
| **SIGRHP** (Paie) | Masse salariale | SFTP/CSV | Mensuel |
| **Marchés Publics** | Engagements | API REST | Temps réel |
| **Douanes** | Recettes douanières | API REST | Quotidien |
| **Impôts** | Recettes fiscales | API REST | Mensuel |
| **Trésor** | Situation de caisse | API REST | Quotidien |

### 3.3 API d'Intégration

#### 3.3.1 Import de Données

```typescript
// Endpoint d'import depuis système externe
POST /api/v1/integration/import
Authorization: Bearer <service_token>
Content-Type: application/json

{
  "source": "SIGFIP",
  "dataType": "BUDGET_EXECUTION",
  "fiscalYear": "2026",
  "data": [
    {
      "ministryCode": "EDUC",
      "programCode": "P01",
      "economicCode": "21",
      "commitment": 500000000,
      "payment": 450000000,
      "date": "2026-01-05"
    }
  ],
  "checksum": "sha256:abc123...",
  "timestamp": "2026-01-05T10:00:00Z"
}
```

#### 3.3.2 Export de Données

```typescript
// Endpoint d'export vers système externe
GET /api/v1/integration/export
Authorization: Bearer <service_token>
Content-Type: application/json

Query Parameters:
- target: SIGFIP
- dataType: BUDGET_ALLOCATION
- fiscalYear: 2026
- format: JSON | XML | CSV

Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "recordCount": 150,
    "generatedAt": "2026-01-05T10:00:00Z",
    "checksum": "sha256:def456..."
  }
}
```

### 3.4 Connecteurs Disponibles

| Connecteur | Description | Configuration |
|------------|-------------|---------------|
| **REST API** | Intégration HTTP standard | URL, Auth, Headers |
| **SFTP** | Transfert de fichiers | Host, Port, Credentials |
| **Database Link** | Connexion directe DB | Connection string |
| **Message Queue** | Asynchrone (RabbitMQ) | Queue name, Exchange |
| **Web Service** | SOAP (legacy) | WSDL URL |

### 3.5 Configuration des Connecteurs

```yaml
# config/integrations.yaml

integrations:
  sigfip:
    type: rest_api
    base_url: https://sigfip.finances.dj/api
    auth:
      type: oauth2
      client_id: ${SIGFIP_CLIENT_ID}
      client_secret: ${SIGFIP_CLIENT_SECRET}
    endpoints:
      executions: /v1/executions
      engagements: /v1/engagements
    sync:
      frequency: daily
      time: "02:00"

  sigrhp:
    type: sftp
    host: sftp.sigrhp.finances.dj
    port: 22
    username: ${SIGRHP_USER}
    private_key: ${SIGRHP_KEY_PATH}
    remote_path: /exports/cdmt/
    sync:
      frequency: monthly
      day: 5

  customs:
    type: rest_api
    base_url: https://api.douanes.dj
    auth:
      type: api_key
      header: X-API-Key
      key: ${CUSTOMS_API_KEY}
```

### 3.6 ETL Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ETL PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EXTRACT              TRANSFORM              LOAD                    │
│  ────────             ─────────              ────                    │
│                                                                      │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐               │
│  │ Source   │        │ Validate │        │  CDMT    │               │
│  │ Systems  │──────▶ │ Clean    │──────▶ │ Database │               │
│  │          │        │ Map      │        │          │               │
│  └──────────┘        │ Enrich   │        └──────────┘               │
│                      └──────────┘                                    │
│                                                                      │
│  Transformations:                                                    │
│  • Mapping codes budgétaires                                        │
│  • Conversion devises                                               │
│  • Agrégation par période                                           │
│  • Validation des totaux                                            │
│  • Détection des anomalies                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Compatibilité Infrastructure IT

### 4.1 Standards Supportés

| Catégorie | Standards | Support |
|-----------|-----------|---------|
| **Protocoles** | HTTP/HTTPS, REST, SOAP | ✅ |
| **Formats** | JSON, XML, CSV, Excel | ✅ |
| **Auth** | OAuth 2.0, JWT, SAML, LDAP | ✅ |
| **Sécurité** | TLS 1.2/1.3, AES-256 | ✅ |
| **Containers** | Docker, Kubernetes | ✅ |
| **Base de données** | PostgreSQL, MySQL* | ✅ |

### 4.2 Systèmes d'Exploitation Supportés

**Serveurs :**

| OS | Version | Support |
|----|---------|---------|
| Ubuntu Server | 22.04 LTS, 24.04 LTS | ✅ Recommandé |
| Debian | 11, 12 | ✅ Supporté |
| RHEL / CentOS | 8, 9 | ✅ Supporté |
| Windows Server | 2019, 2022 | ⚠️ Via Docker |

**Postes Clients :**

| OS | Version | Navigateurs |
|----|---------|-------------|
| Windows | 10, 11 | Chrome, Edge, Firefox |
| macOS | 12+ | Chrome, Safari, Firefox |
| Linux | Ubuntu 22.04+ | Chrome, Firefox |

### 4.3 Intégration Active Directory / LDAP

```
┌─────────────────────────────────────────────────────────────────────┐
│              INTÉGRATION ACTIVE DIRECTORY                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐         ┌─────────────────┐                    │
│  │  Active         │         │      CDMT       │                    │
│  │  Directory      │◀──────▶ │   Application   │                    │
│  │  (Ministère)    │  LDAPS  │                 │                    │
│  └─────────────────┘         └─────────────────┘                    │
│                                                                      │
│  Flux d'authentification:                                           │
│  1. Utilisateur entre credentials AD                                │
│  2. CDMT vérifie contre AD via LDAPS                               │
│  3. Si OK, création/mise à jour user local                         │
│  4. Attribution rôle CDMT basé sur groupe AD                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Configuration LDAP :**

```env
# .env
LDAP_ENABLED=true
LDAP_URL=ldaps://ad.finances.dj:636
LDAP_BIND_DN=cn=cdmt-service,ou=Services,dc=finances,dc=dj
LDAP_BIND_PASSWORD=secure_password
LDAP_SEARCH_BASE=ou=Users,dc=finances,dc=dj
LDAP_SEARCH_FILTER=(sAMAccountName={{username}})

# Mapping groupes AD -> Rôles CDMT
LDAP_GROUP_MAPPING='{
  "CN=CDMT-Admin,OU=Groups,DC=finances,DC=dj": "ADMIN",
  "CN=CDMT-DirBudget,OU=Groups,DC=finances,DC=dj": "DIR_BUDGET",
  "CN=CDMT-Ministry,OU=Groups,DC=finances,DC=dj": "SECTORAL_MINISTRY"
}'
```

### 4.4 Proxy et Pare-feu

**Ports Requis :**

| Port | Service | Direction | Description |
|------|---------|-----------|-------------|
| 443 | HTTPS | Inbound | Application web |
| 5432 | PostgreSQL | Internal | Base de données |
| 6379 | Redis | Internal | Cache |
| 636 | LDAPS | Outbound | Active Directory |
| 587 | SMTP | Outbound | Emails |

**Configuration Proxy :**

```env
# Si accès internet via proxy
HTTP_PROXY=http://proxy.finances.dj:8080
HTTPS_PROXY=http://proxy.finances.dj:8080
NO_PROXY=localhost,127.0.0.1,.finances.dj
```

### 4.5 Antivirus et Sécurité

| Composant | Recommandation |
|-----------|----------------|
| **Antivirus** | Exclure dossiers Node.js et uploads |
| **WAF** | ModSecurity ou équivalent |
| **IDS/IPS** | Règles pour API REST |
| **SIEM** | Export logs vers SIEM existant |

---

## 5. Spécifications Réseau

### 5.1 Topologie Réseau

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOPOLOGIE RÉSEAU                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         INTERNET                                     │
│                            │                                         │
│                     ┌──────┴──────┐                                 │
│                     │  Firewall   │                                 │
│                     │  (FortiGate)│                                 │
│                     └──────┬──────┘                                 │
│                            │                                         │
│              ┌─────────────┴─────────────┐                          │
│              │                           │                          │
│         ┌────┴────┐                ┌─────┴─────┐                    │
│         │   DMZ   │                │  INTERNE  │                    │
│         │         │                │           │                    │
│         │ ┌─────┐ │                │  ┌─────┐  │                    │
│         │ │Nginx│ │                │  │ App │  │                    │
│         │ │Proxy│ │──────────────▶ │  │Servs│  │                    │
│         │ └─────┘ │                │  └──┬──┘  │                    │
│         │         │                │     │     │                    │
│         └─────────┘                │  ┌──┴──┐  │                    │
│                                    │  │ DB  │  │                    │
│                                    │  └─────┘  │                    │
│                                    │           │                    │
│                                    └───────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Bande Passante Requise

| Utilisation | Minimum | Recommandé |
|-------------|---------|------------|
| Par utilisateur | 256 Kbps | 1 Mbps |
| Serveur vers Internet | 10 Mbps | 100 Mbps |
| Inter-serveurs | 1 Gbps | 10 Gbps |

### 5.3 Latence Acceptable

| Opération | Maximum |
|-----------|---------|
| Chargement page | < 2s |
| Requête API | < 500ms |
| Export rapport | < 10s |
| Import fichier | < 30s |

---

## 6. Sécurité Infrastructure

### 6.1 Chiffrement

| Niveau | Méthode | Standard |
|--------|---------|----------|
| **Transit** | TLS 1.3 | Certificats Let's Encrypt ou CA interne |
| **Repos (DB)** | AES-256 | PostgreSQL pgcrypto |
| **Repos (Files)** | AES-256 | LUKS ou BitLocker |
| **Backups** | AES-256-GCM | OpenSSL |

### 6.2 Certificats SSL

```bash
# Génération certificat Let's Encrypt
certbot certonly --nginx -d cdmt.finances.dj

# Ou certificat auto-signé pour interne
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/ssl/private/cdmt.key \
  -out /etc/ssl/certs/cdmt.crt \
  -subj "/CN=cdmt.finances.dj/O=Ministry of Finance/C=DJ"
```

### 6.3 Hardening Serveur

```bash
# Script de hardening Ubuntu
#!/bin/bash

# Mises à jour automatiques sécurité
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Désactiver services inutiles
systemctl disable avahi-daemon
systemctl disable cups

# SSH hardening
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Fail2ban
apt install fail2ban
systemctl enable fail2ban

# UFW Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## 7. Plan de Déploiement

### 7.1 Checklist Pré-Déploiement

**Infrastructure :**
- [ ] Serveurs provisionnés et configurés
- [ ] Réseau configuré (VLAN, firewall)
- [ ] Certificats SSL installés
- [ ] DNS configuré
- [ ] Backup configuré et testé

**Sécurité :**
- [ ] Hardening serveurs effectué
- [ ] Antivirus configuré
- [ ] WAF configuré
- [ ] Monitoring en place
- [ ] Alertes configurées

**Intégration :**
- [ ] Connecteurs testés
- [ ] LDAP/AD configuré
- [ ] API keys générées
- [ ] VPN configuré (si hybride)

### 7.2 Procédure de Déploiement

```bash
# 1. Cloner le repository
git clone https://github.com/ministry/cdmt.git
cd cdmt

# 2. Configuration environnement
cp .env.example .env
nano .env  # Configurer les variables

# 3. Build et déploiement Docker
docker-compose -f docker-compose.prod.yml up -d

# 4. Migrations base de données
docker exec cdmt-backend npx prisma migrate deploy

# 5. Seed données initiales
docker exec cdmt-backend npx prisma db seed

# 6. Vérification
curl -k https://cdmt.finances.dj/health
```

### 7.3 Validation Post-Déploiement

| Test | Commande/Action |
|------|-----------------|
| Santé API | `curl https://cdmt.finances.dj/health` |
| Connexion DB | `docker exec cdmt-backend npx prisma db pull` |
| Authentification | Tester login via interface |
| LDAP | Tester connexion AD |
| SSL | `openssl s_client -connect cdmt.finances.dj:443` |
| Performance | Test de charge avec k6 ou JMeter |

---

## Annexes

### A. Contacts Support Infrastructure

| Rôle | Contact |
|------|---------|
| Admin Système | sysadmin@finances.dj |
| Admin Réseau | network@finances.dj |
| Sécurité | security@finances.dj |
| Support Applicatif | support@cdmt.finances.dj |

### B. Documentation Associée

- [Guide de Déploiement Docker](./DEPLOYMENT.md)
- [Configuration Nginx](./NGINX_CONFIG.md)
- [Backup Strategy](./BACKUP_STRATEGY.md)

---

**Propriétaire du Document :** Direction des Systèmes d'Information
**Approuvé Par :** DSI - Ministère des Finances
**Prochaine Révision :** 2026-07-01
