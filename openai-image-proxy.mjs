import { createServer } from "node:http";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, tmpdir } from "node:os";
import { execFile } from "node:child_process";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8788);
const defaultApiBaseUrl = process.env.OPENAI_API_BASE_URL || process.env.NEWAPI_BASE_URL || "https://api.openai.com";
const isWindows = platform() === "win32";
const defaultMagentaCli = isWindows ? "E:\\AIEnvs\\magenta-rt\\Scripts\\mrt.exe" : "/Volumes/DOC/AI ENV/magenta-rt/bin/mrt";
const defaultMagentaHome = isWindows ? "E:\\AIModels\\Magenta" : "/Volumes/DOC/AI ENV/Magenta";
const defaultMagentaOutputDir = isWindows ? "E:\\AIModels\\Magenta\\magenta-rt-v2\\outputs" : "/Volumes/DOC/AI ENV/Magenta/magenta-rt-v2/outputs";
const maxRequestBytes = 32_000_000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".onnx": "application/octet-stream",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function sendCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxRequestBytes) {
        tooLarge = true;
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new Error(`Request too large. Limit is ${Math.round(maxRequestBytes / 1_000_000)}MB.`));
        return;
      }
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function bearerToken(request) {
  const header = request.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function imagePayload(input) {
  const payload = {
    model: input.model || "gpt-image-2",
    prompt: String(input.prompt || "").trim(),
    n: 1,
    output_format: "png"
  };
  if (!payload.prompt) throw new Error("Prompt is required");
  for (const key of ["size", "quality", "background"]) {
    const value = String(input[key] || "auto").toLowerCase();
    if (value && value !== "auto") payload[key] = value;
    else if (key === "size") payload[key] = "auto";
  }
  return payload;
}

function imageGenerationUrl(baseUrl) {
  const raw = String(baseUrl || defaultApiBaseUrl).trim() || defaultApiBaseUrl;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const clean = withProtocol.replace(/\/+$/, "");
  const parsed = new URL(clean);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported API protocol: ${parsed.protocol}`);
  if (/\/images\/generations$/i.test(parsed.pathname)) return parsed.toString();
  if (/\/v1$/i.test(parsed.pathname)) return `${clean}/images/generations`;
  return `${clean}/v1/images/generations`;
}

function imageEditUrl(baseUrl) {
  const raw = String(baseUrl || defaultApiBaseUrl).trim() || defaultApiBaseUrl;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const clean = withProtocol.replace(/\/+$/, "");
  const parsed = new URL(clean);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported API protocol: ${parsed.protocol}`);
  if (/\/images\/edits$/i.test(parsed.pathname)) return parsed.toString();
  if (/\/v1$/i.test(parsed.pathname)) return `${clean}/images/edits`;
  return `${clean}/v1/images/edits`;
}

