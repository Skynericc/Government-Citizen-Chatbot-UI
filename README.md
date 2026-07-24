# Assistant Citoyen — Royaume du Maroc

A React (Vite) demo of a Moroccan government citizen chatbot UI.

## Run it on Windows 11

### 1. Install Node.js
- Go to https://nodejs.org and download the **LTS** installer (`.msi`) for Windows.
- Run it, accepting the defaults (this also installs `npm`).
- Open **PowerShell** (Start menu → search "PowerShell") and check it worked:
  ```powershell
  node -v
  npm -v
  ```
  You should see version numbers (e.g. `v20.x.x` and `10.x.x`).

### 2. Unzip the project
- Right-click the downloaded `.zip` → **Extract All…**
- Choose a simple path, e.g. `C:\Users\<you>\Documents\assistant-citoyen-maroc`

### 3. Install dependencies
In PowerShell:
```powershell
cd C:\Users\<you>\Documents\assistant-citoyen-maroc
npm install
```
This downloads React, Vite, and the icon library into a local `node_modules` folder (a few seconds).

### 4. Start the app
```powershell
npm run dev
```
Vite will print a local address, usually:
```
Local: http://localhost:5173/
```
It should also open automatically in your default browser. If not, ctrl-click the link or paste it into your browser.

### 5. Make changes
- The whole interface lives in `src/CitizenAssistant.jsx`.
- Save the file — the browser refreshes instantly (hot reload), no restart needed.
- Stop the server anytime with `Ctrl + C` in PowerShell.

### 6. Build for production (optional)
```powershell
npm run build
```
This creates a `dist/` folder with static files you can deploy to any web server or hosting provider.

## Project structure
```
assistant-citoyen-maroc/
├─ index.html              entry HTML page
├─ package.json            dependencies & scripts
├─ vite.config.js          dev server config
├─ src/
│  ├─ main.jsx             React bootstrap
│  └─ CitizenAssistant.jsx the whole chatbot UI (edit this file)
└─ README.md
```

## Troubleshooting
- **"npm is not recognized"** → Node.js wasn't installed correctly, or you need to restart PowerShell (or your PC) so the PATH updates.
- **Port 5173 already in use** → close other running `npm run dev` terminals, or edit `server.port` in `vite.config.js`.
- **Blank page in browser** → open DevTools (F12) → Console tab, and check for a red error; it usually points at a typo in `CitizenAssistant.jsx`.
- **Antivirus / firewall prompt** → allow Node.js access on first run; it's only serving the app locally on your machine.
