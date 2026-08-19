#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { readJson, validateContract, writeJson } from "./contract-lib.mjs";
import { scanSvgStructure } from "./svg-structure.mjs";

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log("Usage: node scripts/svg-waapi-compiler.mjs --svg normalized.svg --contract contract.json --profile profiles/web-svg-waapi.json --out production-package");
  process.exit(args.length ? 0 : 1);
}
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; }
function block(code, message, details = null, exitCode = 2) { console.error(JSON.stringify({ ok: false, status: "BUILD_BLOCKED", code, message, details })); process.exit(exitCode); }
const svgArg = option("--svg");
const contractArg = option("--contract");
const profileArg = option("--profile", "profiles/web-svg-waapi.json");
if (!svgArg) block("ASSET_REQUIRED", "--svg is required.");
if (!contractArg) block("NEEDS_PRODUCT_MODEL", "--contract is required before production compilation.");
const svgPath = path.resolve(svgArg);
const contractPath = path.resolve(contractArg);
const profilePath = path.resolve(profileArg);
const outDir = path.resolve(option("--out") ?? "production-package");
if (!fs.existsSync(svgPath) || !fs.statSync(svgPath).isFile()) block("ASSET_NOT_FOUND", `SVG not found: ${svgPath}`);
if (!fs.existsSync(contractPath) || !fs.statSync(contractPath).isFile()) block("CONTRACT_NOT_FOUND", `Contract not found: ${contractPath}`);
if (!fs.existsSync(profilePath) || !fs.statSync(profilePath).isFile()) block("PROFILE_NOT_FOUND", `Platform profile not found: ${profilePath}`);

const contract = readJson(contractPath);
const profile = readJson(profilePath);
const validation = validateContract(contract, { platformProfile: profile });
if (!validation.ok) block("CONTRACT_INVALID", "Contract validation failed.", validation.errors);

const svg = fs.readFileSync(svgPath, "utf8");
if (!/\bdata-motion-icon(?:\s|=|>)/i.test(svg)) throw new Error("Normalized SVG must have data-motion-icon on the root.");
const structure = scanSvgStructure(svg);
if (structure.unownedVisibleGeometry.length) block("UNOWNED_VISIBLE_GEOMETRY", "Renderable SVG primitives exist outside data-part ownership.", { count: structure.unownedVisibleGeometry.length, examples: structure.unownedVisibleGeometry.slice(0, 12) });
const parts = structure.dataParts;
const partSet = new Set(parts);
const requiredParts = new Set([...(contract.geometry.stable_parts ?? []), ...(contract.geometry.actors ?? []), ...Object.values(contract.visual_states ?? {}).flatMap(state => Object.keys(state.parts ?? {})), ...(contract.transitions ?? []).flatMap(t => (t.tracks ?? []).map(track => track.part))]);
const missingParts = [...requiredParts].filter(name => !partSet.has(name));
if (missingParts.length) block("CONTRACT_ASSET_PART_MISMATCH", "Contract requires semantic parts missing from the SVG.", missingParts);
const unexpectedParts = [...partSet].filter(name => !requiredParts.has(name));
if (unexpectedParts.length) block("UNDECLARED_SEMANTIC_PART", "SVG contains data-part names not declared by the contract.", unexpectedParts);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "screenshots"), { recursive: true });
fs.copyFileSync(svgPath, path.join(outDir, "motion-icon.svg"));
fs.copyFileSync(contractPath, path.join(outDir, "contract.json"));
fs.copyFileSync(profilePath, path.join(outDir, "platform-profile.json"));
const runtimeSource = fs.readFileSync(new URL("./runtime/svg-waapi-controller.js", import.meta.url), "utf8");
fs.writeFileSync(path.join(outDir, "controller.js"), runtimeSource);
const contractLiteral = JSON.stringify(contract).replace(/</g, "\\u003c");
const fixture = `<!doctype html>\n<meta charset="utf-8">\n<title>${contract.id} motion icon fixture</title>\n<style>\nhtml,body{margin:0;min-height:100%;font-family:system-ui,sans-serif}\nbody{display:grid;place-items:center;min-height:100vh;background:#fff;color:#111}\n[data-motion-icon]{width:96px;height:96px;overflow:visible}\n</style>\n<div id="mount">${svg}</div>\n<script src="./controller.js"></script>\n<script>\nwindow.__motionIconContract = ${contractLiteral};\nwindow.__motionIconTest = window.MotionIconRuntime.create(document.querySelector('[data-motion-icon]'), window.__motionIconContract);\n</script>\n`;
fs.writeFileSync(path.join(outDir, "fixture.html"), fixture);
const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const manifest = {
  schema: "motion-icon-production-package/v1", id: contract.id, version: contract.version, runtime: "svg-waapi", platform_profile: profile.id,
  files: { asset: "motion-icon.svg", controller: "controller.js", contract: "contract.json", profile: "platform-profile.json", fixture: "fixture.html", verification_report: "verify-report.json", verification_html: "verify-report.html", screenshots: "screenshots/" },
  integrity: { asset_sha256: sha(svg), contract_sha256: sha(fs.readFileSync(contractPath)), controller_sha256: sha(runtimeSource), profile_sha256: sha(fs.readFileSync(profilePath)), fixture_sha256: sha(fixture) },
  verification: { status: "NOT_RUN" }
};
writeJson(path.join(outDir, "manifest.json"), manifest);
const readme = `# ${contract.id} 量产动态图标包\n\n运行时：\`svg-waapi\`\n\n平台配置：\`${profile.id}\`\n\n## 集成\n\n1. 将 \`motion-icon.svg\` 内联到页面。\n2. 加载 \`controller.js\`。\n3. 使用 \`MotionIconRuntime.create(root, contract)\` 创建控制器。\n4. 业务层调用 \`setState(productState)\` 或 \`beginTransition(targetState)\`，不要直接请求动画片段。\n\n## 验证\n\n在仓库根目录运行：\n\n\`\`\`bash\nnode scripts/verify-motion-icon.mjs <package-directory> --out <package-directory>\n\`\`\`\n\n只有 \`manifest.json > verification.status\` 为 \`PASS\` 时才应进入集成候选。\n`;
fs.writeFileSync(path.join(outDir, "README.md"), readme);
writeJson(path.join(outDir, "compile-report.json"), { ok: true, contract_validation: validation, parts, required_parts: [...requiredParts], manifest });
console.log(`PASS: compiled production package -> ${outDir}`);