function chatCompletionUrl(baseUrl) {
  const raw = String(baseUrl || defaultApiBaseUrl).trim() || defaultApiBaseUrl;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const clean = withProtocol.replace(/\/+$/, "");
  const parsed = new URL(clean);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported API protocol: ${parsed.protocol}`);
  if (/\/chat\/completions$/i.test(parsed.pathname)) return parsed.toString();
  if (/\/v1$/i.test(parsed.pathname)) return `${clean}/chat/completions`;
  return `${clean}/v1/chat/completions`;
}

function roboflowSam2Url(baseUrl) {
  const raw = String(baseUrl || "https://serverless.roboflow.com").trim() || "https://serverless.roboflow.com";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const clean = withProtocol.replace(/\/+$/, "");
  const parsed = new URL(clean);
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!isLocal && !parsed.hostname.endsWith("roboflow.com")) {
    throw new Error(`Unsupported Roboflow host: ${parsed.hostname}`);
  }
  if (/\/sam2\/segment_image$/i.test(parsed.pathname)) return parsed.toString();
  return `${clean}/sam2/segment_image`;
}

async function imageUrlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, timeout: options.timeout || 180_000 }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === "SIGTERM" || /timed out/i.test(String(error.message || ""))) {
          reject(new Error(`Magenta timed out after ${Math.round((options.timeout || 180_000) / 1000)}s. Try a shorter duration, mrt2_small, or the MLX backend on Mac.`));
          return;
        }
        const lines = String(stderr || stdout || error.message)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !/^INFO:/i.test(line));
        const message = lines.slice(-8).join("\n") || stderr || stdout || error.message;
        reject(new Error(String(message).trim()));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function newestFile(dir, extensions, sinceMs) {
  let best = null;
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
    await Promise.all(entries.map(async (entry) => {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(full);
        return;
      }
      if (!extensions.includes(extname(entry.name).toLowerCase())) return;
      const info = await stat(full).catch(() => null);
      if (!info || info.mtimeMs < sinceMs) return;
      if (!best || info.mtimeMs > best.mtimeMs) best = { path: full, mtimeMs: info.mtimeMs };
    }));
  }
  await visit(dir);
  return best?.path || "";
}

async function magentaPayloadToAudio(input) {
  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw new Error("Prompt is required");
  const requestedBackend = ["mlx", "jax"].includes(String(input.backend || "").toLowerCase()) ? String(input.backend).toLowerCase() : "mlx";
  const backend = isWindows && requestedBackend === "mlx" ? "jax" : requestedBackend;
  const model = String(input.model || "mrt2_small").trim() || "mrt2_small";
  const duration = Math.max(1, Math.min(60, Number(input.duration || 4)));
  if (isWindows && backend === "jax" && model === "mrt2_base" && duration > 3) {
    throw new Error("mrt2_base on Windows/JAX is too slow for long clips. Use mrt2_small, duration <= 3s, or run mrt2_base with MLX on Mac.");
  }
  const workDir = await mkdtemp(join(tmpdir(), "nomadic-magenta-"));
  const startedAt = Date.now() - 1000;
  try {
    const mrtCommand = String(input.magenta_cli || process.env.MAGENTA_RT_CLI || defaultMagentaCli).trim();
    const outputDir = String(input.magenta_output_dir || process.env.MAGENTA_RT_OUTPUT_DIR || defaultMagentaOutputDir).trim();
    const magentaHome = String(input.magenta_home || process.env.MAGENTA_HOME || defaultMagentaHome).trim();
    await rm(join(outputDir, `output_audio_${backend}_${model}.wav`), { force: true }).catch(() => {});
    await runCommand(mrtCommand, [backend, "generate", "--prompt", prompt, "--duration", String(duration), `--model=${model}`], {
      cwd: workDir,
      env: {
        ...process.env,
        MAGENTA_HOME: magentaHome,
        PYTHONUTF8: "1",
        PYTHONIOENCODING: "utf-8"
      },
      timeout: Math.max(model === "mrt2_base" ? 900_000 : 180_000, duration * 60_000)
    });
    const wav = await newestFile(outputDir, [".wav", ".mp3", ".flac", ".aiff", ".aif"], startedAt)
      || await newestFile(workDir, [".wav", ".mp3", ".flac", ".aiff", ".aif"], startedAt);
    if (!wav) throw new Error("Magenta generated no audio file");
    const bytes = await readFile(wav);
    const ext = extname(wav).toLowerCase();
    const mime = ext === ".mp3" ? "audio/mpeg" : ext === ".flac" ? "audio/flac" : ext === ".aiff" || ext === ".aif" ? "audio/aiff" : "audio/wav";
    return {
      audio_data_url: `data:${mime};base64,${bytes.toString("base64")}`
    };
  } catch (error) {
    if (/ENOENT|not recognized|not found/i.test(String(error.message || error))) {
      throw new Error("Magenta CLI not found. Install magenta-rt and run mrt models init/download first.");
    }
    throw error;
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function imageBase64FromDataUrl(dataUrl) {
  const text = String(dataUrl || "").trim();
  const match = text.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  if (!match) throw new Error("Image data must be a base64 data URL");
  return {
    mime: match[1].toLowerCase(),
    base64: match[2].replace(/\s+/g, "")
  };
}

function appendImageEditFields(form, input) {
  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw new Error("Prompt is required");
  const source = imageBase64FromDataUrl(input.image_data_url || input.imageDataUrl);
  const extension = source.mime.includes("jpeg") ? "jpg" : source.mime.includes("webp") ? "webp" : "png";
  form.append("model", input.model || "gpt-image-2-pro");
  form.append("prompt", prompt);
  form.append("image", new Blob([Buffer.from(source.base64, "base64")], { type: source.mime }), `image.${extension}`);
  form.append("n", "1");
  form.append("output_format", "png");
  for (const key of ["size", "quality", "background"]) {
    const value = String(input[key] || "auto").toLowerCase();
    if (value && value !== "auto") form.append(key, value);
    else if (key === "size") form.append(key, "auto");
  }
}

function chatPayload(input) {
  const prompt = String(input.prompt || "").trim();
  const imageDataUrl = String(input.image_data_url || input.imageDataUrl || "").trim();
  if (!prompt) throw new Error("Prompt is required");
  if (!imageDataUrl) throw new Error("Image data is required");
  return {
    model: input.model || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
              detail: String(input.detail || "low").toLowerCase() === "high" ? "high" : "low"
            }
          }
        ]
      }
    ],
    temperature: 0.2
  };
}

function messageContentText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => typeof item === "string" ? item : item?.text || "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function roboflowSam2Payload(input) {
  const dataUrl = String(input.image_data_url || input.imageDataUrl || "").trim();
  const base64 = dataUrl.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
  if (!base64) throw new Error("Image data is required");
  const box = input.box || {};
  const promptBox = {
    x: Number(box.x),
    y: Number(box.y),
    width: Number(box.width),
    height: Number(box.height)
  };
  if (Object.values(promptBox).some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("A valid box prompt is required");
  }
  return {
    image: {
      type: "base64",
      value: base64
    },
    sam2_version_id: String(input.model || "hiera_small").trim() || "hiera_small",
    format: "json",
    multimask_output: true,
    prompts: [
      {
        box: promptBox
      }
    ]
  };
}

async function handleOpenAIImage(request, response) {
  sendCors(response);
  try {
    const key = bearerToken(request) || process.env.OPENAI_API_KEY || "";
    if (!key) throw new Error("Missing OpenAI API key");
    const input = await readJson(request);
    const apiUrl = imageGenerationUrl(input.base_url || input.baseUrl);
    const openaiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(imagePayload(input))
    });
    const data = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      const message = data?.error?.message || data?.message || `OpenAI HTTP ${openaiResponse.status}`;
      response.writeHead(openaiResponse.status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: message }));
      return;
    }
    let imageBase64 = data?.data?.[0]?.b64_json;
    if (!imageBase64 && data?.data?.[0]?.url) {
      imageBase64 = await imageUrlToBase64(data.data[0].url);
    }
    if (!imageBase64) throw new Error("OpenAI did not return b64_json");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ image_base64: imageBase64, revised_prompt: data?.data?.[0]?.revised_prompt || "" }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: String(error.message || error) }));
  }
}

async function handleOpenAIImageEdit(request, response) {
  sendCors(response);
  try {
    const key = bearerToken(request) || process.env.OPENAI_API_KEY || "";
    if (!key) throw new Error("Missing OpenAI API key");
    const input = await readJson(request);
    const apiUrl = imageEditUrl(input.base_url || input.baseUrl);
    const form = new FormData();
    appendImageEditFields(form, input);
    const upstreamResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`
      },
      body: form
    });
    const data = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      const message = data?.error?.message || data?.message || `OpenAI HTTP ${upstreamResponse.status}`;
      response.writeHead(upstreamResponse.status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: message }));
      return;
    }
    let imageBase64 = data?.data?.[0]?.b64_json;
    if (!imageBase64 && data?.data?.[0]?.url) {
      imageBase64 = await imageUrlToBase64(data.data[0].url);
    }
    if (!imageBase64) throw new Error("OpenAI did not return b64_json");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ image_base64: imageBase64, revised_prompt: data?.data?.[0]?.revised_prompt || "" }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: String(error.message || error) }));
  }
}

