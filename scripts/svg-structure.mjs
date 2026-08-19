const PRIMITIVE_TAGS = new Set(["path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text"]);
const INERT_CONTAINERS = new Set(["defs", "clipPath", "mask", "linearGradient", "radialGradient", "pattern", "marker", "symbol"]);

function parseAttributes(source) {
  const attrs = {};
  const re = /([:\w-]+)\s*=\s*(["'])(.*?)\2/gs;
  for (const match of source.matchAll(re)) attrs[match[1]] = match[3];
  return attrs;
}

export function scanSvgStructure(source) {
  const stack = [];
  const primitives = [];
  const dataParts = [];
  const tokenRe = /<\/?\s*([A-Za-z][\w:-]*)\b([^>]*)>/g;
  for (const match of source.matchAll(tokenRe)) {
    const full = match[0];
    const tag = match[1];
    const lower = tag.toLowerCase();
    const closing = /^<\//.test(full);
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        const item = stack.pop();
        if (item.tag.toLowerCase() === lower) break;
      }
      continue;
    }

    const attrs = parseAttributes(match[2] ?? "");
    const ownPart = attrs["data-part"] ?? null;
    if (ownPart) dataParts.push(ownPart);
    const inheritedPart = [...stack].reverse().find(item => item.part)?.part ?? null;
    const part = ownPart ?? inheritedPart;
    const inert = stack.some(item => item.inert) || INERT_CONTAINERS.has(tag);
    if (PRIMITIVE_TAGS.has(tag) && !inert) {
      primitives.push({
        tag,
        part,
        id: attrs.id ?? null,
        fill: attrs.fill ?? null,
        stroke: attrs.stroke ?? null,
        opacity: attrs.opacity ?? null,
        snippet: full.slice(0, 260)
      });
    }

    if (!/\/>$/.test(full)) {
      stack.push({ tag, part: ownPart ?? inheritedPart, inert });
    }
  }

  const primitiveCountsByPart = {};
  for (const primitive of primitives) {
    const key = primitive.part ?? "__unowned__";
    primitiveCountsByPart[key] = (primitiveCountsByPart[key] ?? 0) + 1;
  }
  return {
    primitives,
    dataParts,
    unownedVisibleGeometry: primitives.filter(item => !item.part),
    primitiveCountsByPart
  };
}
