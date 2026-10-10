# BinBuddy Human Action Items

This file tracks tasks that require human authorization, credentials, physical devices, or platform submission. BinBuddy works in demo mode with zero human blockers.

---

## 1. Secrets & Environment Configuration

1. **Gemini API Key**: Obtain from Google AI Studio. Add `GEMINI_API_KEY=<key>` to `.env`.
2. **ElevenLabs API Key**: Obtain from ElevenLabs. Add `ELEVENLABS_API_KEY=<key>` and `ELEVENLABS_VOICE_ID=<voice_id>` to `.env`.
3. Verify secrets are never checked into git by running:
   ```bash
   npm run check:secrets
   ```

## 2. Test Media for Live Testing

1. Provide at least 6 real photos taken of items (e.g. plastic bottle, soda can, glass jar, cardboard box, greasy pizza box, plastic grocery bag) and place them into `tests/fixtures/photos/` with an `expected.json` file.
2. Run live validation:
   ```bash
   npm run smoke:live
   ```

## 3. Audio Pre-warming

Once `ELEVENLABS_API_KEY` is present in `.env`:

```bash
npm run warm:audio
```

This generates and caches high-fidelity MP3 narrations for all Houston ruleset items into `.cache/audio/`.

## 4. Vultr Server Deployment

1. Log in to Vultr and deploy a Cloud Compute instance (Ubuntu 24.04 x64, 1 vCPU, 1 GB or 2 GB RAM).
2. Set up SSH key access and firewall rules permitting ports 22 (SSH), 80 (HTTP), and 443 (HTTPS).
3. Connect to the instance:
   ```bash
   ssh root@<VULTR_IP>
   ```
4. Install Docker and Docker Compose plugin:
   ```bash
   apt-get update && apt-get install -y docker.io docker-compose-v2 git
   ```
5. Clone the repository and configure `.env`:
   ```bash
   git clone <REPO_URL> /opt/binbuddy
   cd /opt/binbuddy
   cp .env.example .env
   # Edit .env with production keys and your custom domain
   nano .env
   ```
6. Start containers:
   ```bash
   docker compose up -d --build
   ```
7. Check logs:
   ```bash
   docker compose logs -f
   ```

## 5. Domain & DNS Configuration (GoDaddy Registry)

1. Follow the MLH / CodeRED sponsor guide to claim an eligible free domain through GoDaddy Registry.
2. In the domain DNS settings, add an `A` record pointing `@` to `<VULTR_IP>`.
3. In `/opt/binbuddy/.env` on the Vultr VM, set `APP_URL=https://<YOUR_DOMAIN>` and configure Caddy to issue automatic Let's Encrypt certificates.
4. Verify deployment from your local machine:
   ```bash
   npm run smoke:remote -- https://<YOUR_DOMAIN>
   ```

## 6. Demo Video & Presentation

1. Follow the 3-minute demo script in `SUBMISSION/demo-script.md`.
2. Record screen + audio on laptop / mobile device.
3. Upload to YouTube / Vimeo as unlisted or public.

## 7. Devpost Submission

1. Ensure the GitHub repository visibility is set to **Public**.
2. Create project entry on Devpost for CodeRED: Orion.
3. Paste the contents of `SUBMISSION/devpost.md`.
4. Enter the deployed Vultr URL, GitHub repository link, and demo video link.
5. Select the sponsor prize categories:
   - MLH Gemini API
   - MLH ElevenLabs
   - MLH Vultr
   - MLH GoDaddy Registry
   - Best Environment Hack
   - DEV Writing Challenge
6. Submit prior to 11 Oct 2026, 23:30 IST.
