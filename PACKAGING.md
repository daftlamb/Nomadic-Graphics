# Nomadic Graphics Desktop Packaging

## Windows desktop build

Install packaging dependencies once:

```powershell
npm install
```

Run the desktop app:

```powershell
npm run dev
```

Create a Windows installer:

```powershell
npm run dist:win
```

The installer output is written to `dist/`.

## Bundled assets

- App frontend: `index.html`, `app.js`, `geometry-engine.js`, `styles.css`, `help.html`
- Local proxy: `openai-image-proxy.mjs`
- Node UI/runtime vendors: `vendor/litegraph`, `vendor/paper`
- Local Mobile SAM runtime: `vendor/mobilesam`, `vendor/ort`
- Desktop icon: `build/icon.ico`, `build/icon.png`
- License public key: `license/public-key.pem`

Mobile SAM is bundled because the current vendor payload is small enough for a desktop installer.

## External optional assets

Magenta RT and its models are not bundled. They can be several GB and should be installed by the user only when they need Magenta Music.

Users can configure these paths in Settings:

- Magenta RT CLI
- Magenta model/home folder
- Magenta output folder

## API settings

OpenAI-compatible API settings are device-local settings:

- Base URL is blank by default and falls back to `https://api.openai.com`
- API keys are not written into patch exports
- Third-party OpenAI-compatible Base URLs can be entered in Settings or per node

## Offline license

The desktop app uses the same offline Ed25519 license pattern as Emboss Lab and Mapit Pro.

- The installer only ships `license/public-key.pem`
- Keep `license/private-key.pem` local and secret
- Run the local generator with `npm run license:admin` or double-click `License Admin.cmd`
- Use app id `nomadic-graphics` for Nomadic Graphics licenses
- Use app id `*` only when a code should activate multiple tools sharing this key
