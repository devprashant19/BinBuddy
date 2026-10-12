# Domain & DNS Setup Guide

This guide details how to configure a custom domain and verify automatic TLS termination for BinBuddy.

---

## 1. Domain Registration via GoDaddy Registry (CodeRED Partner)

1. Follow the hackathon partner link or event instructions for the eligible free domain promo code (e.g. `.live`, `.tech`, or `.dev`).
2. Register your chosen domain name (e.g. `binbuddy-sort.live`).
3. Open your registrar's DNS Management dashboard.

---

## 2. DNS Record Configuration

Add the DNS record that your chosen host asks for:

### Option A: Render (Managed Container Host)
1. In your Render Web Service dashboard, go to **Settings** > **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain or subdomain (e.g. `binbuddy-sort.live` or `app.binbuddy-sort.live`).
3. Add the exact DNS record Render instructs you to create:
   - For a subdomain (e.g. `app.binbuddy-sort.live`): add a **CNAME** record pointing to your Render address (e.g. `binbuddy.onrender.com`).
   - For an apex / root domain (`binbuddy-sort.live`): add the **ANAME** / **ALIAS** or **A** records provided by Render.
4. Wait for Render to verify the record and automatically provision its Let's Encrypt HTTPS certificate.

### Option B: Google Cloud Run
1. In the Google Cloud Console, navigate to **Cloud Run** > **Custom Domains** > **Add Mapping**.
2. Select the `binbuddy` service and specify your domain.
3. Add the DNS records (`CNAME` or `A`/`AAAA`) provided by Google Cloud Run into your DNS manager.
4. Wait for Google Cloud to verify domain ownership and provision its managed SSL certificate.

### Option C: Plain VPS (Docker Compose + Caddy)
1. Add an **A** record pointing to your server's public IPv4 address:

| Type  | Name / Host         | Value / Target    | TTL           | Purpose                |
| :---- | :------------------ | :---------------- | :------------ | :--------------------- |
| **A** | `@` (or subdomain)  | `<YOUR_SERVER_IP>`| 300 (or Auto) | Root/subdomain routing |
| **A** | `www`               | `<YOUR_SERVER_IP>`| 300           | Optional www alias     |

2. Set `DOMAIN=binbuddy.yourdomain.com` in `.env` and start Caddy with `docker compose up -d`. Caddy will automatically issue the Let's Encrypt certificate.

---

## 3. Verify DNS Propagation & HTTPS Certificate

Once the record is added to your registrar:

1. Check propagation via terminal:
```bash
nslookup yourdomain.com
dig +short yourdomain.com
```

2. Wait for your chosen host to issue its HTTPS certificate (usually 1–5 minutes after DNS propagates).
3. Verify TLS termination and security headers:
```bash
curl -I https://yourdomain.com
```

Confirm `HTTP/2 200` or `HTTP/1.1 200`, valid SSL handshake, and security headers.
