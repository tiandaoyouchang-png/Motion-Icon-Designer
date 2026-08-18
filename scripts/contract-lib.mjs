import fs from "node:fs";
import path from "node:path";

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON ${file}: ${error.message}`);
  }
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function stateKey(value) {
  return `${typeof value}:${String(value)}`;
}

export function valuesEqual(a, b) {
  return typeof a === typeof b && a === b;
}

export function validateContract(contract, { platformProfile = null } = {}) {
  const errors = [];
  const warnings = [];
  const req = (ok, code, message) => { if (!ok) errors.push({ code, message }); };
  const warn = (ok, code, message) => { if (!ok) warnings.push({ code, message }); };

  req(contract && typeof contract === "object" && !Array.isArray(contract), "CONTRACT_NOT_OBJECT", "Contract must be a JSON object.");
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) return { ok: false, errors, warnings };

  req(typeof contract.id === "string" && /^[a-z0-9][a-z0-9-]*$/.test(contract.id), "INVALID_ID", "id must be lowercase kebab-case.");
  req(typeof contract.version === "string" && /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(contract.version), "INVALID_VERSION", "version must be semver-like.");
  req(contract.product && ["boolean", "discrete", "continuous", "event", "derived"].includes(contract.product.input_model), "INVALID_INPUT_MODEL", "product.input_model is invalid.");
  req(contract.product && ["status", "action", "mode", "value", "progress", "alert"].includes(contract.product.representation_role), "INVALID_ROLE", "product.representation_role is invalid.");
  req(contract.product && typeof contract.product.source_of_truth === "string" && contract.product.source_of_truth.length > 0, "MISSING_SOURCE_OF_TRUTH", "product.source_of_truth is required.");
  req(contract.state && Array.isArray(contract.state.allowed) && contract.state.allowed.length > 0, "MISSING_ALLOWED_STATES", "state.allowed must contain at least one state.");
  if (contract.state?.allowed) req(contract.state.allowed.some(v => valuesEqual(v, contract.state.initial)), "INITIAL_NOT_ALLOWED", "state.initial must appear in state.allowed.");
  req(contract.behavior && ["transition", "continuous-response", "event-pulse", "persistent-static"].includes(contract.behavior.reactivity), "INVALID_REACTIVITY", "behavior.reactivity is invalid.");
  req(contract.behavior && ["complete", "reverse", "retarget"].includes(contract.behavior.interrupt_policy), "INVALID_INTERRUPT_POLICY", "behavior.interrupt_policy is invalid.");
  req(contract.semantics && typeof contract.semantics.verb === "string" && contract.semantics.verb.length > 0, "MISSING_SEMANTIC_VERB", "semantics.verb is required.");
  req(contract.geometry && Array.isArray(contract.geometry.stable_parts), "MISSING_STABLE_PARTS", "geometry.stable_parts must be an array.");
  req(contract.geometry && Array.isArray(contract.geometry.actors), "MISSING_ACTORS", "geometry.actors must be an array.");
  req(contract.motion && Number.isInteger(contract.motion.default_duration_ms) && contract.motion.default_duration_ms >= 0, "INVALID_DURATION", "motion.default_duration_ms must be a non-negative integer.");
  req(contract.visual_states && typeof contract.visual_states === "object" && Object.keys(contract.visual_states).length > 0, "MISSING_VISUAL_STATES", "visual_states is required.");
  req(Array.isArray(contract.transitions), "MISSING_TRANSITIONS", "transitions must be an array.");
  req(contract.accessibility?.meaning_preserved === true, "REDUCED_MOTION_MEANING", "accessibility.meaning_preserved must be true.");
  req(contract.implementation?.runtime === "svg-waapi", "UNSUPPORTED_RUNTIME", "RC2 production backend supports only svg-waapi.");
  req(typeof contract.implementation?.platform_profile === "string" && contract.implementation.platform_profile.length > 0, "MISSING_PLATFORM_PROFILE", "implementation.platform_profile is required.");
  req(Array.isArray(contract.verification?.scenarios), "MISSING_SCENARIOS", "verification.scenarios must be an array.");

  const allowed = contract.state?.allowed ?? [];
  const visualKeys = new Set(Object.keys(contract.visual_states ?? {}));
  for (const value of allowed) req(visualKeys.has(String(value)), "MISSING_VISUAL_STATE", `visual_states must define state ${JSON.stringify(value)}.`);

  const partNames = new Set([...(contract.geometry?.stable_parts ?? []), ...(contract.geometry?.actors ?? [])]);
  for (const [state, def] of Object.entries(contract.visual_states ?? {})) {
    req(def && typeof def === "object" && def.parts && typeof def.parts === "object", "INVALID_VISUAL_STATE", `visual_states.${state}.parts is required.`);
    for (const part of Object.keys(def?.parts ?? {})) partNames.add(part);
  }

  for (const [index, transition] of (contract.transitions ?? []).entries()) {
    req(allowed.some(v => valuesEqual(v, transition.from)), "TRANSITION_FROM_UNKNOWN", `transitions[${index}].from is not an allowed state.`);
    req(allowed.some(v => valuesEqual(v, transition.to)), "TRANSITION_TO_UNKNOWN", `transitions[${index}].to is not an allowed state.`);
    req(Array.isArray(transition.tracks), "INVALID_TRACKS", `transitions[${index}].tracks must be an array.`);
    for (const [trackIndex, track] of (transition.tracks ?? []).entries()) {
      req(typeof track.part === "string" && track.part.length > 0, "TRACK_PART_MISSING", `transitions[${index}].tracks[${trackIndex}].part is required.`);
      req(Array.isArray(track.keyframes) && track.keyframes.length >= 2, "KEYFRAMES_TOO_SHORT", `transitions[${index}].tracks[${trackIndex}] needs at least two keyframes.`);
      const offsets = (track.keyframes ?? []).map(k => k.offset);
      req(offsets.every(v => typeof v === "number" && v >= 0 && v <= 1), "INVALID_KEYFRAME_OFFSET", `transitions[${index}].tracks[${trackIndex}] has invalid offsets.`);
      req(offsets.every((v, i) => i === 0 || v >= offsets[i - 1]), "UNSORTED_KEYFRAMES", `transitions[${index}].tracks[${trackIndex}] offsets must be nondecreasing.`);
    }
  }

  for (const [index, scenario] of (contract.verification?.scenarios ?? []).entries()) {
    for (const [name, value] of [["start", scenario.start], ["first_target", scenario.first_target], ["second_target", scenario.second_target], ["expected", scenario.expected]]) req(allowed.some(v => valuesEqual(v, value)), "SCENARIO_UNKNOWN_STATE", `verification.scenarios[${index}].${name} is not allowed.`);
    req(typeof scenario.interrupt_at === "number" && scenario.interrupt_at >= 0 && scenario.interrupt_at <= 1, "SCENARIO_INTERRUPT_INVALID", `verification.scenarios[${index}].interrupt_at must be 0..1.`);
  }

  if (platformProfile) {
    req(platformProfile.runtime === contract.implementation?.runtime, "PROFILE_RUNTIME_MISMATCH", "Platform profile runtime does not match contract runtime.");
    req(platformProfile.id === contract.implementation?.platform_profile, "PROFILE_ID_MISMATCH", "Platform profile id does not match implementation.platform_profile.");
    if (typeof platformProfile.max_duration_ms === "number") {
      req(contract.motion?.default_duration_ms <= platformProfile.max_duration_ms, "DURATION_EXCEEDS_PROFILE", `Default duration exceeds platform maximum ${platformProfile.max_duration_ms}ms.`);
      for (const [index, t] of (contract.transitions ?? []).entries()) {
        const duration = t.duration_ms ?? contract.motion.default_duration_ms;
        req(duration <= platformProfile.max_duration_ms, "TRANSITION_DURATION_EXCEEDS_PROFILE", `Transition ${index} exceeds platform maximum ${platformProfile.max_duration_ms}ms.`);
      }
    }
    if (typeof platformProfile.max_overshoot_percent === "number") req((contract.motion?.overshoot_percent ?? 0) <= platformProfile.max_overshoot_percent, "OVERSHOOT_EXCEEDS_PROFILE", `Overshoot exceeds platform maximum ${platformProfile.max_overshoot_percent}%.`);
  }

  warn(partNames.size > 0, "NO_SEMANTIC_PARTS", "Contract has no named geometry parts.");
  return { ok: errors.length === 0, errors, warnings };
}

export function findTransition(contract, from, to) {
  return (contract.transitions ?? []).find(item => valuesEqual(item.from, from) && valuesEqual(item.to, to)) ?? null;
}
