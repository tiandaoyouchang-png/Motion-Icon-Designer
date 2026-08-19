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
  const only = (obj, allowed, label) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    const allowedSet = new Set(allowed);
    for (const key of Object.keys(obj)) req(allowedSet.has(key), "UNKNOWN_PROPERTY", `${label}.${key} is not allowed by the production contract schema.`);
  };

  req(contract && typeof contract === "object" && !Array.isArray(contract), "CONTRACT_NOT_OBJECT", "Contract must be a JSON object.");
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) return { ok: false, errors, warnings };
  only(contract, ["id", "version", "product", "state", "behavior", "semantics", "geometry", "motion", "visual_states", "transitions", "landing", "accessibility", "implementation", "verification"], "contract");

  req(typeof contract.id === "string" && /^[a-z0-9][a-z0-9-]*$/.test(contract.id), "INVALID_ID", "id must be lowercase kebab-case.");
  req(typeof contract.version === "string" && /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(contract.version), "INVALID_VERSION", "version must be semver-like.");
  only(contract.product, ["input_model", "representation_role", "source_of_truth", "safety_relevant"], "product");
  only(contract.state, ["initial", "allowed"], "state");
  only(contract.behavior, ["reactivity", "interrupt_policy", "loop_policy"], "behavior");
  only(contract.semantics, ["verb", "primary_family", "secondary_family", "no_internal_motion_reason"], "semantics");
  only(contract.geometry, ["stable_parts", "actors", "pivot", "emitter", "seam"], "geometry");
  only(contract.motion, ["personality", "default_duration_ms", "default_easing", "overshoot_percent"], "motion");
  only(contract.landing, ["type", "persistent_visual"], "landing");
  only(contract.accessibility, ["reduced_motion", "meaning_preserved"], "accessibility");
  only(contract.implementation, ["runtime", "platform_profile", "asset_id_prefix"], "implementation");
  only(contract.verification, ["stable_part_tolerance_px", "scenarios"], "verification");

  req(contract.product && ["boolean", "discrete", "continuous", "event", "derived"].includes(contract.product.input_model), "INVALID_INPUT_MODEL", "product.input_model is invalid.");
  req(contract.product && ["status", "action", "mode", "value", "progress", "alert"].includes(contract.product.representation_role), "INVALID_ROLE", "product.representation_role is invalid.");
  req(contract.product && typeof contract.product.source_of_truth === "string" && contract.product.source_of_truth.length > 0, "MISSING_SOURCE_OF_TRUTH", "product.source_of_truth is required.");
  if (contract.product && "safety_relevant" in contract.product) req(typeof contract.product.safety_relevant === "boolean", "INVALID_SAFETY_RELEVANT", "product.safety_relevant must be boolean.");
  req(contract.state && Array.isArray(contract.state.allowed) && contract.state.allowed.length > 0, "MISSING_ALLOWED_STATES", "state.allowed must contain at least one state.");
  if (contract.state?.allowed) {
    req(contract.state.allowed.some(v => valuesEqual(v, contract.state.initial)), "INITIAL_NOT_ALLOWED", "state.initial must appear in state.allowed.");
  }
  req(contract.behavior && ["transition", "continuous-response", "event-pulse", "persistent-static"].includes(contract.behavior.reactivity), "INVALID_REACTIVITY", "behavior.reactivity is invalid.");
  req(contract.behavior && ["complete", "reverse", "retarget"].includes(contract.behavior.interrupt_policy), "INVALID_INTERRUPT_POLICY", "behavior.interrupt_policy is invalid.");
  req(contract.behavior && ["never", "while-active", "continuous-semantic"].includes(contract.behavior.loop_policy), "INVALID_LOOP_POLICY", "behavior.loop_policy is invalid.");
  req(contract.semantics && typeof contract.semantics.verb === "string" && contract.semantics.verb.length > 0, "MISSING_SEMANTIC_VERB", "semantics.verb is required.");
  req(contract.semantics && typeof contract.semantics.primary_family === "string" && contract.semantics.primary_family.length > 0, "MISSING_PRIMARY_FAMILY", "semantics.primary_family is required.");
  req(contract.geometry && Array.isArray(contract.geometry.stable_parts), "MISSING_STABLE_PARTS", "geometry.stable_parts must be an array.");
  req(contract.geometry && Array.isArray(contract.geometry.actors), "MISSING_ACTORS", "geometry.actors must be an array.");
  req(contract.motion && typeof contract.motion.personality === "string" && contract.motion.personality.length > 0, "INVALID_PERSONALITY", "motion.personality is required.");
  req(contract.motion && Number.isInteger(contract.motion.default_duration_ms) && contract.motion.default_duration_ms >= 0 && contract.motion.default_duration_ms <= 2000, "INVALID_DURATION", "motion.default_duration_ms must be an integer in 0..2000.");
  req(contract.motion && typeof contract.motion.default_easing === "string" && contract.motion.default_easing.length > 0, "INVALID_EASING", "motion.default_easing is required.");
  if (contract.motion && "overshoot_percent" in contract.motion) req(typeof contract.motion.overshoot_percent === "number" && contract.motion.overshoot_percent >= 0 && contract.motion.overshoot_percent <= 30, "INVALID_OVERSHOOT", "motion.overshoot_percent must be 0..30.");
  req(contract.visual_states && typeof contract.visual_states === "object" && Object.keys(contract.visual_states).length > 0, "MISSING_VISUAL_STATES", "visual_states is required.");
  req(Array.isArray(contract.transitions), "MISSING_TRANSITIONS", "transitions must be an array.");
  req(contract.landing && ["return", "target-state", "symmetry", "hidden-rearm", "morph"].includes(contract.landing.type), "INVALID_LANDING", "landing.type is invalid.");
  req(contract.accessibility && ["direct-state-establish", "restrained-transition", "no-transient-motion"].includes(contract.accessibility.reduced_motion), "INVALID_REDUCED_MOTION", "accessibility.reduced_motion is invalid.");
  req(contract.accessibility?.meaning_preserved === true, "REDUCED_MOTION_MEANING", "accessibility.meaning_preserved must be true.");
  req(contract.implementation?.runtime === "svg-waapi", "UNSUPPORTED_RUNTIME", "RC3 production backend supports only svg-waapi.");
  req(typeof contract.implementation?.platform_profile === "string" && contract.implementation.platform_profile.length > 0, "MISSING_PLATFORM_PROFILE", "implementation.platform_profile is required.");
  if (contract.implementation && "asset_id_prefix" in contract.implementation) req(typeof contract.implementation.asset_id_prefix === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(contract.implementation.asset_id_prefix), "INVALID_ASSET_ID_PREFIX", "implementation.asset_id_prefix is invalid.");
  req(Array.isArray(contract.verification?.scenarios), "MISSING_SCENARIOS", "verification.scenarios must be an array.");

  const allowed = contract.state?.allowed ?? [];
  const allowedTypedKeys = allowed.map(stateKey);
  req(new Set(allowedTypedKeys).size === allowedTypedKeys.length, "DUPLICATE_ALLOWED_STATE", "state.allowed must contain unique typed values.");
  const stateStringKeys = allowed.map(value => String(value));
  const stateKeyCollisions = [...new Set(stateStringKeys.filter((value, index) => stateStringKeys.indexOf(value) !== index))];
  req(stateKeyCollisions.length === 0, "STATE_STRING_KEY_COLLISION", `state.allowed values collide when mapped to visual_states keys: ${stateKeyCollisions.join(", ")}.`);
  const visualKeys = new Set(Object.keys(contract.visual_states ?? {}));
  for (const value of allowed) {
    req(visualKeys.has(String(value)), "MISSING_VISUAL_STATE", `visual_states must define state ${JSON.stringify(value)}.`);
  }

  const partNames = new Set([...(contract.geometry?.stable_parts ?? []), ...(contract.geometry?.actors ?? [])]);
  for (const [state, def] of Object.entries(contract.visual_states ?? {})) {
    only(def, ["parts"], `visual_states.${state}`);
    req(def && typeof def === "object" && def.parts && typeof def.parts === "object" && !Array.isArray(def.parts), "INVALID_VISUAL_STATE", `visual_states.${state}.parts is required.`);
    for (const [part, style] of Object.entries(def?.parts ?? {})) {
      partNames.add(part);
      req(/^[A-Za-z][A-Za-z0-9_-]*$/.test(part), "INVALID_PART_NAME", `visual_states.${state}.parts contains invalid part name ${part}.`);
      only(style, ["opacity", "transform", "transformOrigin", "strokeDasharray", "strokeDashoffset", "fill", "stroke"], `visual_states.${state}.parts.${part}`);
    }
  }

  const transitionPairs = new Set();
  for (const [index, transition] of (contract.transitions ?? []).entries()) {
    only(transition, ["from", "to", "tracks", "duration_ms", "easing"], `transitions[${index}]`);
    const pair = `${stateKey(transition.from)}->${stateKey(transition.to)}`;
    req(!transitionPairs.has(pair), "DUPLICATE_TRANSITION", `Duplicate transition pair at transitions[${index}].`);
    transitionPairs.add(pair);
    req(allowed.some(v => valuesEqual(v, transition.from)), "TRANSITION_FROM_UNKNOWN", `transitions[${index}].from is not an allowed state.`);
    req(allowed.some(v => valuesEqual(v, transition.to)), "TRANSITION_TO_UNKNOWN", `transitions[${index}].to is not an allowed state.`);
    req(Array.isArray(transition.tracks), "INVALID_TRACKS", `transitions[${index}].tracks must be an array.`);
    for (const [trackIndex, track] of (transition.tracks ?? []).entries()) {
      only(track, ["part", "keyframes", "delay_ms", "duration_ms", "easing"], `transitions[${index}].tracks[${trackIndex}]`);
      req(typeof track.part === "string" && track.part.length > 0, "TRACK_PART_MISSING", `transitions[${index}].tracks[${trackIndex}].part is required.`);
      req(Array.isArray(track.keyframes) && track.keyframes.length >= 2, "KEYFRAMES_TOO_SHORT", `transitions[${index}].tracks[${trackIndex}] needs at least two keyframes.`);
      for (const [keyframeIndex, keyframe] of (track.keyframes ?? []).entries()) only(keyframe, ["offset", "opacity", "transform", "strokeDasharray", "strokeDashoffset", "fill", "stroke", "easing"], `transitions[${index}].tracks[${trackIndex}].keyframes[${keyframeIndex}]`);
      const offsets = (track.keyframes ?? []).map(k => k.offset);
      req(offsets.every(v => typeof v === "number" && v >= 0 && v <= 1), "INVALID_KEYFRAME_OFFSET", `transitions[${index}].tracks[${trackIndex}] has invalid offsets.`);
      req(offsets.every((v, i) => i === 0 || v >= offsets[i - 1]), "UNSORTED_KEYFRAMES", `transitions[${index}].tracks[${trackIndex}] offsets must be nondecreasing.`);
    }
  }

  for (const [index, scenario] of (contract.verification?.scenarios ?? []).entries()) {
    only(scenario, ["name", "start", "first_target", "interrupt_at", "second_target", "expected"], `verification.scenarios[${index}]`);
    req(typeof scenario.name === "string" && scenario.name.length > 0, "SCENARIO_NAME_MISSING", `verification.scenarios[${index}].name is required.`);
    for (const [name, value] of [["start", scenario.start], ["first_target", scenario.first_target], ["second_target", scenario.second_target], ["expected", scenario.expected]]) {
      req(allowed.some(v => valuesEqual(v, value)), "SCENARIO_UNKNOWN_STATE", `verification.scenarios[${index}].${name} is not allowed.`);
    }
    req(typeof scenario.interrupt_at === "number" && scenario.interrupt_at >= 0 && scenario.interrupt_at <= 1, "SCENARIO_INTERRUPT_INVALID", `verification.scenarios[${index}].interrupt_at must be 0..1.`);
  }

  if (platformProfile) {
    req(platformProfile.runtime === contract.implementation?.runtime, "PROFILE_RUNTIME_MISMATCH", "Platform profile runtime does not match contract runtime.");
    req(platformProfile.id === contract.implementation?.platform_profile, "PROFILE_ID_MISMATCH", "Platform profile id does not match implementation.platform_profile.");
    req(["boolean", "discrete", "derived"].includes(contract.product?.input_model), "UNQUALIFIED_INPUT_MODEL", "RC3 SVG+WAAPI production supports boolean, discrete, and derived product inputs only.");
    req(["transition", "persistent-static"].includes(contract.behavior?.reactivity), "UNQUALIFIED_REACTIVITY", "RC3 SVG+WAAPI production supports transition and persistent-static reactivity only.");
    req(contract.behavior?.loop_policy === "never", "UNQUALIFIED_LOOP_POLICY", "RC3 SVG+WAAPI production does not qualify semantic loops.");
    req(["direct-state-establish", "no-transient-motion"].includes(contract.accessibility?.reduced_motion), "UNQUALIFIED_REDUCED_MOTION", "RC3 SVG+WAAPI production qualifies direct-state-establish and no-transient-motion only.");
    if (typeof platformProfile.max_duration_ms === "number") {
      req(contract.motion?.default_duration_ms <= platformProfile.max_duration_ms, "DURATION_EXCEEDS_PROFILE", `Default duration exceeds platform maximum ${platformProfile.max_duration_ms}ms.`);
      for (const [index, t] of (contract.transitions ?? []).entries()) {
        const duration = t.duration_ms ?? contract.motion.default_duration_ms;
        req(duration <= platformProfile.max_duration_ms, "TRANSITION_DURATION_EXCEEDS_PROFILE", `Transition ${index} exceeds platform maximum ${platformProfile.max_duration_ms}ms.`);
      }
    }
    if (typeof platformProfile.max_overshoot_percent === "number") {
      req((contract.motion?.overshoot_percent ?? 0) <= platformProfile.max_overshoot_percent, "OVERSHOOT_EXCEEDS_PROFILE", `Overshoot exceeds platform maximum ${platformProfile.max_overshoot_percent}%.`);
    }
  }

  warn(partNames.size > 0, "NO_SEMANTIC_PARTS", "Contract has no named geometry parts.");
  return { ok: errors.length === 0, errors, warnings };
}

export function findTransition(contract, from, to) {
  return (contract.transitions ?? []).find(item => valuesEqual(item.from, from) && valuesEqual(item.to, to)) ?? null;
}
