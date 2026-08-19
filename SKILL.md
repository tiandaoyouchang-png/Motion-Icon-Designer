---
name: design-motion-icons
description: Design, review, build, package, and verify semantic motion icons and icon micro-interactions for product UI, automotive HMI, mobile, web, embedded interfaces, and design systems. Use for static-to-animated icons, product-state icon behavior, SVG/WAAPI production assets, Lottie/Rive handoff, hover/tap/active/disabled/loading/level states, icon morphs, motion-icon reviews, motion systems, implementation handoff, runtime verification, and production packaging. Do not use for general page animation, cinematic/video animation, character animation, or unrelated decorative motion.
---

# Design Motion Icons

Treat motion icons as product behavior, not decoration.

Use this control flow:

PRODUCT STATE
→ REPRESENTATION ROLE
→ SEMANTIC VERB
→ GEOMETRY
→ GESTURE FAMILY
→ REACTIVITY
→ MOTION LANGUAGE
→ CANONICAL CONTRACT
→ PLATFORM CAPABILITY
→ BUILD
→ VERIFICATION
→ PACKAGE

## 0. Choose the operating mode

Choose one or combine as needed:

- ANALYZE — inspect product state, source asset, and platform constraints.
- DESIGN — create semantic motion behavior.
- REVIEW — diagnose an existing motion icon before redesigning.
- SYSTEM — define shared grammar for an icon library.
- HANDOFF — create a canonical product contract and runtime mapping.
- BUILD — produce an executable production candidate.
- VERIFY — run deterministic design/runtime gates.
- PACKAGE — return a verified integration package.

For BUILD/PACKAGE work, use the production pipeline below. Do not skip gates.

## 1. Establish the product model

Identify source/target/persistent states, input model, representation role, source of truth, interaction frequency, ongoing activity, and safety relevance. Read `references/PRODUCT-STATES.md` when semantics are non-trivial.

Product state is authoritative. Animation state is not.

If the product model is too ambiguous, return `NEEDS_PRODUCT_MODEL`. Do not invent business state.

## 2. Name the semantic verb

Describe what the represented object, signal, or material naturally does. Do not start from generic effects such as scale, bounce, shake, or spin unless that movement itself carries meaning.

If no defensible internal semantic motion exists, allow `NO_INTERNAL_SEMANTIC_MOTION`.

## 3. Inspect and preflight the asset

For SVG production work, run intake preflight:

```bash
node scripts/asset-preflight.mjs <source.svg> --profile profiles/web-svg-waapi.json --mode intake --out preflight.json
```

Identify stable structure, actors, pivot/seam/emitter/container, direction/symmetry, clipping, IDs, references, and unsafe features.

For production build, enforce complete geometry ownership:

- every renderable SVG primitive belongs to a `data-part`, directly or through an owning group
- every `data-part` in the SVG is declared by the canonical contract
- design guides, grids, debug marks, and other unowned visible geometry are P0 blockers

Do not solve ownership failures by wrapping the entire SVG in one generic part.

## 4. Select gesture grammar and reactivity

Read `references/GESTURE-FAMILIES.md`. Reuse semantic grammar, not copied keyframes. Choose transition / continuous-response / event-pulse / persistent-static. Stable ON states normally become visually stable after transition.

## 5. Define landing and interruption

Choose landing and COMPLETE / REVERSE / RETARGET. Latest product state must win. Separate transient transition behavior from persistent state presentation.

## 6. Apply motion language

Read `references/MOTION-LANGUAGE.md`. Select personality, duration, easing, amplitude, overshoot, sequencing, and loop policy. For automotive HMI prioritize clarity, responsiveness, low distraction, consistency, semantic motion, then flourish.

## 7. Create the canonical production contract

For BUILD work, create `contract.json` conforming to `schemas/motion-icon-contract.schema.json`, then validate:

```bash
node scripts/validate-contract.mjs contract.json --profile profiles/web-svg-waapi.json
```

The contract defines product state/source of truth, allowed states, semantics, geometry ownership, persistent visual states, transition tracks, interruption policy, reduced motion, platform profile, and verification scenarios.

Read `references/DEVELOPER-HANDOFF.md` and `references/OUTPUT-SPEC.md` when creating the contract.

## 8. Apply the platform capability envelope

