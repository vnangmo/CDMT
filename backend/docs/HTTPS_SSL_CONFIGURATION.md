# CDMT Application - HTTPS/SSL Configuration Guide

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Sprint:** 8.2 - Security & Testing

---

## Overview

This guide provides step-by-step instructions for configuring HTTPS/SSL for the CDMT application in production environments. HTTPS is **mandatory** for production deployment to protect data in transit.

**Security Requirements:**
- ✅ TLS 1.2+ only (TLS 1.0 and 1.1 deprecated)
- ✅ Strong cipher suites
- ✅ HTTP to HTTPS automatic redirection
- ✅ HSTS enabled (already configured in code)
- ✅ Certificate auto-renewal

---

## Option 1: Let's Encrypt with Certbot (Recommended for Cloud/VPS)

### Prerequisites
- Domain name pointing to your server
- Ubuntu/Debian server with sudo access
- Ports 80 and 443 open

### Step 1: Install Certbot

```bash
# Update package list
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d cdmt.finances.dj -d www.cdmt.finances.dj

# Follow prompts:
# - Enter email for renewal notifications
# - Agree to Terms of Service
# - Choose: Redirect HTTP to HTTPS (option 2)
```

### Step 3: Configure Nginx Reverse Proxy

Create/edit `/etc/nginx/sites-available/cdmt`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cdmt.finances.dj www.cdmt.finances.dj;

    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cdmt.finances.dj www.cdmt.finances.dj;

    # SSL Certificate (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/cdmt.finances.dj/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdmt.finances.dj/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers (additional to app's Helmet)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check (no auth required)
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### Step 4: Enable Configuration

```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/cdmt /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: Auto-Renewal Setup

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot auto-renewal is enabled by default via systemd timer
# Check status:
sudo systemctl status certbot.timer

# Manual renewal (if needed):
sudo certbot renew
```

---

## Option 2: Cloudflare SSL (Easiest)

### Advantages
- Free SSL certificates
- DDoS protection
- CDN (faster global access)
- Web Application Firewall (WAF)
- Automatic certificate renewal

### Setup Steps

1. **Create Cloudflare Account**
   - Visit https://cloudflare.com
   - Sign up for free account

2. **Add Your Domain**
   - Add `finances.dj` domain
   - Follow DNS setup instructions

3. **Configure SSL Mode**
   - Go to SSL/TLS tab
   - Select **"Full (strict)"** encryption mode
   - Enables end-to-end encryption

4. **Update Nameservers**
   - Point domain nameservers to Cloudflare (provided in dashboard)
   - Wait for DNS propagation (5-30 minutes)

5. **Enable Security Features**
   - Enable "Always Use HTTPS"
   - Enable "Automatic HTTPS Rewrites"
   - Enable "Opportunistic Encryption"
   - Set minimum TLS version to 1.2

6. **Configure Page Rules** (Optional)
   ```
   URL: http://*cdmt.finances.dj/*
   Settings: Always Use HTTPS
   ```

---

## Option 3: AWS Certificate Manager (for AWS Deployment)

### Prerequisites
- Application hosted on AWS (EC2, Load Balancer, CloudFront)
- Domain managed in Route 53 or external DNS

### Step 1: Request Certificate

```bash
# Via AWS CLI
aws acm request-certificate \
  --domain-name cdmt.finances.dj \
  --subject-alternative-names www.cdmt.finances.dj \
  --validation-method DNS
```

Or via AWS Console:
1. Navigate to AWS Certificate Manager
2. Click "Request a certificate"
3. Enter domain names
4. Choose DNS validation
5. Add CNAME records to DNS (automated if using Route 53)

### Step 2: Attach to Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name cdmt-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Add HTTPS listener with certificate
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>

# Redirect HTTP to HTTPS
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

---

## Backend Configuration Updates

### Update Environment Variables

```env
# .env (production)
NODE_ENV=production

# HTTPS-specific settings
COOKIE_SECURE=true  # Cookies only over HTTPS
SESSION_COOKIE_SECURE=true

# CORS - Update to HTTPS origin
CORS_ORIGIN=https://cdmt.finances.dj

# Optional: Trust proxy (if behind load balancer/reverse proxy)
TRUST_PROXY=true
```

### Update Backend Code (if needed)

The backend is already configured for HTTPS via Helmet's HSTS settings:

