# OfficeGate Deployment Guide

## Production Requirements

| Component | Minimum Version |
|-----------|----------------|
| PHP | 8.2+ |
| PHP extensions | pdo, pdo_mysql, fileinfo, json, mbstring |
| MySQL | 8.0+ |
| Node.js | 18+ |
| Web server | nginx 1.20+ or Apache 2.4+ |
| OS | Ubuntu 22.04 LTS (recommended) |

---

## Backend Deployment (Linux/Ubuntu)

### 1. Install PHP and extensions

```bash
sudo apt update
sudo apt install -y php8.2-cli php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-fileinfo
php -v  # confirm 8.2+
```

### 2. Clone the repository

```bash
cd /var/www
sudo git clone https://github.com/your-org/apartment-faizal.git officegate
sudo chown -R www-data:www-data officegate
```

### 3. Set up the database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE officegate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'officegate'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON officegate.* TO 'officegate'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import the production schema dump (if available):

```bash
mysql -u officegate -p officegate < /var/www/officegate/database/officegate_production.sql
```

Or run migrations fresh:

```bash
cd /var/www/officegate/backend
php scripts/migrate.php
```

### 4. Configure environment

```bash
cd /var/www/officegate/backend
cp .env.example .env
nano .env
```

Required changes for production:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

CORS_ALLOWED_ORIGINS=https://yourdomain.com

# CRITICAL: Generate unique secrets (never use the example values)
JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>

DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=officegate
DB_USERNAME=officegate
DB_PASSWORD=<your db password>

# Change all seed user passwords
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=<strong password>
SEED_SECURITY_EMAIL=security@yourdomain.com
SEED_SECURITY_PASSWORD=<strong password>
SEED_TENANT_EMAIL=tenant@yourdomain.com
SEED_TENANT_PASSWORD=<strong password>

# OTP: for production use a webhook to an SMS gateway
OTP_DRIVER=webhook
OTP_WEBHOOK_URL=https://your-sms-provider.com/send
OTP_WEBHOOK_TOKEN=<your sms gateway token>

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=<live secret>
RAZORPAY_WEBHOOK_SECRET=<webhook secret>
RAZORPAY_MODE=live
```

### 5. Seed initial users

```bash
php /var/www/officegate/backend/scripts/seed.php
```

In production, the seed script refuses the default `ChangeMe@12345` password. You must set unique passwords in `.env` before running it.

### 6. Set file permissions

```bash
# Storage must be writable by the web process
sudo chown -R www-data:www-data /var/www/officegate/backend/storage
sudo chmod -R 775 /var/www/officegate/backend/storage

# Public directory must be readable
sudo chmod -R 755 /var/www/officegate/backend/public
```

Move `storage/` outside the web root if the hosting plan allows:

```bash
# Update .env DB_DATABASE and log paths accordingly
```

### 7. Configure nginx

```nginx
# /etc/nginx/sites-available/officegate-api
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    root /var/www/officegate/backend/public;
    index index.php;

    # Block direct access to storage and source
    location ~ ^/(storage|config|core|controllers|models|helpers|middleware|services|routes|database|scripts)/ {
        deny all;
        return 404;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/officegate-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8. (Optional) Apache with the included .htaccess

The repository root contains an `.htaccess` that exposes the API under `/api/*`, blocks source and storage folders, and serves the built React app from `frontend/dist`. Copy the web root to `public_html` and set `AllowOverride All` in the Apache vhost.

---

## Frontend Deployment

### 1. Build

```bash
cd /var/www/officegate/frontend
npm ci
```

Create a production environment file:

```bash
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.yourdomain.com
EOF
```

```bash
npm run build
# Output goes to frontend/dist/
```

### 2. Serve with nginx

```nginx
# /etc/nginx/sites-available/officegate-frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/officegate/frontend/dist;
    index index.html;

    # Cache hashed assets forever
    location ~* \.(js|css|woff2|png|jpg|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Razorpay Webhook Setup

1. Log in to https://dashboard.razorpay.com
2. Go to Settings → Webhooks → Add New Webhook
3. Set URL to: `https://api.yourdomain.com/payments/webhook`
4. Enable events: `payment.captured`, `payment.failed`, `refund.created`
5. Copy the webhook secret and set `RAZORPAY_WEBHOOK_SECRET` in `.env`

---

## SSL/TLS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
# Auto-renewal via cron:
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

---

## Database Backup

```bash
# Run manually or as a daily cron
cd /var/www/officegate/backend
php scripts/backup_mysql.php

# Backups are saved to storage/backups/officegate-YYYYMMDD-HHMMSS.sql
# Move backups off-server immediately (S3, remote SCP, etc.)
```

Restore:

```bash
php scripts/restore_mysql.php storage/backups/officegate-YYYYMMDD-HHMMSS.sql --confirm-production-restore
```

---

## Environment Variables Checklist

Before going live, verify every item:

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` — full HTTPS URL with no trailing slash
- [ ] `CORS_ALLOWED_ORIGINS` — only your production frontend domain(s)
- [ ] `JWT_ACCESS_SECRET` — unique 64+ char random string (not the example value)
- [ ] `JWT_REFRESH_SECRET` — unique 64+ char random string (not the example value)
- [ ] `DB_DRIVER=mysql`
- [ ] `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` — correct MySQL credentials
- [ ] All `SEED_*_PASSWORD` values are strong (script enforces this)
- [ ] `OTP_DRIVER=webhook` and webhook URL/token are set (or `log` only for internal use)
- [ ] `RAZORPAY_KEY_ID` starts with `rzp_live_` (not `rzp_test_`)
- [ ] `RAZORPAY_MODE=live`
- [ ] Storage directory is writable by the web server user
- [ ] Storage directory is outside the public web root (or nginx blocks it)

---

## Post-Deploy Verification

Run through this checklist after every deployment:

```bash
# 1. Health check
curl https://api.yourdomain.com/health
# Expected: {"success":true,"data":{"status":"ok"}}

# 2. CORS preflight
curl -i -X OPTIONS https://api.yourdomain.com/admin/offices \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
# Expected: 204, Access-Control-Allow-Origin header present

# 3. Auth
curl -s -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"<admin_password>"}'
# Expected: accessToken in response

# 4. Protected route (use token from step 3)
curl -s https://api.yourdomain.com/admin/dashboard/summary \
  -H "Authorization: Bearer <TOKEN>"
# Expected: 200 with counts

# 5. Razorpay webhook signature (send a test event from Razorpay dashboard)
# Expected: 200 in webhook logs

# 6. Frontend loads
curl -I https://yourdomain.com/
# Expected: 200, text/html

# 7. Frontend API connection
# Open browser → log in → confirm dashboard loads
```

---

## Updating (Zero-Downtime)

```bash
cd /var/www/officegate
git pull origin main

# Backend: run new migrations
cd backend && php scripts/migrate.php

# Frontend: rebuild and replace dist
cd ../frontend && npm ci && npm run build

# Reload PHP-FPM (no nginx restart needed for code changes)
sudo systemctl reload php8.2-fpm
```
