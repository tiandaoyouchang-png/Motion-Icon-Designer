export async function staticChecks(page, { contract = null, profile = null, check, finiteRect }) {
  const dom = await page.evaluate(() => {
    const roots = [...document.querySelectorAll("[data-motion-icon]")];
    const root = roots[0];
    const primitiveSelector = "path,rect,circle,ellipse,line,polyline,polygon,text";
    const inertSelector = "defs,clipPath,mask,linearGradient,radialGradient,pattern,marker,symbol";

    function safeBBox(el) {
      try {
        if (typeof el.getBBox !== "function") return null;
        const box = el.getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      } catch {
        return null;
      }
    }

    function primitiveMetric(el) {
      const bbox = safeBBox(el);
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      let cssVisible = style.display !== "none" && !["hidden", "collapse"].includes(style.visibility) && Number.parseFloat(style.opacity || "1") > 0.01;
      if (typeof el.checkVisibility === "function") {
        try { cssVisible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch (_) {}
      }
      const fillOpacity = Number.parseFloat(style.fillOpacity || "1");
      const strokeOpacity = Number.parseFloat(style.strokeOpacity || "1");
      const strokeWidth = Number.parseFloat(style.strokeWidth || "0");
      const hasPaint = (style.fill !== "none" && fillOpacity > 0.01) || (style.stroke !== "none" && strokeOpacity > 0.01 && strokeWidth > 0);
      const extent = Math.max(bbox?.width ?? 0, bbox?.height ?? 0, rect.width ?? 0, rect.height ?? 0);
      return {
        tag: el.tagName,
        bbox,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        extent,
        nonzeroGeometry: Number.isFinite(extent) && extent > 0.01,
        cssVisible,
        hasPaint,
        paintable: Number.isFinite(extent) && extent > 0.01 && cssVisible && hasPaint
      };
    }

    function ownerMetrics(owner) {
      const name = owner.getAttribute("data-part");
      const candidates = [];
      if (owner.matches(primitiveSelector) && !owner.closest(inertSelector)) candidates.push(owner);
      for (const el of owner.querySelectorAll(primitiveSelector)) {
        if (el.closest(inertSelector)) continue;
        if (el.closest("[data-part]") !== owner) continue;
        candidates.push(el);
      }
      const primitives = candidates.map(primitiveMetric);
      return {
        name,
        primitiveCount: primitives.length,
        nonzeroGeometry: primitives.some(item => item.nonzeroGeometry),
        paintable: primitives.some(item => item.paintable),
        primitives
      };
    }

    const ids = root ? [...root.querySelectorAll("[id]")].map(el => el.id) : [];
    const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    const hrefs = root ? [...root.querySelectorAll("[href],[xlink\\:href]")].map(el => el.getAttribute("href") || el.getAttribute("xlink:href")).filter(Boolean) : [];
    const external = hrefs.filter(v => !v.startsWith("#") && !v.startsWith("data:"));
    const partElements = root ? [...root.querySelectorAll("[data-part]")] : [];
    const parts = partElements.map(el => el.getAttribute("data-part"));
    const partMetrics = Object.fromEntries(partElements.map(el => [el.getAttribute("data-part"), ownerMetrics(el)]));
    const unownedVisibleGeometry = root ? [...root.querySelectorAll(primitiveSelector)]
      .filter(el => !el.closest(inertSelector) && !el.closest("[data-part]"))
      .map(el => ({ tag: el.tagName, id: el.id || null, outerHTML: el.outerHTML.slice(0, 220) })) : [];
    const rect = root?.getBoundingClientRect();
    return {
      rootCount: roots.length,
      ids,
      duplicates,
      external,
      parts,
      partMetrics,
      unownedVisibleGeometry,
      viewBox: root?.getAttribute("viewBox"),
      rootTransform: root?.getAttribute("transform"),
      rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
    };
  });
  check("DOM", "single-root", dom.rootCount === 1, dom.rootCount);
  check("DOM", "duplicate-ids", dom.duplicates.length === 0, dom.duplicates);
  check("DOM", "external-references", dom.external.length === 0, dom.external);
  check("DOM", "root-transform", !dom.rootTransform, dom.rootTransform);
  check("DOM", "finite-root-bounds", finiteRect(dom.rect), dom.rect);
  if (contract) check("DOM", "unowned-visible-geometry", dom.unownedVisibleGeometry.length === 0, dom.unownedVisibleGeometry);
  if (profile?.require_view_box) check("DOM", "viewBox-present", Boolean(dom.viewBox), dom.viewBox);
  if (contract) {
    const required = [...new Set([...(contract.geometry.stable_parts ?? []), ...(contract.geometry.actors ?? []), ...Object.values(contract.visual_states ?? {}).flatMap(s => Object.keys(s.parts ?? {})), ...(contract.transitions ?? []).flatMap(t => (t.tracks ?? []).map(track => track.part))])];
    const missing = required.filter(name => !dom.parts.includes(name));
    const undeclared = dom.parts.filter(name => !required.includes(name));
    check("CONTRACT", "semantic-parts-present", missing.length === 0, { required, missing });
    check("CONTRACT", "no-undeclared-semantic-parts", undeclared.length === 0, { required, undeclared });
    for (const name of required) {
      const metric = dom.partMetrics[name];
      check("GEOMETRY", `semantic-part-${name}-nonzero`, Boolean(metric?.nonzeroGeometry), metric ?? null);
    }
  }
  return dom;
}

export async function auditSemanticPartVisibility(page, { contract = null, check }) {
  if (!contract) return;
  const required = [...new Set([...(contract.geometry.stable_parts ?? []), ...(contract.geometry.actors ?? []), ...Object.values(contract.visual_states ?? {}).flatMap(s => Object.keys(s.parts ?? {})), ...(contract.transitions ?? []).flatMap(t => (t.tracks ?? []).map(track => track.part))])];
  const observations = Object.fromEntries(required.map(name => [name, []]));

  for (const state of contract.state.allowed ?? []) {
    const metrics = await page.evaluate(async ({ stateValue, requiredParts }) => {
      const api = window.__motionIconTest;
      await api.setReducedMotion?.(false);
      await api.setState?.(stateValue);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const primitiveSelector = "path,rect,circle,ellipse,line,polyline,polygon,text";
      const inertSelector = "defs,clipPath,mask,linearGradient,radialGradient,pattern,marker,symbol";

      function primitivePaintable(el) {
        let bbox = null;
        try {
          if (typeof el.getBBox === "function") {
            const raw = el.getBBox();
            bbox = { x: raw.x, y: raw.y, width: raw.width, height: raw.height };
          }
        } catch (_) {}
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        let cssVisible = style.display !== "none" && !["hidden", "collapse"].includes(style.visibility) && Number.parseFloat(style.opacity || "1") > 0.01;
        if (typeof el.checkVisibility === "function") {
          try { cssVisible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch (_) {}
        }
        const fillOpacity = Number.parseFloat(style.fillOpacity || "1");
        const strokeOpacity = Number.parseFloat(style.strokeOpacity || "1");
        const strokeWidth = Number.parseFloat(style.strokeWidth || "0");
        const hasPaint = (style.fill !== "none" && fillOpacity > 0.01) || (style.stroke !== "none" && strokeOpacity > 0.01 && strokeWidth > 0);
        const extent = Math.max(bbox?.width ?? 0, bbox?.height ?? 0, rect.width ?? 0, rect.height ?? 0);
        return Number.isFinite(extent) && extent > 0.01 && cssVisible && hasPaint;
      }

      const result = {};
      for (const name of requiredParts) {
        const owner = [...document.querySelectorAll("[data-part]")].find(el => el.getAttribute("data-part") === name);
        if (!owner) {
          result[name] = { exists: false, paintable: false, primitiveCount: 0 };
          continue;
        }
        const candidates = [];
        if (owner.matches(primitiveSelector) && !owner.closest(inertSelector)) candidates.push(owner);
        for (const el of owner.querySelectorAll(primitiveSelector)) {
          if (el.closest(inertSelector)) continue;
          if (el.closest("[data-part]") !== owner) continue;
          candidates.push(el);
        }
        result[name] = {
          exists: true,
          primitiveCount: candidates.length,
          paintable: candidates.some(primitivePaintable)
        };
      }
      return result;
    }, { stateValue: state, requiredParts: required });

    for (const name of required) observations[name].push({ state, ...metrics[name] });
  }

  for (const name of required) {
    const visibleStates = observations[name].filter(item => item.paintable).map(item => item.state);
    check("VISUAL", `semantic-part-${name}-visible-in-some-state`, visibleStates.length > 0, { visibleStates, observations: observations[name] });
  }
}