async function handleOpenAIChat(request, response) {
  sendCors(response);
  try {
    const key = bearerToken(request) || process.env.OPENAI_API_KEY || "";
    if (!key) throw new Error("Missing OpenAI API key");
    const input = await readJson(request);
    const apiUrl = chatCompletionUrl(input.base_url || input.baseUrl);
    const upstreamResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatPayload(input))
    });
    const data = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      const message = data?.error?.message || data?.message || `Chat HTTP ${upstreamResponse.status}`;
      response.writeHead(upstreamResponse.status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: message }));
      return;
    }
    const content = messageContentText(data?.choices?.[0]?.message?.content);
    if (!content) throw new Error("Chat response did not include content");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ content, usage: data?.usage || null }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: String(error.message || error) }));
  }
}

async function handleMagentaGenerate(request, response) {
  sendCors(response);
  try {
    const input = await readJson(request);
    const payload = await magentaPayloadToAudio(input);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(payload));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: String(error.message || error) }));
  }
}

async function handleRoboflowSam2(request, response) {
  sendCors(response);
  try {
    const key = bearerToken(request) || process.env.ROBOFLOW_API_KEY || "";
    if (!key) throw new Error("Missing Roboflow API key");
    const input = await readJson(request);
    const apiUrl = roboflowSam2Url(input.api_url || input.apiUrl);
    const target = `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(key)}`;
    const upstreamResponse = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(roboflowSam2Payload(input))
    });
    const text = await upstreamResponse.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!upstreamResponse.ok) {
      const message = data?.error?.message || data?.message || data?.error || `Roboflow HTTP ${upstreamResponse.status}`;
      response.writeHead(upstreamResponse.status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: message }));
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(data));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: String(error.message || error) }));
  }
}

async function handleStatic(request, response) {
  sendCors(response);
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const candidate = normalize(join(root, pathname));
  if (!candidate.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const bytes = await readFile(candidate);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(candidate)] || "application/octet-stream" });
    response.end(bytes);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendCors(response);
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.url?.startsWith("/openai/image-edit")) {
    if (request.method !== "POST") {
      sendCors(response);
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    await handleOpenAIImageEdit(request, response);
    return;
  }
  if (request.url?.startsWith("/openai/image")) {
    if (request.method !== "POST") {
      sendCors(response);
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    await handleOpenAIImage(request, response);
    return;
  }
  if (request.url?.startsWith("/openai/chat")) {
    if (request.method !== "POST") {
      sendCors(response);
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    await handleOpenAIChat(request, response);
    return;
  }
  if (request.url?.startsWith("/magenta/generate")) {
    if (request.method !== "POST") {
      sendCors(response);
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    await handleMagentaGenerate(request, response);
    return;
  }
  if (request.url?.startsWith("/roboflow/sam2")) {
    if (request.method !== "POST") {
      sendCors(response);
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    await handleRoboflowSam2(request, response);
    return;
  }
  await handleStatic(request, response);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.warn(`Nomadic Graphics local proxy already running on http://127.0.0.1:${port}`);
    return;
  }
  console.error(error);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Nomadic Graphics local proxy: http://127.0.0.1:${port}`);
});