```typescript
// backend/src/server.ts (already implemented)
hsts: {
  maxAge: 31536000,  // 1 year
  includeSubDomains: true,
  preload: true,
}
```

---

## SSL Certificate Validation

### Online Tools

1. **SSL Labs Server Test**
   - URL: https://www.ssllabs.com/ssltest/
   - Enter: `https://cdmt.finances.dj`
   - Target Grade: **A or A+**

2. **Security Headers Check**
   - URL: https://securityheaders.com/
   - Enter: `https://cdmt.finances.dj`
   - Target Grade: **A**

### Command Line Test

```bash
# Check certificate details
openssl s_client -connect cdmt.finances.dj:443 -servername cdmt.finances.dj

# Check TLS versions supported
nmap --script ssl-enum-ciphers -p 443 cdmt.finances.dj

# Test HSTS header
curl -I https://cdmt.finances.dj | grep Strict-Transport-Security
```

---

## Troubleshooting

### Issue: Mixed Content Warnings

**Cause:** Frontend loading HTTP resources on HTTPS page

**Solution:**
```javascript
// Ensure all resources use HTTPS or protocol-relative URLs
<script src="https://cdn.example.com/script.js"></script>
// OR
<script src="//cdn.example.com/script.js"></script>
```

### Issue: Certificate Not Trusted

**Cause:** Incomplete certificate chain

**Solution:**
```bash
# Verify certificate chain
openssl s_client -connect cdmt.finances.dj:443 -showcerts

# Ensure fullchain.pem is used (includes intermediate certificates)
ssl_certificate /etc/letsencrypt/live/cdmt.finances.dj/fullchain.pem;
```

### Issue: CORS Errors After HTTPS

**Cause:** Backend CORS_ORIGIN still set to HTTP

**Solution:**
```env
# Update .env
CORS_ORIGIN=https://cdmt.finances.dj
```

### Issue: Cookies Not Working

**Cause:** Secure flag requires HTTPS

**Solution:** Ensure cookies are set with:
```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // true in production
  sameSite: 'strict'
}
```

---

## Security Best Practices

### 1. Force HTTPS Everywhere
- ✅ Redirect all HTTP traffic to HTTPS
- ✅ Use HSTS header (already configured)
- ✅ Submit domain to HSTS Preload list: https://hstspreload.org/

### 2. Certificate Monitoring
- Set up expiration alerts (Let's Encrypt: 30 days before expiry)
- Monitor certificate transparency logs
- Automated renewal testing

### 3. Cipher Suite Configuration

**Strong Ciphers Only** (already handled by modern Nginx/certbot):
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
ssl_prefer_server_ciphers off;
```

### 4. Regular Security Scans
- Weekly SSL Labs scans
- Monitor for new vulnerabilities (Heartbleed, POODLE, etc.)
- Update TLS/SSL libraries regularly

---

## Production Deployment Checklist

Before deploying to production with HTTPS:

- [ ] SSL certificate obtained and installed
- [ ] HTTP to HTTPS automatic redirection enabled
- [ ] HSTS header verified (Strict-Transport-Security)
- [ ] Mixed content warnings resolved
- [ ] CORS origin updated to HTTPS URL
- [ ] Cookie secure flag enabled
- [ ] SSL Labs test score: A or A+
- [ ] Certificate auto-renewal configured and tested
- [ ] Monitoring/alerting for certificate expiration
- [ ] Backup of certificate and private key stored securely
- [ ] All environment variables updated for production
- [ ] Health check endpoint accessible

---

## Certificate Renewal Reminders

### Let's Encrypt
- **Validity:** 90 days
- **Auto-renewal:** 30 days before expiry
- **Manual command:** `sudo certbot renew`

### Monitoring
```bash
# Add to crontab for weekly certificate check
0 3 * * 1 /usr/bin/certbot renew --quiet && /usr/sbin/nginx -s reload
```

---

## Support & Resources

- **Let's Encrypt Documentation:** https://letsencrypt.org/docs/
- **Certbot User Guide:** https://eff-certbot.readthedocs.io/
- **Mozilla SSL Configuration Generator:** https://ssl-config.mozilla.org/
- **SSL Labs Best Practices:** https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices

---

**Prepared By:** Infrastructure Team
**Approved By:** Security Team
**Next Review:** 2026-07-01
