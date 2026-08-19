#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { readJson, writeJson } from "./contract-lib.mjs";
import { scanSvgStructure } from "./svg-structure.mjs";

const args = process.argv.slice(2);
const input = args[0];
if (!input || args.includes("--help")) {
  console.log("Usage: node scripts/asset-preflight.mjs <icon.svg> [--profile profiles/web-svg-waapi.json] [--mode intake|build] [--out preflight.json]");
  process.exit(input ? 0 : 1);
}

function option(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const inputPath = path.resolve(input);
const profilePath = path.resolve(option("--profile", "profiles/web-svg-waapi.json"));
const mode = option("--mode", "intake");
const outPath = option("--out");
if (!["intake", "build"].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
if (!fs.existsSync(inputPath)) {
  console.error(`SVG not found: ${inputPath}`);
  process.exit(1);
}

const profile = readJson(profilePath);
const source = fs.readFileSync(inputPath, "utf8");
const errors = [];
const warnings = [];
const info = [];
const block = (code, message, details = null) => errors.push({ code, message, details });
const warn = (code, message, details = null) => warnings.push({ code, message, details });

if (Buffer.byteLength(source, "utf8") > (profile.max_asset_bytes ?? Infinity)) {
  block("ASSET_TOO_LARGE", `Asset exceeds ${profile.max_asset_bytes} bytes.`);
}
if (/<!DOCTYPE/i.test(source) || /<!ENTITY/i.test(source)) block("XML_ENTITY_NOT_ALLOWED", "DOCTYPE/ENTITY declarations are not allowed.");
const rootMatch = source.match(/<svg\b([^>]*)>/i);
if (!rootMatch) block("SVG_ROOT_MISSING", "A root <svg> element is required.");

let viewBox = null;
if (rootMatch) {
  const attrs = rootMatch[1];
  const vb = attrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  viewBox = vb?.[1]?.trim() ?? null;
  if (profile.require_view_box && !viewBox) block("VIEWBOX_MISSING", "A numeric viewBox is required.");
  if (viewBox) {
    const nums = viewBox.split(/[ ,]+/).filter(Boolean).map(Number);
    if (nums.length !== 4 || nums.some(v => !Number.isFinite(v)) || nums[2] <= 0 || nums[3] <= 0) block("VIEWBOX_INVALID", "viewBox must contain four finite numbers with positive width and height.");
  }
  if (profile.allow_root_transform === false && /\btransform\s*=/.test(attrs)) block("ROOT_TRANSFORM_BLOCKED", "Root SVG transform is not allowed by the platform profile.");
}

const tags = [...source.matchAll(/<\/?\s*([A-Za-z][\w:-]*)\b/g)].map(m => m[1]);
const uniqueTags = [...new Set(tags)];
const blockedTags = new Set((profile.blocked_svg_elements ?? []).map(x => x.toLowerCase()));
for (const tag of uniqueTags) {
  if (blockedTags.has(tag.toLowerCase())) block("BLOCKED_SVG_ELEMENT", `Element <${tag}> is blocked by the platform profile.`, { tag });
}
if (Array.isArray(profile.allowed_svg_elements)) {
  const allowed = new Set(profile.allowed_svg_elements.map(x => x.toLowerCase()));
  for (const tag of uniqueTags) {
    if (!allowed.has(tag.toLowerCase()) && !blockedTags.has(tag.toLowerCase())) warn("UNLISTED_SVG_ELEMENT", `Element <${tag}> is not in the tested allowlist.`, { tag });
  }
}

if (profile.allow_inline_event_handlers === false && /\son[a-z]+\s*=/i.test(source)) block("INLINE_EVENT_HANDLER", "Inline SVG event handlers are not allowed.");
if (/<script\b/i.test(source)) block("SCRIPT_NOT_ALLOWED", "SVG scripts are not allowed.");

const hrefs = [...source.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
const externalHrefs = hrefs.filter(v => !v.startsWith("#") && !v.startsWith("data:"));
if (profile.allow_external_references === false && externalHrefs.length) block("EXTERNAL_REFERENCE", "External href references are not allowed.", externalHrefs);
const urls = [...source.matchAll(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi)].map(m => m[2]);
const externalUrls = urls.filter(v => !v.startsWith("#"));
if (profile.allow_external_references === false && externalUrls.length) block("EXTERNAL_URL", "External url() references are not allowed.", externalUrls);

const ids = [...source.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
const idCounts = ids.reduce((acc, id) => acc.set(id, (acc.get(id) ?? 0) + 1), new Map());
const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
if (duplicateIds.length) block("DUPLICATE_ID", "Duplicate SVG IDs are not allowed.", duplicateIds);

const structure = scanSvgStructure(source);
const dataParts = structure.dataParts;
const duplicateParts = [...new Set(dataParts.filter((p, i) => dataParts.indexOf(p) !== i))];
if (duplicateParts.length) block("DUPLICATE_DATA_PART", "data-part names must be unique within one icon.", duplicateParts);
if (mode === "build" && profile.require_semantic_parts_for_build && dataParts.length === 0) block("SEMANTIC_PARTS_REQUIRED", "Build mode requires at least one data-part annotation.");
if (mode === "intake" && dataParts.length === 0) warn("SEMANTIC_ANNOTATION_REQUIRED", "No data-part annotations found; semantic actors must be identified before compilation.");
if (mode === "build" && structure.unownedVisibleGeometry.length) {
  block(
    "UNOWNED_VISIBLE_GEOMETRY",
    "Every renderable SVG primitive must belong to a data-part before production compilation.",
    { count: structure.unownedVisibleGeometry.length, examples: structure.unownedVisibleGeometry.slice(0, 12) }
  );
}

const referencedIds = new Set();
for (const value of [...hrefs, ...urls]) if (value.startsWith("#")) referencedIds.add(value.slice(1));
const missingRefs = [...referencedIds].filter(id => !idCounts.has(id));
if (missingRefs.length) block("BROKEN_INTERNAL_REFERENCE", "Internal references point to missing IDs.", missingRefs);

const hash = crypto.createHash("sha256").update(source).digest("hex");
info.push({ code: "SOURCE_SHA256", value: hash });
const report = {
  schema: "motion-icon-asset-preflight/v1",
  input: inputPath,
  mode,
  profile: profile.id,
  status: errors.length ? "blocked" : warnings.length ? "buildable-with-warnings" : "buildable",
  buildable: errors.length === 0,
  normalization_required: !/\bdata-motion-icon(?:\s|=|>)/i.test(rootMatch?.[0] ?? "") || ids.length > 0,
  summary: {
    bytes: Buffer.byteLength(source, "utf8"),
    viewBox,
    elements: uniqueTags,
    ids,
    data_parts: dataParts,
    primitive_counts_by_part: structure.primitiveCountsByPart,
    unowned_visible_geometry: structure.unownedVisibleGeometry.length
  },
  errors,
  warnings,
  info
};

if (outPath) writeJson(path.resolve(outPath), report);
console.log(`${report.buildable ? "PASS" : "BLOCKED"}: SVG preflight (${report.status})`);
for (const item of errors) console.error(`ERROR ${item.code}: ${item.message}`);
for (const item of warnings) console.warn(`WARN ${item.code}: ${item.message}`);
if (!report.buildable) process.exit(2);
