#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { readJson, writeJson } from "./contract-lib.mjs";
import { launchBrowser } from "./browser-driver.mjs";
import { staticChecks, auditSemanticPartVisibility } from "./verification-dom.mjs";

const args = process.argv.slice(2);
const inputArg = args[0];
if (!inputArg || args.includes("--help")) {
  console.log(`
Usage:
  node scripts/verify-motion-icon.mjs <fixture.html|production-package> [--out directory]
    [--baseline baseline.json] [--write-baseline baseline.json]

Production fixture contract:
  window.__motionIconTest = {
    setState(state), beginTransition(target), seek(progress),
    setReducedMotion(enabled), getState(), getVisualState(),
    getTestScenarios(), reset()
  }

Required root:
  [data-motion-icon]
`);
  process.exit(inputArg ? 0 : 1);
}

function option(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
function sameState(a, b) { return typeof a === typeof b && a === b; }
function finiteRect(rect) { return rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width >= 0 && rect.height >= 0; }
function rectDelta(a, b) { return Math.max(Math.abs(a.x-b.x), Math.abs(a.y-b.y), Math.abs(a.width-b.width), Math.abs(a.height-b.height)); }

const inputPath = path.resolve(inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}
const isPackage = fs.statSync(inputPath).isDirectory();
const fixturePath = isPackage ? path.join(inputPath, "fixture.html") : inputPath;
const packageDir = isPackage ? inputPath : null;
if (!fs.existsSync(fixturePath)) {
  console.error(`Fixture not found: ${fixturePath}`);
  process.exit(1);
}
const contract = isPackage && fs.existsSync(path.join(inputPath, "contract.json")) ? readJson(path.join(inputPath, "contract.json")) : null;
const profile = isPackage && fs.existsSync(path.join(inputPath, "platform-profile.json")) ? readJson(path.join(inputPath, "platform-profile.json")) : null;
const outDir = path.resolve(option("--out", isPackage ? inputPath : "motion-verify"));
const screenshotDir = path.join(outDir, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const sizes = profile?.sizes_px ?? [20, 24, 32, 96];
const frames = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
const tolerance = contract?.verification?.stable_part_tolerance_px ?? profile?.stable_part_tolerance_px ?? 0.5;

const report = {
  schema: "motion-icon-verification/v2",
  input: inputPath,
  fixture: fixturePath,
  timestamp: new Date().toISOString(),
  runtime: contract?.implementation?.runtime ?? "legacy-fixture",
  checks: [],
  captures: [],
  interactions: [],
  console: [],
  errors: [],
  warnings: []
};
const check = (category, name, pass, details = null, severity = "error") => {
  report.checks.push({ category, name, pass, details, severity });
  if (!pass && severity === "error") report.errors.push(`${category}/${name}`);
  if (!pass && severity === "warning") report.warnings.push(`${category}/${name}`);
};
const hash = buffer => crypto.createHash("sha256").update(buffer).digest("hex");

if (isPackage) {
  const manifestPath = path.join(inputPath, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    check("INTEGRITY", "manifest-present", false, null);
  } else {
    const manifest = readJson(manifestPath);
    const tracked = [
      ["asset_sha256", "motion-icon.svg"],
      ["controller_sha256", "controller.js"],
      ["contract_sha256", "contract.json"],
      ["profile_sha256", "platform-profile.json"],
      ["fixture_sha256", "fixture.html"]
    ];
    for (const [field, file] of tracked) {
      const expected = manifest.integrity?.[field] ?? null;
      const filePath = path.join(inputPath, file);
      const actual = fs.existsSync(filePath) ? hash(fs.readFileSync(filePath)) : null;
      check("INTEGRITY", field, Boolean(expected) && actual === expected, { file, expected, actual });
    }
  }
}

let fixtureHtml = fs.readFileSync(fixturePath, "utf8");
if (isPackage && fs.existsSync(path.join(inputPath, "controller.js"))) {
  const controller = fs.readFileSync(path.join(inputPath, "controller.js"), "utf8").replace(/<\/script/gi, "<\\/script");
  fixtureHtml = fixtureHtml.replace(/<script\s+src=["']\.\/controller\.js["']\s*><\/script>/i, `<script>${controller}</script>`);
}
const browser = await launchBrowser();

async function openPage(reduced = false) {
  const context = await browser.newContext({
    viewport: { width: 420, height: 420 },
    reducedMotion: reduced ? "reduce" : "no-preference"
  });
  const page = await context.newPage();
  page.on("console", msg => {
    if (["error", "warning"].includes(msg.type())) report.console.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", err => report.console.push({ type: "pageerror", text: err.message }));
  page.on("requestfailed", req => report.console.push({ type: "requestfailed", text: `${req.url()} ${req.failure()?.errorText ?? ""}` }));
  await page.setContent(fixtureHtml, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__motionIconTest && document.querySelector("[data-motion-icon]")));
  return { context, page };
}

function defaultCaptureScenario(scenarios) {
  if (scenarios.length) return scenarios[0];
  return null;
}

async function captureNormal() {
  const { context, page } = await openPage(false);
  const initialDom = await staticChecks(page, { contract, profile, check, finiteRect });
  await auditSemanticPartVisibility(page, { contract, check });
  const scenarios = await page.evaluate(() => window.__motionIconTest.getTestScenarios?.() ?? []);
  const captureScenario = defaultCaptureScenario(scenarios);
  const stableBaselines = new Map();

  for (const size of sizes) {
    await page.evaluate(sizeValue => {
      const root = document.querySelector("[data-motion-icon]");
      root.style.width = `${sizeValue}px`;
      root.style.height = `${sizeValue}px`;
    }, size);

    for (const progress of frames) {
      const state = await page.evaluate(async ({ scenario, progressValue }) => {
        const api = window.__motionIconTest;
        await api.reset?.();
        if (scenario) {
          await api.setState?.(scenario.start);
          await api.beginTransition?.(scenario.firstTarget);
        }
        await api.seek?.(progressValue);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return { state: api.getState?.(), visual: api.getVisualState?.() };
      }, { scenario: captureScenario, progressValue: progress });

      if (contract && state.visual?.parts) {
        for (const partName of contract.geometry.stable_parts ?? []) {
          const rect = state.visual.parts[partName]?.bounds;
          if (!rect) {
            check("GEOMETRY", `stable-part-${partName}-exists`, false, null);
            continue;
          }
          const key = `${size}:${partName}`;
          if (progress === 0) stableBaselines.set(key, rect);
          const base = stableBaselines.get(key);
          if (base) check("GEOMETRY", `stable-${partName}-${size}px-${progress}`, rectDelta(base, rect) <= tolerance, { tolerance, base, rect, delta: rectDelta(base, rect) });
        }
      }

      const file = `normal-${size}px-${String(progress).replace(".", "_")}.png`;
      const output = path.join(screenshotDir, file);
      const buffer = await page.locator("[data-motion-icon]").screenshot({ path: output, animations: "allow" });
      report.captures.push({ label: "normal", size, progress, file: `screenshots/${file}`, sha256: hash(buffer), state: state.state });
    }
  }

  if (captureScenario) {
    const finalState = await page.evaluate(() => window.__motionIconTest.getState?.());
    check("STATE", "capture-final-target", sameState(finalState?.current, captureScenario.firstTarget), { expected: captureScenario.firstTarget, actual: finalState });
    check("STATE", "capture-not-active-after-settle", finalState?.active !== true, finalState);
    check("STATE", "capture-no-runtime-error", finalState?.lastError == null, finalState?.lastError ?? null);
  }
  check("DOM", "viewBox-stable", initialDom.viewBox === (await page.$eval("[data-motion-icon]", el => el.getAttribute("viewBox"))), initialDom.viewBox);

  for (const scenario of scenarios) {
    const result = await page.evaluate(async scenarioValue => {
      const api = window.__motionIconTest;
      await api.reset?.();
      await api.setReducedMotion?.(false);
      await api.setState?.(scenarioValue.start);
      await api.beginTransition?.(scenarioValue.firstTarget);
      await api.seek?.(scenarioValue.interruptAt);
      const visualAtInterrupt = api.getVisualState?.();
      await api.beginTransition?.(scenarioValue.secondTarget);
      await api.seek?.(1);
      const finalState = api.getState?.();
      return { scenario: scenarioValue, visualAtInterrupt, finalState };
    }, scenario);
    const pass = sameState(result.finalState?.current, scenario.expected) && sameState(result.finalState?.latestRequested ?? result.finalState?.current, scenario.expected) && result.finalState?.active !== true && result.finalState?.lastError == null;
    report.interactions.push({ ...result, pass });
    check("INTERACTION", scenario.name, pass, { expected: scenario.expected, finalState: result.finalState });
  }
  await context.close();
}

async function captureReduced() {
  const { context, page } = await openPage(true);
  await staticChecks(page, { contract, profile, check, finiteRect });
  const targets = contract?.state?.allowed ?? [];
  if (targets.length) {
    for (const target of targets) {
      const state = await page.evaluate(async ({ initial, targetValue }) => {
        const api = window.__motionIconTest;
        await api.reset?.();
        await api.setState?.(initial);
        await api.setReducedMotion?.(true);
        await api.beginTransition?.(targetValue);
        await api.seek?.(1);
        return api.getState?.();
      }, { initial: contract.state.initial, targetValue: target });
      check("ACCESSIBILITY", `reduced-motion-target-${String(target)}`, sameState(state?.current, target) && state?.active !== true, state);
    }
  } else {
    await page.evaluate(async () => window.__motionIconTest.setReducedMotion?.(true));
    const scenarios = await page.evaluate(() => window.__motionIconTest.getTestScenarios?.() ?? []);
    if (scenarios[0]) {
      const state = await page.evaluate(async s => {
        const api = window.__motionIconTest;
        await api.setState?.(s.start);
        await api.beginTransition?.(s.firstTarget);
        await api.seek?.(1);
        return api.getState?.();
      }, scenarios[0]);
      check("ACCESSIBILITY", "legacy-reduced-motion-final", sameState(state?.current, scenarios[0].firstTarget), state);
    }
  }

  for (const size of sizes) {
    await page.evaluate(sizeValue => {
      const root = document.querySelector("[data-motion-icon]");
      root.style.width = `${sizeValue}px`;
      root.style.height = `${sizeValue}px`;
    }, size);
    const file = `reduced-${size}px-final.png`;
    const output = path.join(screenshotDir, file);
    const buffer = await page.locator("[data-motion-icon]").screenshot({ path: output, animations: "allow" });
    report.captures.push({ label: "reduced", size, progress: 1, file: `screenshots/${file}`, sha256: hash(buffer) });
  }
  await context.close();
}

await captureNormal();
await captureReduced();

const consoleErrors = report.console.filter(item => item.type !== "warning");
check("RUNTIME", "console-errors", consoleErrors.length === 0, consoleErrors);
if (report.console.some(item => item.type === "warning")) report.warnings.push("RUNTIME/console-warnings");

const baselinePath = option("--baseline");
if (baselinePath) {
  const baseline = readJson(path.resolve(baselinePath));
  const current = Object.fromEntries(report.captures.map(item => [`${item.label}:${item.size}:${item.progress}`, item.sha256]));
  const expected = baseline.captures ?? {};
  const mismatches = Object.entries(expected).filter(([key, value]) => current[key] !== value).map(([key, value]) => ({ key, expected: value, actual: current[key] ?? null }));
  check("VISUAL", "exact-hash-baseline", mismatches.length === 0, { mismatches, note: "Exact screenshot hashes require a pinned browser/OS rendering environment." });
}
const writeBaseline = option("--write-baseline");
if (writeBaseline) {
  writeJson(path.resolve(writeBaseline), {
    schema: "motion-icon-baseline/v1",
    generated_at: new Date().toISOString(),
    captures: Object.fromEntries(report.captures.map(item => [`${item.label}:${item.size}:${item.progress}`, item.sha256]))
  });
}

report.ok = report.errors.length === 0;
writeJson(path.join(outDir, "verify-report.json"), report);
const rows = report.checks.map(item => `<tr><td>${item.pass ? "PASS" : "FAIL"}</td><td>${item.category}</td><td>${item.name}</td><td><pre>${escapeHtml(JSON.stringify(item.details ?? "", null, 2))}</pre></td></tr>`).join("");
const cells = report.captures.map(item => `<figure><img src="${item.file}" alt="${item.label} ${item.size}px ${item.progress}"><figcaption>${item.label} / ${item.size}px / ${item.progress}</figcaption></figure>`).join("");
function escapeHtml(value) { return value.replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch])); }
fs.writeFileSync(path.join(outDir, "verify-report.html"), `<!doctype html><meta charset="utf-8"><title>Motion Icon Verification v2</title>
<style>body{font:14px system-ui;margin:24px;background:#f5f5f5;color:#111}table{border-collapse:collapse;width:100%;background:#fff}td,th{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}pre{white-space:pre-wrap;margin:0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:24px}figure{margin:0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:8px}img{display:block;margin:auto}figcaption{margin-top:8px;font-size:12px}</style>
<h1>Motion Icon Verification v2</h1><p>Status: <strong>${report.ok ? "PASS" : "FAIL"}</strong></p><p>Errors: ${report.errors.length} / Warnings: ${report.warnings.length}</p>
<table><thead><tr><th>Status</th><th>Category</th><th>Check</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table><div class="grid">${cells}</div>`);

if (packageDir && fs.existsSync(path.join(packageDir, "manifest.json"))) {
  const manifest = readJson(path.join(packageDir, "manifest.json"));
  manifest.verification = {
    status: report.ok ? "PASS" : "FAIL",
    checked_at: report.timestamp,
    report: "verify-report.json",
    errors: report.errors.length,
    warnings: report.warnings.length
  };
  writeJson(path.join(packageDir, "manifest.json"), manifest);
}

await browser.close();
console.log(report.ok ? "PASS: Motion icon verification v2" : "FAIL: Motion icon verification v2");
console.log(`Report: ${path.join(outDir, "verify-report.html")}`);
if (!report.ok) process.exit(1);
