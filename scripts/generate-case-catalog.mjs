#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
const checkMode = args.has("--check");
if (!writeMode && !checkMode) {
  console.log("Usage: node scripts/generate-case-catalog.mjs --write|--check");
  process.exit(1);
}

const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const json = rel => JSON.parse(read(rel));
const esc = value => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const code = value => `\`${String(value).replace(/`/g, "\\`")}\``;

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(esc).join(" | ")} |`)
  ].join("\n");
}

function parseGolden() {
  const text = read("references/HMI-GOLDEN-SUITE.md");
  const matches = [...text.matchAll(/^##\s+(\d{2})\s+(.+)$/gm)];
  return matches.map((m, i) => {
    const start = m.index + m[0].length;
    const end = matches[i + 1]?.index ?? text.indexOf("## Production-use note");
    const body = text.slice(start, end > start ? end : text.length).trim();
    const compact = body.split(/\n+/).map(x => x.trim()).filter(Boolean).join("; ");
    return { id: `GOLDEN-${m[1]}`, title: m[2].trim(), detail: compact };
  });
}

const evidence = json("evals/case-evidence.json");
const blind = json("evals/blind/blind-evals.json").cases;
const production = json("evals/production-evals.json").cases;
const trigger = json("evals/trigger-evals.json");
const golden = parseGolden();

const evidenceGroups = {
  executable: evidence.cases.filter(c => c.category === "executable"),
  adversarial: evidence.cases.filter(c => c.category === "adversarial"),
  realSvg: evidence.cases.filter(c => c.category === "real-svg"),
  historical: evidence.cases.filter(c => c.category === "historical")
};

const namedRows = evidenceGroups.executable.length + evidenceGroups.adversarial.length + evidenceGroups.realSvg.length + golden.length + blind.length + production.length + trigger.positive.length + trigger.negative.length;
const ciRows = evidence.cases.filter(c => c.evidence === "ci-reproducible").length;
const observedRows = evidence.cases.filter(c => c.evidence === "observed-session").length;

const parts = [];
parts.push(`## 案例与测试证据（自动生成）`);
parts.push(`> 本节由 ${code("scripts/generate-case-catalog.mjs")} 从仓库中的案例源自动生成。不要手工维护表格；新增案例后运行 ${code("npm run docs:cases")}。${code("npm run test:docs")} 会在 README 漏案例或版本漂移时失败。`);
parts.push(``);
parts.push(`当前目录列出 **${namedRows} 个命名案例/路由样本**：其中 ${ciRows} 个有仓库内可复现执行证据，${observedRows} 个来自本轮真实 SVG 盲测观察；另保留 RC2 的 46-case 历史 qualification 汇总。语义参考/Prompt Eval/Trigger Eval 不等同于 runtime PASS。`);
parts.push(``);
parts.push(`用户上传的真实 SVG 只以匿名 Sample A–H 和统计结果记录，原始文件不进入公开仓库或 Skill 包。`);

function evidenceTable(items) {
  return table(["ID", "案例", "输入 / 条件", "预期", "实际结果", "证据", "状态"], items.map(c => [code(c.id), c.title, c.input, c.expected, c.actual, `${c.evidence}<br>${code(c.source)}`, code(c.status)]));
}

parts.push(`\n### A. 可执行正向案例`);
parts.push(evidenceTable(evidenceGroups.executable));
parts.push(`\n### B. Adversarial / Fail-closed 案例`);
parts.push(evidenceTable(evidenceGroups.adversarial));
parts.push(`\n### C. 真实 SVG 盲测（匿名）`);
parts.push(`这些案例用于验证“只给原始设计稿、没有 product model / semantic annotation”时是否安全停机，而不是验证动效美学。`);
parts.push(evidenceTable(evidenceGroups.realSvg));

parts.push(`\n### D. HMI Golden 语义案例`);
parts.push(`Golden cases 用于证明语义推理，不是可复制 keyframe，也不是 runtime release evidence。`);
parts.push(table(["ID", "案例", "核心语义/约束", "证据等级"], golden.map(c => [code(c.id), c.title, c.detail, "semantic-reference"])));

parts.push(`\n### E. Blind 语义案例`);
parts.push(table(["ID", "案例", "Prompt", "用途"], blind.map(c => [code(c.id), c.name, c.prompt, "unseen semantic reasoning; not runtime proof"])));

parts.push(`\n### F. Production Prompt Evals`);
parts.push(table(["ID", "Prompt", "预期行为"], production.map(c => [code(c.id), c.prompt, c.expect])));

parts.push(`\n### G. Trigger Evals`);
const triggerRows = [
  ...trigger.positive.map((prompt, i) => [code(`TRIGGER-P${String(i + 1).padStart(2, "0")}`), prompt, "应触发 design-motion-icons"]),
  ...trigger.negative.map((prompt, i) => [code(`TRIGGER-N${String(i + 1).padStart(2, "0")}`), prompt, "不应触发 design-motion-icons"])
];
parts.push(table(["ID", "输入", "预期路由"], triggerRows));

parts.push(`\n### H. 历史 Qualification 证据`);
parts.push(evidenceTable(evidenceGroups.historical));
parts.push(``);
parts.push(`历史 RC2 报告只保存了 46 个 case 的分组计数，没有保存全部逐 case 名称；README 只记录现有证据，不补造不存在的 case 名称。`);

const generated = parts.join("\n\n").trim() + "\n";
const start = "<!-- CASE_CATALOG:START -->";
const end = "<!-- CASE_CATALOG:END -->";
const readmePath = path.join(root, "README.md");
let readme = fs.readFileSync(readmePath, "utf8");
if (!readme.includes(start) || !readme.includes(end)) {
  console.error("README case catalog markers are missing.");
  process.exit(2);
}
const replaceSection = input => input.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${generated}${end}`);
const expectedReadme = replaceSection(readme);
const ledgerPath = path.join(root, "evals/CASE-LEDGER.md");
const expectedLedger = `# Motion Icon Designer Case Ledger\n\nRelease: ${evidence.release}\n\n${generated}`;

if (writeMode) {
  fs.writeFileSync(readmePath, expectedReadme);
  fs.writeFileSync(ledgerPath, expectedLedger);
  console.log(`PASS: generated ${namedRows} named case rows into README and evals/CASE-LEDGER.md`);
  process.exit(0);
}

let ok = true;
if (readme !== expectedReadme) {
  console.error("FAIL: README case catalog is out of date. Run npm run docs:cases.");
  ok = false;
}
const currentLedger = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : "";
if (currentLedger !== expectedLedger) {
  console.error("FAIL: evals/CASE-LEDGER.md is out of date. Run npm run docs:cases.");
  ok = false;
}
if (!ok) process.exit(2);
console.log(`PASS: README case catalog is synchronized (${namedRows} named rows)`);
