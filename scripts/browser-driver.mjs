import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import { spawn, execFileSync } from "node:child_process";

async function freePort() { return await new Promise((resolve, reject) => { const server = net.createServer(); server.once("error", reject); server.listen(0, "127.0.0.1", () => { const address = server.address(); server.close(() => resolve(address.port)); }); }); }
function requestJson(url, { method = "GET" } = {}) { return new Promise((resolve, reject) => { const req = http.request(url, { method }, res => { let data = ""; res.setEncoding("utf8"); res.on("data", chunk => { data += chunk; }); res.on("end", () => { if ((res.statusCode ?? 500) < 200 || (res.statusCode ?? 500) >= 300) { reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`)); return; } try { resolve(JSON.parse(data)); } catch (error) { reject(error); } }); }); req.on("error", reject); req.end(); }); }
async function waitForJson(url, attempts = 80) { let last; for (let i = 0; i < attempts; i += 1) { try { return await requestJson(url); } catch (error) { last = error; } await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error(`Chromium DevTools endpoint unavailable: ${last?.message ?? "unknown"}`); }

class CdpClient {
  constructor(url) { this.url = url; this.ws = null; this.nextId = 1; this.pending = new Map(); this.listeners = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", () => reject(new Error(`WebSocket connection failed: ${this.url}`)), { once: true }); });
    this.ws.addEventListener("message", event => { const message = JSON.parse(String(event.data)); if (message.id) { const waiter = this.pending.get(message.id); if (!waiter) return; this.pending.delete(message.id); if (message.error) waiter.reject(new Error(`${message.error.code}: ${message.error.message}`)); else waiter.resolve(message.result ?? {}); return; } const set = this.listeners.get(message.method); if (set) for (const listener of set) listener(message.params ?? {}); });
    return this;
  }
  on(method, listener) { if (!this.listeners.has(method)) this.listeners.set(method, new Set()); this.listeners.get(method).add(listener); }
  send(method, params = {}) { const id = this.nextId++; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })); }
  close() { try { this.ws?.close(); } catch (_) {} }
}
class CdpLocator {
  constructor(page, selector) { this.page = page; this.selector = selector; }
  async screenshot({ path: output }) {
    const rect = await this.page.evaluate(selector => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, this.selector);
    if (!rect || rect.width <= 0 || rect.height <= 0) throw new Error(`Cannot screenshot missing/empty element ${this.selector}`);
    const result = await this.page.client.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true, clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 } });
    const buffer = Buffer.from(result.data, "base64"); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, buffer); return buffer;
  }
}
class CdpPage {
  constructor(browser, target, options) { this.browser = browser; this.target = target; this.options = options; this.client = null; this.handlers = { console: [], pageerror: [], requestfailed: [] }; }
  async init() {
    this.client = await new CdpClient(this.target.webSocketDebuggerUrl).connect();
    await this.client.send("Page.enable"); await this.client.send("Runtime.enable"); await this.client.send("Network.enable");
    const viewport = this.options.viewport ?? { width: 420, height: 420 };
    await this.client.send("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false });
    if (this.options.reducedMotion) await this.client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: this.options.reducedMotion === "reduce" ? "reduce" : "no-preference" }] });
    this.client.on("Runtime.consoleAPICalled", params => { const text = (params.args ?? []).map(arg => arg.value ?? arg.description ?? arg.type).join(" "); const message = { type: () => params.type === "warning" ? "warning" : params.type === "error" ? "error" : params.type, text: () => text }; for (const fn of this.handlers.console) fn(message); });
    this.client.on("Runtime.exceptionThrown", params => { const error = new Error(params.exceptionDetails?.exception?.description ?? params.exceptionDetails?.text ?? "Page exception"); for (const fn of this.handlers.pageerror) fn(error); });
    this.client.on("Network.loadingFailed", params => { const req = { url: () => params.url ?? "", failure: () => ({ errorText: params.errorText ?? "loading failed" }) }; for (const fn of this.handlers.requestfailed) fn(req); });
    return this;
  }
  on(name, handler) { if (this.handlers[name]) this.handlers[name].push(handler); }
  async goto(url) { await this.client.send("Page.navigate", { url }); await this.waitForFunction(() => document.readyState === "complete"); }
  async setContent(html) { const tree = await this.client.send("Page.getFrameTree"); const frameId = tree.frameTree?.frame?.id; if (!frameId) throw new Error("Cannot resolve main frame id"); await this.client.send("Page.setDocumentContent", { frameId, html }); await this.waitForFunction(() => document.readyState === "complete"); }
  async waitForFunction(fn, timeout = 10000) { const start = Date.now(); while (Date.now() - start < timeout) { try { if (await this.evaluate(fn)) return; } catch (_) {} await new Promise(resolve => setTimeout(resolve, 25)); } throw new Error(`waitForFunction timeout after ${timeout}ms`); }
  async evaluate(fn, arg) { const serialized = arg === undefined ? "" : JSON.stringify(arg); const expression = arg === undefined ? `(${fn.toString()})()` : `(${fn.toString()})(${serialized})`; const result = await this.client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "Runtime.evaluate failed"); return result.result?.value; }
  async $eval(selector, fn) { const expression = `(${fn.toString()})(document.querySelector(${JSON.stringify(selector)}))`; const result = await this.client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "$eval failed"); return result.result?.value; }
  locator(selector) { return new CdpLocator(this, selector); }
  async close() { try { await this.client.send("Page.close"); } catch (_) {} this.client.close(); }
}
class CdpContext { constructor(browser, options) { this.browser = browser; this.options = options; this.pages = []; } async newPage() { const target = await this.browser.newTarget(); const page = await new CdpPage(this.browser, target, this.options).init(); this.pages.push(page); return page; } async close() { for (const page of this.pages) await page.close(); this.pages = []; } }
class ChromiumCdpBrowser {
  constructor(processHandle, port, userDir) { this.processHandle = processHandle; this.port = port; this.userDir = userDir; }
  async newTarget() { return await requestJson(`http://127.0.0.1:${this.port}/json/new?about:blank`, { method: "PUT" }); }
  async newContext(options = {}) { return new CdpContext(this, options); }
  async close() { try { this.processHandle.kill("SIGTERM"); } catch (_) {} await Promise.race([new Promise(resolve => this.processHandle.once("exit", resolve)), new Promise(resolve => setTimeout(resolve, 1000))]); try { fs.rmSync(this.userDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }); } catch (_) {} }
}
async function launchCdpChromium() {
  let executable = process.env.CHROMIUM_PATH;
  if (!executable) for (const candidate of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) { try { executable = execFileSync("sh", ["-lc", `command -v ${candidate}`], { encoding: "utf8" }).trim(); } catch (_) {} if (executable) break; }
  if (!executable) throw new Error("Neither Playwright nor a Chromium executable is available.");
  const port = await freePort();
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "motion-icon-chromium-"));
  const proc = spawn(executable, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--allow-file-access-from-files", `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "about:blank"], { stdio: ["ignore", "ignore", "ignore"] });
  proc.unref();
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  return new ChromiumCdpBrowser(proc, port, userDir);
}
export async function launchBrowser() { try { const { chromium } = await import("playwright"); return await chromium.launch({ headless: true }); } catch (_) { return await launchCdpChromium(); } }
