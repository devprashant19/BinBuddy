# Vultr Cloud Compute Deployment Guide

This guide details the exact step-by-step procedure to provision and run BinBuddy in production on Vultr Cloud Compute with automated TLS via Caddy.

---

## 1. Provisioning the Cloud Compute Instance

1. Log into your **[Vultr Customer Portal](https://my.vultr.com/)**.
2. Click **Deploy +** > **Deploy New Server**.
3. **Choose Server**: Select **Cloud Compute - Shared CPU**.
4. **Server Location**: Choose a region closest to your users (e.g., `Dallas (DFW)` or `Atlanta (ATL)` for Houston, TX).
5. **Server Image**: Select **Ubuntu 24.04 LTS x64**.
6. **Server Size**: Select the **1 vCPU / 2 GB RAM / 55 GB NVMe** plan ($10/month) or the 1 vCPU / 1 GB RAM plan ($5/month). 2 GB RAM is recommended for optimal Docker compilation and Next.js standalone runner performance.
7. **SSH Keys**: Select your public SSH key for passwordless root login.
8. **Server Hostname & Label**: Set to `binbuddy-production`.
9. Click **Deploy Now**.
10. Note your assigned public IPv4 address (e.g. `198.51.100.25`).

---

## 2. Firewall Configuration (Security Invariant)

1. Navigate to **Network** > **Firewalls** in the Vultr portal.
2. Create a Firewall Group named `binbuddy-firewall`.
3. Add only the following inbound rules:
   - **SSH**: Port `22` / TCP (Source: `My IP` or `0.0.0.0/0` if dynamic)
   - **HTTP**: Port `80` / TCP (Source: `0.0.0.0/0`)
   - **HTTPS**: Port `443` / TCP (Source: `0.0.0.0/0`)
4. Drop all other incoming ports.
5. Link this firewall group to your `binbuddy-production` instance.

---

## 3. Server Setup & Docker Installation

SSH into your server:

```bash
ssh root@<YOUR_VULTR_IP>
```

Update system packages and install Docker with Docker Compose plugin:

```bash
# Update repositories
apt-get update && apt-get upgrade -y

# Install prerequisites
apt-get install -y ca-certificates curl gnupg git

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## 4. Deploying BinBuddy

1. Clone the repository:

```bash
cd /opt
git clone https://github.com/<YOUR_USER>/binbuddy.git
cd binbuddy
```

2. Configure production environment variables:

```bash
cp .env.example .env
nano .env
```

Fill in your production values:

```env
DOMAIN=binbuddy.yourdomain.com
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
PROVIDER_MODE=auto
NODE_ENV=production
APP_URL=https://binbuddy.yourdomain.com
```

3. Build and launch containers in detached mode:

```bash
docker compose up -d --build
```

4. Verify running services:

```bash
docker compose ps
```

Both `app` and `caddy` should display `Up` / `healthy`.

5. Check application and TLS logs:

```bash
docker compose logs -f
```

---

## 5. Updates & Zero-Downtime Rollout

To deploy code updates:

```bash
cd /opt/binbuddy
git pull origin main
docker compose up -d --build
```

---

## 6. Rollback Procedure

If a deployed build has issues:

```bash
cd /opt/binbuddy
git log --oneline -n 5
# Checkout previous stable commit
git checkout <PREVIOUS_COMMIT_HASH>
docker compose up -d --build
```
