#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./contract-lib.mjs";

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log("Usage: node scripts/build-motion-icon.mjs --svg source.svg --contract contract.json [--profile profiles/web-svg-waapi.json] --out production-package [--skip-verify]");
  process.exit(args.length ? 0 : 1);
}
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; }
function block(code, message, details = null) {
  console.error(`BLOCKED ${code}: ${message}`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(2);
}
function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [path.resolve("scripts", script), ...scriptArgs], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const svgArg = option("--svg");
const contractArg = option("--contract");
if (!svgArg) block("ASSET_REQUIRED", "--svg is required for production build.");
if (!contractArg) block("NEEDS_PRODUCT_MODEL", "A canonical product contract is required before production build.");
const svg = path.resolve(svgArg);
const contract = path.resolve(contractArg);
const profile = path.resolve(option("--profile", "profiles/web-svg-waapi.json"));
const outDir = path.resolve(option("--out", "production-package"));
if (!fs.existsSync(svg)) block("ASSET_NOT_FOUND", `SVG not found: ${svg}`);
if (!fs.existsSync(contract) || fs.statSync(contract).isDirectory()) block("NEEDS_PRODUCT_MODEL", `Contract not found: ${contract}`);
if (!fs.existsSync(profile) || fs.statSync(profile).isDirectory()) block("RUNTIME_UNSUPPORTED", `Platform profile not found: ${profile}`);

const tempDir = path.resolve(".motion-build", path.basename(outDir));
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
const preflightReport = path.join(tempDir, "preflight.json");
const normalized = path.join(tempDir, "normalized.svg");
const normalizeReport = path.join(tempDir, "normalize.json");
let contractData;
try {
  contractData = readJson(contract);
} catch (error) {
  block("CONTRACT_INVALID", error.message);
}
const prefix = contractData.implementation?.asset_id_prefix ?? contractData.id;

run("asset-preflight.mjs", [svg, "--profile", profile, "--mode", "build", "--out", preflightReport]);
run("validate-contract.mjs", [contract, "--profile", profile, "--out", path.join(tempDir, "contract-validation.json")]);
run("svg-normalizer.mjs", [svg, "--out", normalized, "--id-prefix", prefix, "--report", normalizeReport]);
run("asset-preflight.mjs", [normalized, "--profile", profile, "--mode", "build", "--out", path.join(tempDir, "normalized-preflight.json")]);
run("svg-waapi-compiler.mjs", ["--svg", normalized, "--contract", contract, "--profile", profile, "--out", outDir]);
fs.copyFileSync(svg, path.join(outDir, "source.svg"));
fs.copyFileSync(preflightReport, path.join(outDir, "preflight-report.json"));
fs.copyFileSync(normalizeReport, path.join(outDir, "normalize-report.json"));
if (!args.includes("--skip-verify")) run("verify-motion-icon.mjs", [outDir, "--out", outDir]);
const manifestPath = path.join(outDir, "manifest.json");
const manifest = readJson(manifestPath);
writeJson(manifestPath, manifest);
console.log(`PASS: build pipeline complete -> ${outDir}`);
