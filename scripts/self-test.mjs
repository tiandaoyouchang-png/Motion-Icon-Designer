#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./contract-lib.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "motion-icon-self-test-"));
let failures = 0;

function result(name, pass, details = "") {
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${details ? ` — ${details}` : ""}`);
  if (!pass) failures += 1;
}
function run(script, args = [], expected = 0) {
  const proc = spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { cwd: root, encoding: "utf8" });
  if (proc.status !== expected) {
    console.error(proc.stdout);
    console.error(proc.stderr);
  }
  return { pass: proc.status === expected, proc };
}

try {
  const scriptFiles = [];
  for (const dir of ["scripts", "scripts/adapters", "scripts/runtime"]) {
    for (const name of fs.readdirSync(path.join(root, dir))) {
      const file = path.join(root, dir, name);
      if (fs.statSync(file).isFile() && /\.(?:mjs|js)$/.test(name)) scriptFiles.push(file);
    }
  }
  let syntaxOk = true;
  for (const file of scriptFiles) {
    const proc = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (proc.status !== 0) { syntaxOk = false; console.error(proc.stderr); }
  }
  result("JavaScript syntax", syntaxOk, `${scriptFiles.length} files`);

  const source = path.join(root, "fixtures/production-lock/source.svg");
  const contract = path.join(root, "fixtures/production-lock/contract.json");
  const profile = path.join(root, "profiles/web-svg-waapi.json");

  result("Safe SVG preflight", run("asset-preflight.mjs", [source, "--profile", profile, "--mode", "build", "--out", path.join(temp, "preflight.json")]).pass);
  result("Contract validation", run("validate-contract.mjs", [contract, "--profile", profile, "--out", path.join(temp, "contract-validation.json")]).pass);

  const normalized = path.join(temp, "normalized.svg");
  result("SVG normalization", run("svg-normalizer.mjs", [source, "--out", normalized, "--id-prefix", "self-test", "--report", path.join(temp, "normalize.json")]).pass);
  const normalizedText = fs.readFileSync(normalized, "utf8");
  result("Normalized root marker", /data-motion-icon/.test(normalizedText));
  result("Semantic parts preserved", /data-part="body"/.test(normalizedText) && /data-part="shackle"/.test(normalizedText));

  const idSvg = path.join(temp, "id-source.svg");
  fs.writeFileSync(idSvg, '<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs><path data-part="actor" fill="url(#g)" d="M0 0h1v1z"/></svg>\n');
  const idOut = path.join(temp, "id-normalized.svg");
  result("ID normalization command", run("svg-normalizer.mjs", [idSvg, "--out", idOut, "--id-prefix", "demo"]).pass);
  const idText = fs.readFileSync(idOut, "utf8");
  result("ID references rewritten", /id="demo-g"/.test(idText) && /url\(#demo-g\)/.test(idText));

  const unsafe = path.join(temp, "unsafe.svg");
  fs.writeFileSync(unsafe, '<svg viewBox="0 0 24 24"><script>alert(1)</script><path data-part="actor" d="M0 0"/></svg>\n');
  result("Unsafe SVG blocks", run("asset-preflight.mjs", [unsafe, "--profile", profile, "--mode", "build", "--out", path.join(temp, "unsafe.json")], 2).pass);
  const unsafeReport = readJson(path.join(temp, "unsafe.json"));
  result("Unsafe blocker recorded", unsafeReport.buildable === false && unsafeReport.errors.some(e => e.code === "SCRIPT_NOT_ALLOWED"));

  const outDir = path.join(temp, "package");
  result("Compiler", run("svg-waapi-compiler.mjs", ["--svg", normalized, "--contract", contract, "--profile", profile, "--out", outDir]).pass);
  const required = ["motion-icon.svg", "controller.js", "contract.json", "platform-profile.json", "manifest.json", "fixture.html", "compile-report.json", "README.md"];
  result("Package files", required.every(name => fs.existsSync(path.join(outDir, name))), required.join(", "));
  const manifest = readJson(path.join(outDir, "manifest.json"));
  result("Manifest starts unverified", manifest.verification?.status === "NOT_RUN");
  result("Manifest integrity", Boolean(manifest.integrity?.asset_sha256 && manifest.integrity?.contract_sha256 && manifest.integrity?.controller_sha256));

  const mismatch = structuredClone(readJson(contract));
  mismatch.geometry.actors.push("missing-part");
  mismatch.visual_states.locked.parts["missing-part"] = { opacity: 1 };
  mismatch.visual_states.unlocked.parts["missing-part"] = { opacity: 1 };
  const mismatchPath = path.join(temp, "mismatch.json");
  writeJson(mismatchPath, mismatch);
  result("Contract/asset mismatch blocks compiler", run("svg-waapi-compiler.mjs", ["--svg", normalized, "--contract", mismatchPath, "--profile", profile, "--out", path.join(temp, "mismatch-package")], 1).pass);

  const schema = readJson(path.join(root, "schemas/motion-icon-contract.schema.json"));
  result("Schema declares 2020-12", schema.$schema === "https://json-schema.org/draft/2020-12/schema");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} self-test(s) failed.`);
  process.exit(1);
}
console.log("\nPASS: RC2 static/build self-test suite");