Read `references/IMPLEMENTATION.md`.

RC3 production backend scope is intentionally narrow:

- PRODUCTION: SVG + WAAPI
- HANDOFF / EXPERIMENTAL: Lottie / dotLottie / Rive

Do not claim production readiness for an unverified backend. RC3 production qualification is fail-closed for unqualified input models, reactivity, loops, reduced-motion modes, or runtime capabilities.

## 9. Normalize and compile

```bash
node scripts/svg-normalizer.mjs annotated.svg --out normalized.svg --id-prefix <icon-id>
node scripts/svg-waapi-compiler.mjs --svg normalized.svg --contract contract.json --profile profiles/web-svg-waapi.json --out production-package
```

Or run the orchestrated build:

```bash
node scripts/build-motion-icon.mjs --svg annotated.svg --contract contract.json --profile profiles/web-svg-waapi.json --out production-package
```

Do not hand-author a replacement build path when these scripts cover the requested backend.

## 10. Verify the production candidate

Read `references/VERIFICATION.md` and run:

```bash
node scripts/verify-motion-icon.mjs production-package --out production-package
```

Verifier v2 checks DOM/root invariants, package integrity hashes, duplicate IDs/external refs, complete visible-geometry ownership, contract-declared parts only, non-zero semantic geometry, paintability in allowed states, stable-part geometry, actual sizes, intermediate frames, final landing, COMPLETE/REVERSE/RETARGET interaction, latest-state wins, reduced-motion meaning, and browser/runtime failures.

Never describe a package as production-ready when `manifest.json` verification status is not `PASS`.

## 11. Package the output

Read `references/PRODUCTION-PACKAGE.md`. Return the complete production package, not disconnected snippets.

## Hard blockers

- `NEEDS_PRODUCT_MODEL` — state semantics are insufficient.
- `CONTRACT_CONFLICT` — state/role/source-of-truth definitions conflict.
- `NO_INTERNAL_SEMANTIC_MOTION` — no defensible semantic actor/action exists.
- `ASSET_NORMALIZATION_REQUIRED` — input cannot enter the tested build profile yet.
- `UNOWNED_VISIBLE_GEOMETRY` — renderable SVG geometry exists outside semantic ownership.
- `UNDECLARED_SEMANTIC_PART` — SVG contains a `data-part` absent from the contract.
- `SEMANTIC_PART_NOT_RENDERABLE` — a required part has no usable geometry or is never paintable.
- `RUNTIME_UNSUPPORTED` — requested backend is outside production scope.
- `BUILD_BLOCKED` — compiler/preflight/contract gate fails.
- `VERIFY_FAILED` — runtime, interaction, geometry, accessibility, integrity, or visual gate fails.

A blocker is preferable to silently generating a misleading asset.

# Review priorities

P0 — product-state, state/action, geometry ownership/renderability, latest-state, reduced-motion, integrity, build/runtime correctness

P1 — interaction continuity, actual-size legibility, geometry invariants, platform compatibility

P2 — motion-system consistency and reusable grammar

P3 — aesthetic polish

# Important distinctions

CONTROL FEEDBACK ≠ ICON SEMANTIC MOTION

TRANSITION ≠ PERSISTENT STATE

PRODUCT STATE ≠ ANIMATION STATE

CURRENT STATE ≠ AVAILABLE ACTION

GESTURE FAMILY ≠ COPY-PASTED KEYFRAMES

PLATFORM CONSTRAINT ≠ PRODUCT SEMANTICS

CAPTURED SCREENSHOT ≠ VERIFIED SCREENSHOT

# Reference routing

Product states: `references/PRODUCT-STATES.md`

Gesture grammar: `references/GESTURE-FAMILIES.md`

Timing/personality: `references/MOTION-LANGUAGE.md`

Runtime/platform selection: `references/IMPLEMENTATION.md`

Developer contract: `references/DEVELOPER-HANDOFF.md`

Verification gates: `references/VERIFICATION.md`

Production package: `references/PRODUCTION-PACKAGE.md`

HMI examples: `references/HMI-GOLDEN-SUITE.md`

Failure diagnosis: `references/FAILURE-CATALOG.md`

Output schemas: `references/OUTPUT-SPEC.md`

Load only references needed for the current task.
