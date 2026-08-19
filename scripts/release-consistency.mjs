#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));
const pkg = JSON.parse(read("package.json"));
const evidence = JSON.parse(read("evals/case-evidence.json"));
const readme = read("README.md");
const gate = read("evals/RELEASE-GATE.md");
const skill = read("SKILL.md");
let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

check("Case evidence release matches package", evidence.release === pkg.version, `${evidence.release} vs ${pkg.version}`);
check("README declares package version", readme.includes(pkg.version), pkg.version);
check("Release Gate declares package version", gate.includes(pkg.version), pkg.version);
check("RC4 workflow exists", exists(".github/workflows/rc4-production-gate.yml"));
check("Old RC3 workflow removed", !exists(".github/workflows/rc3-production-gate.yml"));
const workflow = exists(".github/workflows/rc4-production-gate.yml") ? read(".github/workflows/rc4-production-gate.yml") : "";
check("Workflow runs real production command", workflow.includes("npm run test:production"));

for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
  for (const m of command.matchAll(/node\s+(scripts\/[A-Za-z0-9._/-]+\.(?:mjs|js))/g)) {
    check(`npm script ${name} target exists`, exists(m[1]), m[1]);
  }
  for (const m of command.matchAll(/npm\s+run\s+([A-Za-z0-9:_-]+)/g)) {
    check(`npm script ${name} references existing script`, Boolean(pkg.scripts[m[1]]), m[1]);
  }
}

const referenced = [...skill.matchAll(/`((?:references|scripts|evals|profiles|schemas)\/[A-Za-z0-9._/-]+)`/g)].map(m => m[1]);
for (const rel of [...new Set(referenced)]) check("SKILL referenced resource exists", exists(rel), rel);

for (const c of evidence.cases) {
  if (["ci-reproducible", "historical-summary"].includes(c.evidence) && /^(?:scripts|fixtures|evals|references)\//.test(c.source)) {
    check(`Case ${c.id} evidence source exists`, exists(c.source), c.source);
  }
}

if (failures) {
  console.error(`\n${failures} release consistency check(s) failed.`);
  process.exit(1);
}
console.log("\nPASS: release metadata and resource references are consistent");
