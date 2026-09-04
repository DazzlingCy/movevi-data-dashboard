import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((item, index, all) => item.startsWith("--") ? [item.slice(2), all[index + 1]] : null).filter(Boolean));
const port = Number(args.port || 9333);
const baseUrl = args.base || "http://127.0.0.1:4173";
const outputDir = path.resolve(args.out || "artifacts/menu-screenshots");
const browserPath = args.browser ? path.resolve(args.browser) : null;

const pages = [
  { file: "01-数据概览.png", route: "/dashboard", title: "数据概览" },
  { file: "02-销售中心.png", route: "/sales", title: "销售中心" },
  { file: "03-设备中心.png", route: "/devices", title: "设备中心" },
  { file: "04-用户中心.png", route: "/users", title: "用户中心" },
  { file: "05-跑遍全球-内容中心.png", route: "/content", title: "内容中心" },
  { file: "06-跑遍全球-探索中心.png", route: "/explore", title: "探索中心" },
  { file: "07-活动中心-勋章抽奖.png", route: "/activities/lottery", title: "勋章抽奖" },
  { file: "08-活动中心-30天打卡.png", route: "/activities/checkin", title: "30天打卡" },
  { file: "09-商业中心.png", route: "/commercial", title: "商业中心" },
  { file: "10-AI洞察.png", route: "/insights", title: "AI 洞察" },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready");
}

function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(`${message.error.code}: ${message.error.message}`));
    else resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    ready,
    close: () => socket.close(),
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function waitForPage(client, expectedTitle) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await client.send("Runtime.evaluate", {
      expression: `document.readyState === "complete" && document.body.innerText.includes(${JSON.stringify(expectedTitle)}) && !document.body.innerText.includes("正在加载")`,
      returnByValue: true,
    });
    if (result.result.value === true) return;
    await delay(100);
  }
  throw new Error(`Page did not settle: ${expectedTitle}`);
}

await mkdir(outputDir, { recursive: true });

let browserProcess = null;
let browserProfile = null;
let browserErrors = "";
if (browserPath) {
  browserProfile = await mkdtemp(path.join(os.tmpdir(), "movevi-capture-"));
  browserProcess = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${browserProfile}`,
    "about:blank",
  ], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  browserProcess.stderr.on("data", (chunk) => { browserErrors += chunk.toString(); });
}

try {
  await waitForDebugger();
} catch (error) {
  if (browserErrors.trim()) process.stderr.write(browserErrors);
  throw error;
}

const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, { method: "PUT" });
if (!targetResponse.ok) throw new Error(`Unable to create capture target: ${targetResponse.status}`);
const target = await targetResponse.json();
const client = connect(target.webSocketDebuggerUrl);
await client.ready;
await client.send("Page.enable");
await client.send("Runtime.enable");
await client.send("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 1000,
  deviceScaleFactor: 2,
  mobile: false,
  screenWidth: 1600,
  screenHeight: 1000,
});

const manifest = [];

try {
  for (const page of pages) {
    const url = `${baseUrl}${page.route}`;
    await client.send("Page.navigate", { url });
    await waitForPage(client, page.title);
    await client.send("Runtime.evaluate", {
      expression: `Promise.all([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1200))]).then(() => {
        const style = document.createElement("style");
        style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
        document.head.appendChild(style);
        window.scrollTo(0, document.documentElement.scrollHeight);
        return new Promise(resolve => setTimeout(() => { window.scrollTo(0, 0); resolve(true); }, 250));
      })`,
      awaitPromise: true,
      returnByValue: true,
    });

    const metrics = await client.send("Page.getLayoutMetrics");
    const size = metrics.cssContentSize || metrics.contentSize;
    const width = Math.max(1600, Math.ceil(size.width));
    const height = Math.max(1000, Math.ceil(size.height));
    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    await writeFile(path.join(outputDir, page.file), Buffer.from(screenshot.data, "base64"));
    manifest.push({ ...page, url, cssWidth: width, cssHeight: height, pixelWidth: width * 2, pixelHeight: height * 2 });
    process.stdout.write(`Captured ${page.file} (${width * 2}×${height * 2})\n`);
  }
  await writeFile(path.join(outputDir, "screenshots.json"), JSON.stringify(manifest, null, 2), "utf8");
} finally {
  client.close();
  if (browserProcess && browserProcess.exitCode == null) browserProcess.kill();
  if (browserProfile) {
    const resolvedTemp = path.resolve(os.tmpdir());
    const resolvedProfile = path.resolve(browserProfile);
    if (resolvedProfile.startsWith(resolvedTemp + path.sep) && path.basename(resolvedProfile).startsWith("movevi-capture-")) {
      await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
}
