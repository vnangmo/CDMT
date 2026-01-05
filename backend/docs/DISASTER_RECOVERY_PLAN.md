# CDMT Application - Disaster Recovery Plan (DRP)

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Sprint:** 8.2 - Security & Testing
**Classification:** CONFIDENTIAL

---

## Executive Summary

This Disaster Recovery Plan (DRP) defines procedures for recovering the CDMT application following a catastrophic failure, cyber attack, natural disaster, or data loss event. The plan ensures **business continuity** and **minimal data loss**.

**Recovery Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour
- **Availability Target:** 99.9% (8.76 hours downtime/year)

**Critical Systems:**
1. PostgreSQL Database
2. Backend API (Node.js/Express)
3. Frontend Application (React)
4. File Storage (Uploads/Generated Reports)

---

## 1. Disaster Scenarios & Response

### 1.1 Database Failure/Corruption

**Scenario:** Primary database server fails or data is corrupted

**Detection:**
- Application health checks fail
- Database connection errors in logs
- Monitoring alerts triggered

**Recovery Procedure:**

```bash
# STEP 1: Assess damage
psql -U postgres -h localhost -c "SELECT version();"

# STEP 2: Download latest backup from S3
aws s3 cp s3://cdmt-backups/database/latest/cdmt_db_latest.sql.gz /tmp/

# STEP 3: Stop application services
sudo systemctl stop cdmt-backend
sudo systemctl stop cdmt-frontend

# STEP 4: Drop corrupted database (if exists)
dropdb -U postgres cdmt_db

# STEP 5: Create new database
createdb -U postgres -O postgres cdmt_db

# STEP 6: Restore from backup
gunzip -c /tmp/cdmt_db_latest.sql.gz | psql -U postgres cdmt_db

# STEP 7: Verify restoration
psql -U postgres cdmt_db -c "SELECT COUNT(*) FROM users;"
psql -U postgres cdmt_db -c "SELECT COUNT(*) FROM \"Ministry\";"

# STEP 8: Apply WAL logs (if using PITR)
# Recovery to specific time if needed
# recovery.conf: recovery_target_time = '2026-01-04 14:00:00'

# STEP 9: Restart application
sudo systemctl start cdmt-backend
sudo systemctl start cdmt-frontend

# STEP 10: Smoke test
curl http://localhost:5000/health
curl http://localhost:5000/api/v1/ministries
```

**Estimated Recovery Time:** 2 hours

---

### 1.2 Server Compromise / Ransomware Attack

**Scenario:** Server is compromised, ransomware encrypts files

**Immediate Actions:**
1. **Isolate** infected server (disconnect network)
2. **Document** everything (screenshots, logs)
3. **Notify** security team and management
4. **DO NOT** pay ransom

**Recovery Procedure:**

```bash
# PHASE 1: CONTAINMENT (0-30 minutes)
# - Disconnect compromised server from network
# - Preserve forensic evidence
# - Identify attack vector

# PHASE 2: ERADICATION (30min - 2 hours)
# - Provision new clean server
# - Apply all security patches
# - Change all credentials

# PHASE 3: RECOVERY (2-4 hours)
# 1. Install fresh OS and dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install postgresql-14 nodejs npm nginx -y

# 2. Restore database from last known good backup
aws s3 cp s3://cdmt-backups/database/pre-attack/cdmt_db_20260103.sql.gz /tmp/
createdb -U postgres cdmt_db
gunzip -c /tmp/cdmt_db_20260103.sql.gz | psql -U postgres cdmt_db

# 3. Deploy application from git (verified commit)
cd /opt/cdmt
git clone https://github.com/cdmt/backend.git
cd backend
git checkout <verified-commit-hash>
npm ci  # Clean install
npm run build

# 4. Restore configuration (from secure backup)
aws s3 cp s3://cdmt-backups-secure/config/env_20260103.enc /tmp/
openssl enc -aes-256-cbc -d -in /tmp/env_20260103.enc -out .env

# 5. Restore uploaded files
aws s3 sync s3://cdmt-backups/files/uploads/ /opt/cdmt/uploads/

# 6. Update all secrets (passwords, API keys, JWT secret)
# Generate new secrets in .env

# 7. Restart services with new credentials
sudo systemctl restart postgresql
sudo systemctl restart cdmt-backend

# PHASE 4: POST-INCIDENT (4+ hours)
# - Perform security audit
# - Apply additional hardening
# - Review and update security policies
```

**Estimated Recovery Time:** 4 hours

---

### 1.3 Complete Data Center Failure

**Scenario:** Primary data center is offline (fire, flood, power outage)

**Failover to DR Site:**

