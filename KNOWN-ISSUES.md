# Known Issues and Mitigations

This file records challenges, technical roadblocks, or edge cases encountered during development, along with their resolutions.

---

## 1. Multi-platform Shell Scripting

- **Challenge**: Development environment is Windows (PowerShell), but production deployment is Linux (Ubuntu on Vultr). Standard npm scripts using `rm -rf`, `export`, or `curl` fail on Windows.
- **Mitigation**: All repository scripts are written as pure Node.js `.mjs` scripts. Cross-platform environment variables in npm scripts are managed using `cross-env`.

## 2. In-Memory Image Safety

- **Challenge**: Security and privacy rules dictate that user photos must never be persisted to disk, stored in databases, or logged in logs.
- **Mitigation**: Multipart form data is handled entirely as in-memory buffers in API routes and passed directly to the Gemini SDK. Only SHA-256 hashes of images are used for LRU cache keys.

## 3. Web Speech API Browser Differences

- **Challenge**: Browser `speechSynthesis` availability and voice quality vary between desktop and mobile browsers.
- **Mitigation**: Multi-tier audio fallback ladder: Server ElevenLabs -> Persistent Disk Cache -> Browser SpeechSynthesis -> Plain text display. The UI explicitly labels the active audio source ("browser voice" vs cloud voice).
