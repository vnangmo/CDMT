# CDMT Application - Automated Backup Strategy

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Sprint:** 8.2 - Security & Testing

---

## Executive Summary

This document outlines the comprehensive backup strategy for the CDMT application, covering database backups, file storage backups, and configuration backups. The strategy ensures **data integrity, business continuity**, and **disaster recovery readiness**.

**Backup Objectives:**
- **RPO (Recovery Point Objective):** ≤ 1 hour (maximum data loss acceptable)
- **RTO (Recovery Time Objective):** ≤ 4 hours (maximum downtime acceptable)
- **Retention:** 30 days daily, 12 months monthly
- **Encryption:** AES-256 for backups at rest

---

## 1. Database Backups (PostgreSQL)

### 1.1 Automated Daily Backups

**Script:** `backend/scripts/backup-database.sh`

```bash
#!/bin/bash
#########################################
# CDMT Database Backup Script
# Performs automated PostgreSQL backups
# with compression and encryption
#########################################

# Configuration
DB_NAME="cdmt_db"
DB_USER="postgres"
BACKUP_DIR="/var/backups/cdmt/database"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cdmt_db_${DATE}.sql.gz"
LOG_FILE="/var/log/cdmt/backup.log"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Log start
echo "[$(date)] Starting database backup..." >> $LOG_FILE

# Perform backup with pg_dump (compressed)
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup successful: ${BACKUP_FILE}" >> $LOG_FILE

    # Calculate backup size
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup size: ${SIZE}" >> $LOG_FILE

    # Optional: Encrypt backup
    # openssl enc -aes-256-cbc -salt -in "${BACKUP_DIR}/${BACKUP_FILE}" \
    #   -out "${BACKUP_DIR}/${BACKUP_FILE}.enc" -k "${BACKUP_ENCRYPTION_KEY}"

    # Upload to cloud storage (AWS S3 example)
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
      "s3://cdmt-backups/database/${BACKUP_FILE}" \
      --storage-class STANDARD_IA

    echo "[$(date)] Backup uploaded to S3" >> $LOG_FILE
else
    echo "[$(date)] ERROR: Backup failed!" >> $LOG_FILE
    # Send alert email
    echo "Database backup failed on $(hostname)" | mail -s "CDMT Backup Alert" admin@finances.dj
    exit 1
fi

# Delete backups older than retention period
find $BACKUP_DIR -name "cdmt_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Old backups cleaned (retention: ${RETENTION_DAYS} days)" >> $LOG_FILE

# Log completion
echo "[$(date)] Backup process completed" >> $LOG_FILE
```

**Make executable:**
```bash
chmod +x /opt/cdmt/scripts/backup-database.sh
```

### 1.2 Cron Schedule

**Daily backups at 2:00 AM:**
```bash
# Edit crontab
sudo crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * /opt/cdmt/scripts/backup-database.sh >> /var/log/cdmt/backup-cron.log 2>&1

# Weekly full backup (Sunday 3 AM)
0 3 * * 0 /opt/cdmt/scripts/backup-database-full.sh >> /var/log/cdmt/backup-weekly.log 2>&1

# Monthly archive (1st of month, 4 AM)
0 4 1 * * /opt/cdmt/scripts/backup-database-monthly.sh >> /var/log/cdmt/backup-monthly.log 2>&1
```

### 1.3 Point-in-Time Recovery (PITR)

Enable PostgreSQL WAL archiving for continuous backup:

**postgresql.conf:**
```ini
# Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 3600  # Archive every hour
```

**Recovery:**
```bash
# Restore to specific time
pg_restore -U postgres -d cdmt_db \
  --recovery-target-time='2026-01-04 14:30:00' \
  backup_file.sql
```

---

## 2. File Storage Backups

### 2.1 Uploaded Files Backup

**Script:** `backend/scripts/backup-files.sh`

```bash
#!/bin/bash
# Backup uploaded files (Excel imports, exports, etc.)

UPLOAD_DIR="/opt/cdmt/uploads"
BACKUP_DIR="/var/backups/cdmt/files"
DATE=$(date +%Y%m%d)

# Create compressed archive
tar -czf "${BACKUP_DIR}/uploads_${DATE}.tar.gz" "$UPLOAD_DIR"

# Upload to S3
aws s3 sync $UPLOAD_DIR s3://cdmt-backups/files/ \
  --storage-class GLACIER_IR \
  --exclude "*.tmp"

# Delete local archives older than 7 days
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

**Cron:**
```bash
# Daily at 1 AM
0 1 * * * /opt/cdmt/scripts/backup-files.sh
```

### 2.2 Generated Documents Backup

Backup generated TOFE, CBMT, CDMT reports:

```bash
# Sync to S3 incrementally
aws s3 sync /opt/cdmt/generated-reports s3://cdmt-backups/reports/ \
  --delete
```

---

## 3. Configuration Backups

### 3.1 Application Configuration

**Backup .env and config files:**
```bash
#!/bin/bash
# Backup configuration files

CONFIG_DIR="/opt/cdmt/backend"
BACKUP_DIR="/var/backups/cdmt/config"
DATE=$(date +%Y%m%d)

# Backup .env (encrypted)
openssl enc -aes-256-cbc -salt \
  -in "${CONFIG_DIR}/.env" \
  -out "${BACKUP_DIR}/env_${DATE}.enc" \
  -k "${CONFIG_ENCRYPTION_KEY}"

# Backup nginx config
cp /etc/nginx/sites-available/cdmt "${BACKUP_DIR}/nginx_${DATE}.conf"