```bash
# STEP 1: Activate DR server (AWS, Azure, or secondary data center)
# Assuming DR server is pre-configured with application stack

# STEP 2: Restore latest database backup to DR server
ssh dr-server.finances.dj
aws s3 cp s3://cdmt-backups/database/latest/cdmt_db_latest.sql.gz /tmp/
gunzip -c /tmp/cdmt_db_latest.sql.gz | psql -U postgres cdmt_db

# STEP 3: Update DNS records to point to DR site
# Method 1: Route 53 (AWS)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://failover-dns.json

# Method 2: Manual DNS update
# Update A record: cdmt.finances.dj -> DR_SERVER_IP

# STEP 4: Update application configuration
# Update .env with DR-specific settings
sed -i 's/DATABASE_URL=.*/DATABASE_URL=<DR_DATABASE_URL>/' .env

# STEP 5: Start services on DR site
sudo systemctl start cdmt-backend
sudo systemctl start cdmt-frontend
sudo systemctl start nginx

# STEP 6: Verify application is accessible
curl https://cdmt.finances.dj/health

# STEP 7: Monitor logs for issues
tail -f /var/log/cdmt/backend.log

# STEP 8: Notify users of temporary DR site
# Send email notification via backup communication channel
```

**Estimated Recovery Time:** 3 hours
**DNS Propagation:** Additional 1-24 hours (use low TTL in normal operations)

---

### 1.4 Accidental Data Deletion

**Scenario:** User accidentally deletes critical data

**Recovery Options:**

**Option A: Restore from most recent backup**
```bash
# Find timestamp of deletion
# Restore database to point before deletion

# 1. Create temporary restore database
createdb -U postgres cdmt_restore_temp

# 2. Restore backup taken before deletion
gunzip -c /tmp/cdmt_db_20260104_010000.sql.gz | psql -U postgres cdmt_restore_temp

# 3. Extract deleted records
psql -U postgres cdmt_restore_temp -c \
  "COPY (SELECT * FROM \"Ministry\" WHERE id = 'deleted-id') TO '/tmp/deleted_records.csv' CSV HEADER;"

# 4. Import into production database
psql -U postgres cdmt_db -c \
  "COPY \"Ministry\" FROM '/tmp/deleted_records.csv' CSV HEADER;"

# 5. Clean up
dropdb -U postgres cdmt_restore_temp
```

**Option B: Soft-delete recovery (if implemented)**
```sql
-- Restore soft-deleted record
UPDATE "Ministry"
SET "deletedAt" = NULL
WHERE id = 'deleted-id';
```

**Estimated Recovery Time:** 30 minutes - 1 hour

---

## 2. Communication Plan

### 2.1 Incident Response Team

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| **Incident Commander** | [CTO Name] | +253 XXXX XXXX | Overall coordination |
| **Database Admin** | [DBA Name] | +253 XXXX XXXX | Database recovery |
| **DevOps Lead** | [DevOps Name] | +253 XXXX XXXX | Infrastructure recovery |
| **Security Officer** | [Security Name] | +253 XXXX XXXX | Security assessment |
| **Communications Lead** | [Comms Name] | +253 XXXX XXXX | Stakeholder updates |

### 2.2 Escalation Path

```
1. On-Call Engineer
   ↓ (30 minutes - no resolution)
2. Team Lead
   ↓ (1 hour - no resolution)
3. CTO
   ↓ (2 hours - major incident)
4. Ministry Leadership
```

### 2.3 Stakeholder Communication Templates

**Initial Notification (within 30 minutes):**
```
Subject: CDMT System Alert - [Incident Type]

We are currently experiencing [brief description of issue].
Our team is actively working on resolution.

Status: Under Investigation
Estimated Time to Resolution: [X hours]
Next Update: [Time]

For questions, contact: support@finances.dj
```

**Resolution Notification:**
```
Subject: CDMT System Restored

The CDMT system has been fully restored as of [time].

Summary:
- Incident: [Description]
- Impact: [What was affected]
- Resolution: [What was done]
- Data Loss: [Yes/No - details]

Post-incident review will be conducted on [date].
```

---

## 3. Recovery Procedures by System

### 3.1 PostgreSQL Database

**Full Restoration:**
1. Stop application
2. Drop existing database
3. Create new database
4. Restore from backup
5. Apply WAL logs (if PITR)
6. Verify integrity
7. Restart application

**Partial Restoration:**
1. Create temporary restore database
2. Restore backup to temp DB
3. Extract specific data
4. Import to production
5. Verify consistency

### 3.2 Backend Application

**Code Deployment:**
```bash
cd /opt/cdmt/backend
git fetch origin
git checkout <verified-commit>
npm ci
npm run build
pm2 restart cdmt-backend
```

**Configuration Recovery:**
```bash
# Restore .env from encrypted backup
aws s3 cp s3://cdmt-backups-secure/config/env_latest.enc /tmp/
openssl enc -aes-256-cbc -d -in /tmp/env_latest.enc -out /opt/cdmt/backend/.env -k $KEY
```

### 3.3 Frontend Application

