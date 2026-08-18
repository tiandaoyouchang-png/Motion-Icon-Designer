(function (global) {
  "use strict";

  const ANIMATABLE_PROPS = ["opacity", "transform", "strokeDasharray", "strokeDashoffset", "fill", "stroke"];
  function sameState(a, b) { return typeof a === typeof b && a === b; }
  function stateAllowed(contract, value) { return contract.state.allowed.some(item => sameState(item, value)); }
  function part(root, name) { return root.querySelector(`[data-part="${CSS.escape(name)}"]`); }
  function styleSnapshot(element) {
    const style = global.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { opacity: style.opacity, transform: style.transform === "none" ? "none" : style.transform, transformOrigin: style.transformOrigin, strokeDasharray: style.strokeDasharray, strokeDashoffset: style.strokeDashoffset, fill: style.fill, stroke: style.stroke, bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
  }
  function normalizeStyleValue(prop, value) { if (value === undefined || value === null) return undefined; return String(value); }
  function applyPartStyle(element, values) {
    if (!element || !values) return;
    for (const [prop, raw] of Object.entries(values)) {
      if (raw === undefined || raw === null) continue;
      if (prop === "transformOrigin") element.style.transformOrigin = String(raw);
      else if (ANIMATABLE_PROPS.includes(prop)) element.style[prop] = normalizeStyleValue(prop, raw);
    }
  }
  function applyVisualState(root, contract, value) {
    const def = contract.visual_states[String(value)];
    if (!def) throw new Error(`No visual state for ${String(value)}`);
    for (const [name, values] of Object.entries(def.parts || {})) {
      const element = part(root, name);
      if (!element) throw new Error(`Missing data-part ${name}`);
      applyPartStyle(element, values);
    }
  }
  function findTransition(contract, from, to) { return (contract.transitions || []).find(item => sameState(item.from, from) && sameState(item.to, to)) || null; }
  function computedFirstFrame(element, templateFrame) {
    const computed = styleSnapshot(element);
    const frame = { offset: 0 };
    for (const prop of ANIMATABLE_PROPS) if (Object.prototype.hasOwnProperty.call(templateFrame, prop)) frame[prop] = computed[prop];
    return frame;
  }
  function cleanFrame(frame) { const result = {}; for (const [key, value] of Object.entries(frame)) if (value !== undefined && value !== null) result[key] = value; return result; }

  function create(root, contract) {
    if (!root || !root.matches("[data-motion-icon]")) throw new Error("Root must match [data-motion-icon]");
    const missingParts = [...new Set([...(contract.geometry.stable_parts || []), ...(contract.geometry.actors || [])])].filter(name => !part(root, name));
    if (missingParts.length) throw new Error(`Missing semantic parts: ${missingParts.join(", ")}`);
    let current = contract.state.initial;
    let target = contract.state.initial;
    let latestRequested = contract.state.initial;
    let reducedMotion = false;
    let active = [];
    let queuedTarget = null;
    let lastError = null;
    let transitionToken = 0;

    function cancelActive({ preserveVisual = true } = {}) {
      const snapshots = preserveVisual ? active.map(item => ({ element: item.element, style: styleSnapshot(item.element) })) : [];
      for (const item of active) { try { item.animation.cancel(); } catch (_) {} }
      active = [];
      if (preserveVisual) for (const { element, style } of snapshots) for (const prop of ANIMATABLE_PROPS) if (style[prop] !== undefined) element.style[prop] = style[prop];
    }
    function setState(value) {
      if (!stateAllowed(contract, value)) throw new Error(`State not allowed: ${String(value)}`);
      transitionToken += 1;
      cancelActive({ preserveVisual: false });
      applyVisualState(root, contract, value);
      current = value; target = value; latestRequested = value; queuedTarget = null; lastError = null;
      return getState();
    }
    function finishTarget(token, value) {
      if (token !== transitionToken || !sameState(value, latestRequested)) return;
      applyVisualState(root, contract, value);
      current = value; target = value; active = [];
      if (queuedTarget !== null && !sameState(queuedTarget, current)) { const next = queuedTarget; queuedTarget = null; beginTransition(next); }
    }
    function beginTransition(nextTarget) {
      if (!stateAllowed(contract, nextTarget)) throw new Error(`State not allowed: ${String(nextTarget)}`);
      latestRequested = nextTarget;
      if (reducedMotion || contract.accessibility.reduced_motion === "no-transient-motion") return setState(nextTarget);
      if (sameState(nextTarget, current) && active.length === 0) return getState();
      const policy = contract.behavior.interrupt_policy;
      if (active.length && policy === "complete") { queuedTarget = nextTarget; return getState(); }
      const fromState = current;
      const wasActive = active.length > 0;
      const activeParts = wasActive ? [...new Set(active.map(item => item.part))] : [];
      let transition = findTransition(contract, fromState, nextTarget);
      if (!transition && wasActive && (policy === "retarget" || policy === "reverse")) {
        const targetParts = contract.visual_states[String(nextTarget)]?.parts || {};
        const candidateParts = [...new Set([...activeParts, ...Object.keys(targetParts)])].filter(name => targetParts[name]);
        transition = { from: fromState, to: nextTarget, duration_ms: contract.motion.default_duration_ms, easing: contract.motion.default_easing, tracks: candidateParts.map(name => { const end = { offset: 1 }; for (const prop of ANIMATABLE_PROPS) if (Object.prototype.hasOwnProperty.call(targetParts[name], prop)) end[prop] = targetParts[name][prop]; return { part: name, keyframes: [{ ...end, offset: 0 }, end] }; }) };
      }
      if (!transition) { lastError = { code: "TRANSITION_MISSING", from: fromState, to: nextTarget }; return setState(nextTarget); }
      if (wasActive) cancelActive({ preserveVisual: true });
      target = nextTarget;
      const token = ++transitionToken;
      const created = [];
      const defaultDuration = transition.duration_ms ?? contract.motion.default_duration_ms;
      const defaultEasing = transition.easing ?? contract.motion.default_easing;
      for (const track of transition.tracks || []) {
        const element = part(root, track.part);
        if (!element) throw new Error(`Missing data-part ${track.part}`);
        let frames = (track.keyframes || []).map(cleanFrame);
        if (wasActive && frames.length) frames = [computedFirstFrame(element, frames[0]), ...frames.slice(1)];
        const duration = track.duration_ms ?? defaultDuration;
        const delay = track.delay_ms ?? 0;
        const animation = element.animate(frames, { duration, delay, easing: track.easing ?? defaultEasing, fill: "both", iterations: 1 });
        created.push({ animation, element, part: track.part, duration, delay });
      }
      active = created;
      if (!created.length) { finishTarget(token, nextTarget); return getState(); }
      Promise.all(created.map(item => item.animation.finished.catch(() => null))).then(() => finishTarget(token, nextTarget));
      return getState();
    }
    function seek(progress) {
      const p = Math.max(0, Math.min(1, Number(progress)));
      if (reducedMotion && p > 0) { setState(latestRequested); return getState(); }
      for (const item of active) { item.animation.pause(); item.animation.currentTime = item.delay + item.duration * p; }
      if (p >= 1 && active.length) finishTarget(transitionToken, target);
      return getState();
    }
    function settle() { return seek(1); }
    function setReducedMotion(enabled) { reducedMotion = Boolean(enabled); if (reducedMotion && active.length) setState(latestRequested); return getState(); }
    function getVisualState() {
      const result = {};
      for (const element of root.querySelectorAll("[data-part]")) result[element.getAttribute("data-part")] = styleSnapshot(element);
      const rootRect = root.getBoundingClientRect();
      return { parts: result, root: { x: rootRect.x, y: rootRect.y, width: rootRect.width, height: rootRect.height }, viewBox: root.getAttribute("viewBox") };
    }
    function getState() { return { current, target, latestRequested, active: active.length > 0, reducedMotion, queuedTarget, lastError }; }
    function reset() { reducedMotion = false; return setState(contract.state.initial); }
    function getTestScenarios() { return (contract.verification.scenarios || []).map(item => ({ name: item.name, start: item.start, firstTarget: item.first_target, interruptAt: item.interrupt_at, secondTarget: item.second_target, expected: item.expected })); }
    applyVisualState(root, contract, current);
    return { setState, beginTransition, seek, settle, setReducedMotion, getProductState: getState, getVisualState, getState, reset, getTestScenarios };
  }
  global.MotionIconRuntime = { create };
})(window);