# Backup package.json and package-lock.json
cp "${CONFIG_DIR}/package.json" "${BACKUP_DIR}/package_${DATE}.json"
cp "${CONFIG_DIR}/package-lock.json" "${BACKUP_DIR}/package-lock_${DATE}.json"

# Upload to S3
aws s3 sync $BACKUP_DIR s3://cdmt-backups/config/
```

### 3.2 Database Schema Backup

```bash
# Backup schema only (no data)
pg_dump -U postgres -h localhost --schema-only cdmt_db \
  > /var/backups/cdmt/schema/schema_$(date +%Y%m%d).sql
```

---

## 4. Cloud Storage Strategy

### 4.1 AWS S3 Bucket Structure

```
s3://cdmt-backups/
├── database/
│   ├── daily/
│   │   └── cdmt_db_20260104_020000.sql.gz
│   ├── weekly/
│   │   └── cdmt_db_week_01_2026.sql.gz
│   └── monthly/
│       └── cdmt_db_202601.sql.gz
├── files/
│   └── uploads/
│       └── 2026/01/04/
├── reports/
│   ├── tofe/
│   ├── cbmt/
│   └── cdmt/
└── config/
    ├── env_20260104.enc
    └── nginx_20260104.conf
```

### 4.2 Storage Classes

| Backup Type | S3 Storage Class | Transition |
|------------|------------------|------------|
| Daily DB (0-7 days) | STANDARD | - |
| Weekly DB (8-30 days) | STANDARD_IA | After 7 days |
| Monthly DB (31-365 days) | GLACIER_IR | After 30 days |
| Old backups (>365 days) | DEEP_ARCHIVE | After 365 days |

### 4.3 Lifecycle Policy

**S3 lifecycle configuration:**
```json
{
  "Rules": [
    {
      "Id": "TransitionDailyBackups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 7,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 30,
          "StorageClass": "GLACIER_IR"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

---

## 5. Backup Verification & Testing

### 5.1 Automated Integrity Checks

**Script:** `backend/scripts/verify-backup.sh`

```bash
#!/bin/bash
# Verify backup integrity

BACKUP_FILE=$1

# Check if file exists and is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file is empty or missing"
    exit 1
fi

# Verify gzip integrity
gunzip -t "$BACKUP_FILE" 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Backup file is corrupted"
    exit 1
fi

# Test restore to temporary database
createdb -U postgres test_restore_db
gunzip -c "$BACKUP_FILE" | psql -U postgres test_restore_db > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "SUCCESS: Backup verified successfully"
    dropdb -U postgres test_restore_db
    exit 0
else
    echo "ERROR: Backup restore test failed"
    dropdb -U postgres test_restore_db
    exit 1
fi
```

### 5.2 Monthly Restore Testing

**Schedule:** First Sunday of every month

```bash
# Cron job for monthly restore test
0 5 1 * * /opt/cdmt/scripts/test-restore.sh >> /var/log/cdmt/restore-test.log 2>&1
```

**Test procedure:**
1. Download latest backup from S3
2. Restore to test database
3. Run smoke tests (query critical tables)
4. Verify record counts match
5. Generate report
6. Clean up test database

---

## 6. Monitoring & Alerts

### 6.1 Backup Monitoring Script

```bash
#!/bin/bash
# Check if daily backup completed successfully

BACKUP_AGE=$(find /var/backups/cdmt/database -name "cdmt_db_*.sql.gz" -mtime -1 | wc -l)

if [ $BACKUP_AGE -eq 0 ]; then
    echo "ALERT: No backup found in last 24 hours" | \
      mail -s "CDMT Backup Alert" admin@finances.dj
    exit 1
fi
```

### 6.2 CloudWatch Alarms (AWS)

```bash
# Create CloudWatch alarm for backup failures
aws cloudwatch put-metric-alarm \
  --alarm-name cdmt-backup-failure \
  --alarm-description "Alert when backup fails" \
  --metric-name BackupJobStatus \
  --namespace AWS/Backup \
  --statistic Sum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:region:account-id:cdmt-alerts
```

---

## 7. Backup Security

### 7.1 Encryption

**At-rest encryption:**
```bash
# Encrypt backup before upload
openssl enc -aes-256-cbc -salt \
  -in backup.sql.gz \
  -out backup.sql.gz.enc \
  -k "${BACKUP_ENCRYPTION_KEY}"
```

**In-transit encryption:**
- All S3 uploads use TLS/HTTPS
- AWS S3 SSE-S3 or SSE-KMS encryption enabled

### 7.2 Access Control

**S3 Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::cdmt-backups/*",
      "Condition": {
        "Bool": {"aws:SecureTransport": "false"}
      }
    }
  ]
}
```

**IAM Role:** Only backup service account has write access

---

## 8. Backup Checklist

### Daily
- [ ] Automated database backup executed
- [ ] File storage backup completed
- [ ] Backups uploaded to S3 successfully
- [ ] Backup verification checks passed
- [ ] Old backups rotated per retention policy

### Weekly
- [ ] Review backup logs for errors
- [ ] Verify S3 storage utilization
- [ ] Check backup sizes (detect anomalies)

### Monthly
- [ ] Test restore procedure
- [ ] Verify backup integrity with sample restore
- [ ] Review and update backup retention policy
- [ ] Audit backup access logs
- [ ] Update backup documentation

---

## 9. Backup Restoration Procedures

See **DISASTER_RECOVERY_PLAN.md** for detailed restoration procedures.

---

**Document Owner:** DevOps Team
**Approved By:** CTO
**Next Review:** 2026-04-01
