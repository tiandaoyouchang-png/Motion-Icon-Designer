#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);

if (!args[0] || args.includes("--help")) {
  console.log(`
Usage:
  node scripts/verify-motion-icon.mjs <fixture.html> [--out <directory>]

Fixture contract:
  window.__motionIconTest = {
    setState(state),
    beginTransition(target),
    seek(progress),
    setReducedMotion(enabled),
    getState(),
    getTestScenarios()
  }

Required root:
  [data-motion-icon]
`);
  process.exit(args[0] ? 0 : 1);
}

const htmlPath = path.resolve(args[0]);
let outDir = path.resolve("motion-verify");
const outIndex = args.indexOf("--out");
if (outIndex >= 0 && args[outIndex + 1]) outDir = path.resolve(args[outIndex + 1]);

if (!fs.existsSync(htmlPath)) {
  console.error(`Fixture not found: ${htmlPath}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(`Playwright is required.\n\nRun:\n  npm install\n  npx playwright install chromium`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const sizes = [20, 24, 32, 96];
const frames = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
const report = {
  fixture: htmlPath,
  timestamp: new Date().toISOString(),
  captures: [],
  interactions: [],
  warnings: [],
  errors: []
};

const browser = await chromium.launch({ headless: true });
const hash = buffer => crypto.createHash("sha256").update(buffer).digest("hex");

async function openPage(reducedMotion = false) {
  const context = await browser.newContext({
    viewport: { width: 400, height: 400 },
    reducedMotion: reducedMotion ? "reduce" : "no-preference"
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(
    window.__motionIconTest && document.querySelector("[data-motion-icon]")
  ));
  return { context, page };
}

async function captureMode(label, reduced) {
  const { context, page } = await openPage(reduced);

  if (reduced) {
    await page.evaluate(() => window.__motionIconTest.setReducedMotion?.(true));
  }

  for (const size of sizes) {
    await page.evaluate(sizeValue => {
      const root = document.querySelector("[data-motion-icon]");
      root.style.width = `${sizeValue}px`;
      root.style.height = `${sizeValue}px`;
      window.__motionIconTest.setSize?.(sizeValue);
    }, size);

    for (const progress of frames) {
      await page.evaluate(async p => {
        const api = window.__motionIconTest;
        await api.reset?.();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await api.setReducedMotion?.(true);
        }
        await api.seek?.(p);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, progress);

      const file = `${label}-${size}px-${String(progress).replace(".", "_")}.png`;
      const output = path.join(outDir, file);
      const buffer = await page.locator("[data-motion-icon]").screenshot({
        path: output,
        animations: "allow"
      });
      report.captures.push({ label, size, progress, file, sha256: hash(buffer) });
    }
  }

  await page.evaluate(async () => window.__motionIconTest.seek?.(1));
  const finalState = await page.evaluate(() => window.__motionIconTest.getState?.());
  report[reduced ? "reducedFinalState" : "finalState"] = finalState;

  if (!reduced) {
    const scenarios = await page.evaluate(() => window.__motionIconTest.getTestScenarios?.() ?? []);
    for (const scenario of scenarios) {
      const result = await page.evaluate(async scenarioValue => {
        const api = window.__motionIconTest;
        await api.setState?.(scenarioValue.start);
        await api.beginTransition?.(scenarioValue.firstTarget);
        await api.seek?.(scenarioValue.interruptAt);
        await api.beginTransition?.(scenarioValue.secondTarget);
        await api.seek?.(1);
        const finalStateValue = api.getState?.();
        return {
          scenario: scenarioValue,
          finalState: finalStateValue,
          pass: finalStateValue?.current === scenarioValue.expected
        };
      }, scenario);
      report.interactions.push(result);
      if (!result.pass) report.errors.push(`Interaction failed: ${scenario.name}`);
    }
  }

  await context.close();
}

await captureMode("normal", false);
await captureMode("reduced", true);
report.ok = report.errors.length === 0;

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

const cells = report.captures.map(item => `
  <figure>
    <img src="${item.file}" alt="${item.label} ${item.size}px ${item.progress}">
    <figcaption>${item.label} / ${item.size}px / ${item.progress}</figcaption>
  </figure>`).join("");

fs.writeFileSync(path.join(outDir, "report.html"), `<!doctype html>
<meta charset="utf-8">
<title>Motion Icon Verification</title>
<style>
body{font:14px system-ui;margin:24px;background:#f5f5f5;color:#111}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
figure{margin:0;padding:12px;background:white;border:1px solid #ddd;border-radius:8px}
img{display:block;margin:auto;image-rendering:auto}figcaption{margin-top:8px;font-size:12px}
</style>
<h1>Motion Icon Verification</h1>
<p>Status: ${report.ok ? "PASS" : "FAIL"}</p>
<div class="grid">${cells}</div>`);

await browser.close();
console.log(report.ok ? "PASS: Motion icon verification" : "FAIL: Motion icon verification");
console.log(`Report: ${path.join(outDir, "report.html")}`);
if (!report.ok) process.exit(1);
