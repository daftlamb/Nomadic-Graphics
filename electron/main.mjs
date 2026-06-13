import { app, BrowserWindow, ipcMain, shell } from "electron";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_URL = `http://127.0.0.1:${process.env.PORT || 8788}/index.html`;
const WINDOW_ICON = fileURLToPath(new URL("../build/icon.png", import.meta.url));
const PRELOAD_SCRIPT = fileURLToPath(new URL("./preload.cjs", import.meta.url));
const LICENSE_APP_ID = "nomadic-graphics";

let mainWindow = null;

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function licenseStorePath() {
  return path.join(app.getPath("userData"), "license.json");
}

function appAssetPath(...parts) {
  return path.join(app.getAppPath(), ...parts);
}

function base64UrlDecode(value) {
  return Buffer.from(String(value).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function readPublicKey() {
  return fs.readFileSync(appAssetPath("license", "public-key.pem"), "utf8");
}

function verifyLicense(email, code) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  if (!normalizedEmail || !normalizedCode) return { valid: false, message: "Email and license code are required." };

  const parts = normalizedCode.split(".");
  if (parts.length !== 2) return { valid: false, message: "License code format is invalid." };

  let payload;
  try {
    const signature = base64UrlDecode(parts[1]);
    const verified = crypto.verify(null, Buffer.from(parts[0]), readPublicKey(), signature);
    if (!verified) return { valid: false, message: "License signature is invalid." };
    payload = JSON.parse(base64UrlDecode(parts[0]).toString("utf8"));
  } catch {
    return { valid: false, message: "License code could not be read." };
  }

  if (payload.app !== LICENSE_APP_ID && payload.app !== "*") return { valid: false, message: "This license is for a different app." };
  if (String(payload.email || "").trim().toLowerCase() !== normalizedEmail) return { valid: false, message: "Email does not match this license." };
  if (payload.expires && Date.now() > Date.parse(payload.expires)) return { valid: false, message: "This license has expired." };

  return {
    valid: true,
    email: normalizedEmail,
    edition: payload.edition || "standard",
    expires: payload.expires || "",
    serial: payload.serial || ""
  };
}

function readStoredLicense() {
  try {
    const saved = JSON.parse(fs.readFileSync(licenseStorePath(), "utf8"));
    return verifyLicense(saved.email, saved.code);
  } catch {
    return { valid: false, message: "No license found." };
  }
}

function setupLicenseIpc() {
  ipcMain.handle("license:getStatus", () => readStoredLicense());
  ipcMain.handle("license:activate", (event, payload) => {
    const result = verifyLicense(payload?.email, payload?.code);
    if (result.valid) {
      fs.writeFileSync(licenseStorePath(), JSON.stringify({
        email: result.email,
        code: String(payload.code || "").trim(),
        activatedAt: new Date().toISOString()
      }, null, 2));
    }
    return result;
  });
  ipcMain.handle("license:clear", () => {
    try {
      fs.unlinkSync(licenseStorePath());
    } catch {}
    return { valid: false, message: "License cleared." };
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#eeeadf",
    icon: WINDOW_ICON,
    title: "Nomadic Graphics",
    webPreferences: {
      preload: PRELOAD_SCRIPT,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadURL(APP_URL);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(`http://127.0.0.1:${process.env.PORT || 8788}/`)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  setupLicenseIpc();
  await import("../openai-image-proxy.mjs");
  createMainWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
