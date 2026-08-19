#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const args = new Set(process.argv.slice(2));
if (!args.has("--write") && !args.has("--check")) {
  console.log("Usage: node scripts/generate-case-catalog.mjs --write|--check");
  process.exit(1);
}
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const json = rel => JSON.parse(read(rel));
const evidence = json("evals/case-evidence.json");
const blind = json("evals/blind/blind-evals.json").cases;
const production = json("evals/production-evals.json").cases;
const trigger = json("evals/trigger-evals.json");
const goldenText = read("references/HMI-GOLDEN-SUITE.md");
const golden = [...goldenText.matchAll(/^##\s+(\d{2})\s+(.+)$/gm)].map(m => ({ id: `GOLDEN-${m[1]}`, title: m[2].trim() }));
const triggerIds = [
  ...trigger.positive.map((_, i) => `TRIGGER-P${String(i + 1).padStart(2, "0")}`),
  ...trigger.negative.map((_, i) => `TRIGGER-N${String(i + 1).padStart(2, "0")}`)
];
const ids = [
  ...evidence.cases.map(c => c.id),
  ...golden.map(c => c.id),
  ...blind.map(c => c.id),
  ...production.map(c => c.id),
  ...triggerIds
];
const uniqueIds = [...new Set(ids)];
const readme = read("README.md");
const missing = uniqueIds.filter(id => !readme.includes(`\`${id}\``));
const declaredMatch = readme.match(/README 列出 \*\*(\d+) 个命名案例\/路由样本\*\*/);
const declared = declaredMatch ? Number(declaredMatch[1]) : null;
const expected = uniqueIds.length;

const ledger = [
  "# Motion Icon Designer Case Ledger",
  "",
  `Release: ${evidence.release}`,
  "",
  `Named cases/routes: ${expected}`,
  "",
  ...uniqueIds.map(id => `- \`${id}\``),
  ""
].join("\n");

if (args.has("--write")) {
  fs.writeFileSync(path.join(root, "evals/CASE-LEDGER.md"), ledger);
  console.log(`PASS: wrote case ledger for ${expected} IDs. README is maintained as the human-readable evidence catalog.`);
  process.exit(0);
}

let ok = true;
if (missing.length) {
  console.error(`FAIL: README is missing ${missing.length} case ID(s): ${missing.join(", ")}`);
  ok = false;
}
if (declared !== expected) {
  console.error(`FAIL: README declares ${declared ?? "no"} cases but evidence sources contain ${expected}.`);
  ok = false;
}
if (!ok) process.exit(2);
console.log(`PASS: README covers all ${expected} named case/route IDs`);
