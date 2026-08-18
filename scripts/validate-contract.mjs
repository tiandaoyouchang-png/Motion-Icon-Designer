#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { readJson, validateContract, writeJson } from "./contract-lib.mjs";

const args = process.argv.slice(2);
const contractPath = args[0];
if (!contractPath || args.includes("--help")) {
  console.log("Usage: node scripts/validate-contract.mjs <contract.json> [--profile profiles/web-svg-waapi.json] [--out report.json]");
  process.exit(contractPath ? 0 : 1);
}
const profileIndex = args.indexOf("--profile");
const outIndex = args.indexOf("--out");
const profile = profileIndex >= 0 && args[profileIndex + 1] ? readJson(path.resolve(args[profileIndex + 1])) : null;
const contract = readJson(path.resolve(contractPath));
const report = validateContract(contract, { platformProfile: profile });
if (outIndex >= 0 && args[outIndex + 1]) writeJson(path.resolve(args[outIndex + 1]), report);
console.log(report.ok ? "PASS: contract valid" : "FAIL: contract invalid");
for (const item of report.errors) console.error(`ERROR ${item.code}: ${item.message}`);
for (const item of report.warnings) console.warn(`WARN ${item.code}: ${item.message}`);
if (!report.ok) process.exit(1);
