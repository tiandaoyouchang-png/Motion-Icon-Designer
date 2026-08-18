#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { writeJson } from "./contract-lib.mjs";

const args = process.argv.slice(2);
const input = args[0];
if (!input || args.includes("--help")) {
  console.log("Usage: node scripts/svg-normalizer.mjs <icon.svg> --out normalized.svg [--id-prefix icon-id] [--report normalize-report.json]");
  process.exit(input ? 0 : 1);
}
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; }
const inputPath = path.resolve(input);
const outOpt = option("--out");
if (!outOpt) throw new Error("--out is required");
const outputPath = path.resolve(outOpt);
const reportPath = option("--report");
let source = fs.readFileSync(inputPath, "utf8");
const originalHash = crypto.createHash("sha256").update(source).digest("hex");

if (!/<svg\b/i.test(source)) throw new Error("SVG root missing");
if (/<!DOCTYPE/i.test(source) || /<!ENTITY/i.test(source) || /<script\b/i.test(source) || /\son[a-z]+\s*=/i.test(source)) throw new Error("Unsafe SVG features detected. Run asset-preflight first.");

let prefix = option("--id-prefix");
if (!prefix) prefix = `mi-${path.basename(inputPath, path.extname(inputPath)).replace(/[^A-Za-z0-9_-]+/g, "-")}`;
prefix = prefix.replace(/[^A-Za-z0-9_-]+/g, "-");
if (!/^[A-Za-z]/.test(prefix)) prefix = `mi-${prefix}`;

const ids = [...source.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
const uniqueIds = [...new Set(ids)];
const idMap = Object.fromEntries(uniqueIds.map(id => [id, `${prefix}-${id}`]));
for (const [oldId, newId] of Object.entries(idMap)) {
  const esc = oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  source = source.replace(new RegExp(`(\\bid\\s*=\\s*["'])${esc}(["'])`, "g"), `$1${newId}$2`);
  source = source.replace(new RegExp(`(url\\(\\s*["']?#)${esc}(["']?\\s*\\))`, "g"), `$1${newId}$2`);
  source = source.replace(new RegExp(`((?:xlink:)?href\\s*=\\s*["']#)${esc}(["'])`, "g"), `$1${newId}$2`);
}

source = source.replace(/<svg\b([^>]*)>/i, (full, attrs) => {
  let next = attrs;
  if (!/\bxmlns\s*=/.test(next)) next += ' xmlns="http://www.w3.org/2000/svg"';
  if (!/\bdata-motion-icon(?:\s|=|$)/.test(next)) next += ' data-motion-icon=""';
  return `<svg${next}>`;
});
source = source.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim() + "\n";
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, source);
const normalizedHash = crypto.createHash("sha256").update(source).digest("hex");
const report = { schema: "motion-icon-svg-normalizer/v1", input: inputPath, output: outputPath, original_sha256: originalHash, normalized_sha256: normalizedHash, id_prefix: prefix, rewritten_ids: idMap, data_parts: [...source.matchAll(/\bdata-part\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]) };
if (reportPath) writeJson(path.resolve(reportPath), report);
console.log(`PASS: normalized SVG -> ${outputPath}`);
