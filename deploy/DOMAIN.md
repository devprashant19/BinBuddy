# Domain & DNS Setup Guide

This guide details how to configure a custom domain and verify automatic TLS termination for BinBuddy.

---

## 1. Domain Registration via GoDaddy Registry (CodeRED / Hackathon Partner)

1. Follow the hackathon's partner link or event page for the eligible free domain promo code (typically `.live`, `.tech`, or `.dev`).
2. Register your chosen domain name (e.g. `binbuddy-sort.live`).
3. Access your domain's DNS Management dashboard.

---

## 2. DNS Record Configuration

Create the following DNS records pointing to your Vultr server's public IPv4 address:

| Type  | Name / Host         | Value / Target                            | TTL           | Purpose                |
| :---- | :------------------ | :---------------------------------------- | :------------ | :--------------------- |
| **A** | `@` (or `binbuddy`) | `<YOUR_VULTR_IP>` (e.g., `198.51.100.25`) | 300 (or Auto) | Root/subdomain routing |
| **A** | `www`               | `<YOUR_VULTR_IP>`                         | 300           | Optional www alias     |

---

## 3. Verify DNS Propagation

From your local machine or server terminal:

```bash
# Check using dig or nslookup
nslookup binbuddy.yourdomain.com
dig +short binbuddy.yourdomain.com
```

Confirm the resolved IP matches your Vultr IPv4 address.

---

## 4. Automated HTTPS with Caddy

1. Ensure `.env` on your Vultr instance has:

```env
DOMAIN=binbuddy.yourdomain.com
```

2. Start or reload Caddy:

```bash
docker compose up -d
```

3. Caddy automatically requests and installs a Let's Encrypt / ZeroSSL TLS certificate via HTTP-01 challenge on port 80.
4. Verify by navigating to `https://binbuddy.yourdomain.com` in your browser.
5. Verify using curl:

```bash
curl -I https://binbuddy.yourdomain.com
```

Confirm `HTTP/2 200` and `strict-transport-security` / security headers.