**Rebuild and Deploy:**
```bash
cd /opt/cdmt/frontend
git fetch origin
git checkout <verified-commit>
npm ci
npm run build
sudo cp -r build/* /var/www/cdmt/
```

### 3.4 File Storage

**Restore Uploaded Files:**
```bash
# Full restoration
aws s3 sync s3://cdmt-backups/files/uploads/ /opt/cdmt/uploads/ --delete

# Incremental (specific date)
aws s3 sync s3://cdmt-backups/files/uploads/2026/01/04/ /opt/cdmt/uploads/2026/01/04/
```

---

## 4. Testing & Validation

### 4.1 DR Test Schedule

| Test Type | Frequency | Duration | Next Test |
|-----------|-----------|----------|-----------|
| **Tabletop Exercise** | Quarterly | 2 hours | 2026-04-01 |
| **Database Restore Test** | Monthly | 1 hour | 2026-02-01 |
| **Full DR Failover** | Annually | 4 hours | 2026-06-01 |
| **Surprise Drill** | Bi-annually | 3 hours | 2026-07-01 |

### 4.2 Test Checklist

**Pre-Test:**
- [ ] Notify team 48 hours in advance
- [ ] Prepare test environment
- [ ] Document current production state
- [ ] Assign roles to team members

**During Test:**
- [ ] Follow DRP procedures exactly
- [ ] Document time taken for each step
- [ ] Note any issues or blockers
- [ ] Test all communication channels

**Post-Test:**
- [ ] Measure RTO/RPO achieved
- [ ] Identify gaps in procedures
- [ ] Update DRP based on lessons learned
- [ ] Report results to management

---

## 5. Maintenance & Updates

### 5.1 Document Review Schedule

- **Quarterly Review:** Update contact information, procedures
- **Annual Audit:** Full plan review and testing
- **After Incidents:** Update based on lessons learned
- **Infrastructure Changes:** Update procedures for new systems

### 5.2 Training Requirements

**All Technical Staff:**
- Annual DR training session
- Quarterly tabletop exercises
- Access to DRP documentation

**Key Personnel:**
- Hands-on restoration practice (bi-annually)
- Incident command training
- Communication protocols

---

## 6. Post-Incident Activities

### 6.1 Post-Incident Review (PIR)

**Within 48 hours of resolution:**
1. Conduct PIR meeting with incident response team
2. Document timeline of events
3. Identify root cause
4. Determine what worked / what didn't
5. Create action items for improvements

**PIR Template:**
```
Incident: [ID and Brief Description]
Date: [YYYY-MM-DD]
Duration: [X hours]
Impact: [Systems affected, users impacted]

Timeline:
- 00:00 - Initial detection
- 00:15 - Team assembled
- 01:00 - Root cause identified
- 03:00 - Recovery completed

Root Cause: [Detailed explanation]

What Went Well:
- [List successes]

What Needs Improvement:
- [List issues]

Action Items:
- [ ] [Action 1] - Assigned to: [Name] - Due: [Date]
- [ ] [Action 2] - Assigned to: [Name] - Due: [Date]
```

### 6.2 Improvement Implementation

Track action items in project management system
Review progress in weekly operations meetings
Update DRP documentation with improvements

---

## 7. Contact Information

**Primary Contacts:**
- **On-Call Engineer:** +253 XXXX XXXX
- **DevOps Team:** devops@finances.dj
- **Security Team:** security@finances.dj

**External Vendors:**
- **AWS Support:** [Support Plan Number]
- **Database Consultant:** [Contact]
- **Cybersecurity Firm:** [Contact]

**Emergency Services:**
- **Police Cyber Crime Unit:** [Number]
- **Fire Department:** [Number]
- **Building Security:** [Number]

---

## 8. Appendices

### Appendix A: Backup Locations

- **Database Backups:** s3://cdmt-backups/database/
- **File Backups:** s3://cdmt-backups/files/
- **Configuration Backups:** s3://cdmt-backups-secure/config/

### Appendix B: System Credentials

**CONFIDENTIAL - Stored in secure password manager**
- Vault: cdmt-disaster-recovery
- Access: Incident Commander, CTO only

### Appendix C: Network Diagram

[Include infrastructure diagram showing primary and DR sites]

### Appendix D: Vendor SLAs

| Vendor | Service | SLA | Support Contact |
|--------|---------|-----|-----------------|
| AWS | Cloud Infrastructure | 99.99% | [Portal] |
| Cloudflare | CDN/WAF | 100% | [Email] |
| Let's Encrypt | SSL Certificates | Best Effort | [Community] |

---

**Document Classification:** CONFIDENTIAL
**Distribution:** Incident Response Team Only
**Review Frequency:** Quarterly
**Next Review Date:** 2026-04-01

**Approved By:**
[CTO Signature] - Date: 2026-01-04

**Last Updated By:**
DevOps Team - Sprint 8.2 - Security & Testing
