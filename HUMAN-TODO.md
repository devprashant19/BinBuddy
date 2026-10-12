# BinBuddy Human Action Items

This file tracks tasks that require human authorization, credentials, physical devices, or platform submission. BinBuddy works in demo mode with zero human blockers.

---

## 1. Secrets & Environment Configuration

1. **Gemini API Key**: Obtain from Google AI Studio. Add `GEMINI_API_KEY=<key>` to `.env`.
2. **ElevenLabs API Key**: Obtain from ElevenLabs. Add `ELEVENLABS_API_KEY=<key>` and `ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL` to `.env`.
3. Verify secrets are never checked into git by running:
   ```bash
   npm run check:secrets
   ```

---

## 2. Test Media for Live Testing

1. Provide at least 6 real photos taken of items (e.g. plastic bottle, soda can, glass jar, cardboard box, greasy pizza box, plastic grocery bag) and place them into `tests/fixtures/photos/` with an `expected.json` file.
2. Run live validation:
   ```bash
   npm run smoke:live
   ```

---

## 3. Audio Pre-warming & Seeding

Audio files are now **pre-seeded in `data/audio-seed/`** directly in the repository and included in the Docker container image. On server startup, BinBuddy automatically copies any missing seed files into `.cache/audio/` without overwriting existing files. Zero manual pre-warming is required for production deployments.

If you add new municipal rules or want to regenerate audio:
- Run `npm run warm:audio` in the cloned repo on the host to generate new audio into `.cache/audio/`.
- Copy any updated files into `data/audio-seed/` to persist them across container builds.
- If ElevenLabs is unconfigured or unavailable, browser speech synthesis immediately plays aloud without server audio files.

---

## 4. Production Container Deployment Steps

Follow these ordered steps to deploy BinBuddy to Render, Cloud Run, or your chosen container host (see [`deploy/HOSTING.md`](deploy/HOSTING.md)):

1. **Create the Service**:
   - In Render (or Cloud Run), create a new Web Service connected to your GitHub repository (`BinBuddy`).
   - Select runtime **Docker** (it automatically uses the root `Dockerfile`).
   - Set the health check path to `/api/health`.

2. **Set Environment Variables**:
   In your host service settings, configure:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `ELEVENLABS_API_KEY`: Your ElevenLabs API key
   - `ELEVENLABS_VOICE_ID`: `EXAVITQu4vr4xnSDxMaL`
   - `ELEVENLABS_MODEL_ID`: `eleven_flash_v2_5`
   - `PROVIDER_MODE`: `auto`
   - `APP_URL`: Your service URL (e.g., `https://binbuddy.onrender.com`)
   - `NODE_ENV`: `production`

3. **Deploy**:
   - Trigger the initial deployment.
   - Wait for the build and container startup to complete. Render/Cloud Run will verify the `/api/health` endpoint.

4. **Verify Live Remote Deployment**:
   Run the automated remote smoke suite from your local machine:
   ```bash
   npm run smoke:remote -- https://<YOUR_DEPLOYED_URL>
   ```

5. **Tap a Sample and Confirm Voice**:
   - Open the deployed URL in your browser.
   - Tap the **"Soda Can"** sample button to verify item classification and municipal rule routing.
   - Tap **"Hear it"** to verify that audio plays immediately (served directly from the pre-seeded cache with `X-Audio-Source: cache`).

6. **Add the Custom Domain**:
   - Claim an eligible domain via GoDaddy Registry (or your DNS provider).
   - In your container host dashboard, navigate to **Custom Domains** and add your domain (e.g. `binbuddy-sort.live`).
   - Add the DNS record (`CNAME` or `A` record) requested by your host in your domain registrar DNS settings (see [`deploy/DOMAIN.md`](deploy/DOMAIN.md)).
   - Wait for DNS propagation and automatic HTTPS certificate provisioning.

---

## 5. Demo Video & Presentation

1. Follow the 3-minute demo script in [`SUBMISSION/demo-script.md`](SUBMISSION/demo-script.md).
2. Record screen + audio on laptop / mobile device.
3. Upload to YouTube / Vimeo as unlisted or public.

---

## 6. Devpost Submission

1. Ensure the GitHub repository visibility is set to **Public**.
2. Create project entry on Devpost for CodeRED: Orion.
3. Paste the contents of [`SUBMISSION/devpost.md`](SUBMISSION/devpost.md).
4. Enter the deployed application URL, GitHub repository link, and demo video link.
5. Select the eligible sponsor prize categories:
   - MLH Gemini API
   - MLH ElevenLabs
   - MLH GoDaddy Registry
   - Best Environment Hack
   - DEV Writing Challenge
6. Submit prior to 11 Oct 2026, 23:30 IST.
