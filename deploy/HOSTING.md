# Container Hosting & Deployment Guide

This guide details how to deploy BinBuddy in production using modern container-hosting platforms or an optional plain VPS.

Because BinBuddy incorporates **audio seeding** (`data/audio-seed/` baked directly into the Docker image and copied to cache on startup), ephemeral container disks are completely supported: pre-generated voice narrations are available instantly without runtime dependencies or persistence requirements.

---

## Option 1: Render (Recommended Container Host)

Render provides zero-maintenance managed container hosting directly from your Git repository with automated SSL.

### 1. Create Web Service
1. Log into the **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`BinBuddy`).
4. Set the following configuration:
   - **Name**: `binbuddy`
   - **Region**: Choose a region close to your users (e.g., `Oregon (US West)` or `Ohio (US East)`).
   - **Branch**: `main`
   - **Runtime**: **Docker** (Render detects the root `Dockerfile`).
   - **Instance Type**:
     - *Starter* (512 MB RAM / 0.5 CPU) or *Standard* (2 GB RAM / 1 CPU) recommended for production.
     - *Free Tier Note (Sleep-on-Idle Caveat)*: Render's free instance spins down after 15 minutes of inactivity. When a request arrives, a cold start (~30–50 seconds) occurs before serving traffic. For instant hackathon judging responses, use a paid tier or keep the service awake with a periodic ping.
   - **Health Check Path**: `/api/health`

### 2. Configure Environment Variables
In the **Environment Variables** section of your Render service, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini multimodal model |
| `ELEVENLABS_API_KEY`| `sk_...` | ElevenLabs API key (optional for live voice) |
| `ELEVENLABS_VOICE_ID` | `EXAVITQu4vr4xnSDxMaL` | Premade voice ID (Sarah) |
| `ELEVENLABS_MODEL_ID` | `eleven_flash_v2_5` | ElevenLabs Flash v2.5 model |
| `PROVIDER_MODE` | `auto` | `auto` uses live keys; fallback to demo mode |
| `APP_URL` | `https://binbuddy.onrender.com` | Base URL of your deployed application |
| `NODE_ENV` | `production` | Production environment |

### 3. Custom Domain Setup
1. In your Render service, navigate to **Settings** > **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain (e.g. `binbuddy.yourdomain.com`).
3. Render displays the required DNS record (typically a `CNAME` pointing to your `.onrender.com` address or an `A` record).
4. Add the record in your DNS provider (e.g., GoDaddy, Cloudflare, Route 53).
5. Render automatically issues and renews a Let's Encrypt TLS certificate once DNS propagates.

---

## Option 2: Google Cloud Run (Serverless Container Alternative)

Google Cloud Run offers autoscaling serverless container hosting that scales to zero and provisions instantaneous HTTPS URLs.

### 1. Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated.
- A Google Cloud project with Cloud Run and Artifact Registry APIs enabled.

### 2. Deploy with `gcloud`
Run the following command directly from the root of the BinBuddy repository:

```bash
gcloud run deploy binbuddy \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "\
GEMINI_API_KEY=YOUR_GEMINI_API_KEY,\
GEMINI_MODEL=gemini-3.8-flash,\
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY,\
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL,\
ELEVENLABS_MODEL_ID=eleven_flash_v2_5,\
PROVIDER_MODE=auto,\
APP_URL=https://binbuddy-your-project-uc.a.run.app,\
NODE_ENV=production"
```

Cloud Run will build the container using Google Cloud Build, deploy it to a managed endpoint, and output the live service URL.

---

## Option 3: Plain VPS with Docker Compose & Caddy (Optional Path)

For running on a standalone Linux virtual machine (Ubuntu 24.04 LTS), the repository includes `docker-compose.yml` and `Caddyfile` for automated TLS termination.

### 1. Server Prerequisites
Install Docker and Docker Compose on your VPS:

```bash
apt-get update && apt-get install -y docker.io docker-compose-v2 git
```

Ensure firewall ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) are open.

### 2. Clone and Configure
```bash
cd /opt
git clone https://github.com/<YOUR_USER>/binbuddy.git
cd binbuddy
cp .env.example .env
nano .env
```

Ensure `DOMAIN` is set to your hostname in `.env`:
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

### 3. Launch Services
```bash
docker compose up -d --build
```

Caddy handles automatic certificate issuance and proxies requests to the Next.js standalone container. Verify health with:

```bash
docker compose ps
curl -I http://localhost:3000/api/health
```
