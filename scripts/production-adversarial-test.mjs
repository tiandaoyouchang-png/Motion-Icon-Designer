#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./contract-lib.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "motion-icon-adversarial-"));
const profile = path.join(root, "profiles/web-svg-waapi.json");
const contract = path.join(root, "fixtures/production-lock/contract.json");
let failures = 0;

function result(name, pass, details = "") {
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${details ? ` — ${details}` : ""}`);
  if (!pass) failures += 1;
}

function run(script, args = []) {
  return spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

try {
  const guideLeak = path.join(temp, "guide-leak.svg");
  const guideReport = path.join(temp, "guide-report.json");
  fs.writeFileSync(guideLeak, `<svg viewBox="0 0 24 24">
  <path data-part="glyph" d="M5 12h14" stroke="#111" stroke-width="2"/>
  <rect x="1" y="1" width="22" height="22" fill="none" stroke="#f00" stroke-width=".1"/>
</svg>\n`);
  const guideProc = run("asset-preflight.mjs", [guideLeak, "--profile", profile, "--mode", "build", "--out", guideReport]);
  const guideData = readJson(guideReport);
  result(
    "Guide/unowned geometry is a hard blocker",
    guideProc.status === 2 && guideData.errors.some(item => item.code === "UNOWNED_VISIBLE_GEOMETRY"),
    `exit=${guideProc.status}`
  );

  const emptySource = path.join(temp, "empty-actor.svg");
  fs.writeFileSync(emptySource, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect data-part="body" x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="#111" stroke-width="2"/>
  <path data-part="shackle" fill="none" stroke="#111" stroke-width="2"/>
</svg>\n`);
  const emptyOut = path.join(temp, "empty-package");
  const emptyProc = run("build-motion-icon.mjs", ["--svg", emptySource, "--contract", contract, "--profile", profile, "--out", emptyOut]);
  const verifyPath = path.join(emptyOut, "verify-report.json");
  const manifestPath = path.join(emptyOut, "manifest.json");
  const verify = fs.existsSync(verifyPath) ? readJson(verifyPath) : null;
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
  result(
    "Empty semantic actor fails browser verification",
    emptyProc.status !== 0 && verify?.ok === false && verify.errors.some(item => item === "GEOMETRY/semantic-part-shackle-nonzero"),
    `exit=${emptyProc.status}`
  );
  result(
    "Failed renderability cannot produce PASS manifest",
    manifest?.verification?.status === "FAIL",
    `status=${manifest?.verification?.status ?? "missing"}`
  );

  const completeContract = structuredClone(readJson(contract));
  completeContract.id = "production-lock-complete";
  completeContract.version = "1.0.0-rc3";
  completeContract.behavior.interrupt_policy = "complete";
  completeContract.implementation.asset_id_prefix = "production-lock-complete";
  const completeContractPath = path.join(temp, "complete-contract.json");
  writeJson(completeContractPath, completeContract);
  const completeOut = path.join(temp, "complete-package");
  const completeProc = run("build-motion-icon.mjs", ["--svg", path.join(root, "fixtures/production-lock/source.svg"), "--contract", completeContractPath, "--profile", profile, "--out", completeOut]);
  const completeVerify = fs.existsSync(path.join(completeOut, "verify-report.json")) ? readJson(path.join(completeOut, "verify-report.json")) : null;
  result(
    "COMPLETE settles queued latest target",
    completeProc.status === 0 && completeVerify?.interactions?.every(item => item.pass),
    `exit=${completeProc.status}`
  );

  const integrityOut = path.join(temp, "integrity-package");
  const integrityBuild = run("build-motion-icon.mjs", ["--svg", path.join(root, "fixtures/production-lock/source.svg"), "--contract", contract, "--profile", profile, "--out", integrityOut, "--skip-verify"]);
  if (integrityBuild.status === 0) fs.appendFileSync(path.join(integrityOut, "controller.js"), "\n// mutation attack\n");
  const integrityVerifyProc = integrityBuild.status === 0 ? run("verify-motion-icon.mjs", [integrityOut, "--out", integrityOut]) : integrityBuild;
  const integrityVerify = fs.existsSync(path.join(integrityOut, "verify-report.json")) ? readJson(path.join(integrityOut, "verify-report.json")) : null;
  const integrityManifest = fs.existsSync(path.join(integrityOut, "manifest.json")) ? readJson(path.join(integrityOut, "manifest.json")) : null;
  result(
    "Integrity mutation is detected",
    integrityVerifyProc.status !== 0 && integrityVerify?.errors?.includes("INTEGRITY/controller_sha256"),
    `exit=${integrityVerifyProc.status}`
  );
  result(
    "Integrity failure invalidates manifest PASS",
    integrityManifest?.verification?.status === "FAIL",
    `status=${integrityManifest?.verification?.status ?? "missing"}`
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} production adversarial test(s) failed.`);
  process.exit(1);
}
console.log("\nPASS: production adversarial regression suite");
