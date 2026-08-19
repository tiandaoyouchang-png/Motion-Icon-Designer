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

Identify:

- source and target states
- persistent target state
- input model: boolean / discrete / continuous / event / derived
- representation role: status / action / mode / value / progress / alert
- authoritative source of truth
- interaction frequency
- whether activity continues after transition
- whether the state is safety-relevant

Read `references/PRODUCT-STATES.md` when semantics are non-trivial.

Product state is authoritative. Animation state is not.

If the product model is too ambiguous to determine state meaning, return `NEEDS_PRODUCT_MODEL`. Do not invent business state.

## 2. Name the semantic verb

Describe what the represented object, signal, or material naturally does.

Examples:

- heat rises
- battery fills
- fan turns
- signal radiates
- shackle opens
- pointer aligns
- lines reform

Do not start from generic effects such as scale, bounce, shake, or spin unless that movement itself carries meaning.

If no defensible internal semantic motion exists, allow `NO_INTERNAL_SEMANTIC_MOTION`. A stable state plus restrained control feedback can be the correct result.

## 3. Inspect and preflight the asset

For SVG production work, run intake preflight before changing geometry:

```bash
node scripts/asset-preflight.mjs <source.svg> \
  --profile profiles/web-svg-waapi.json \
  --mode intake \
  --out preflight.json
```

Identify:

- stable structure
- semantic actors
- pivot / seam / emitter / container
- direction and symmetry
- clipping / occlusion
- IDs and internal references
- unsupported or unsafe SVG features

When vector geometry exists, add stable `data-part` annotations to semantic elements. Do not change geometry merely to make animation easier.

For production build, enforce complete geometry ownership:

- every renderable SVG primitive must belong to a `data-part`, directly or through an owning group
- every `data-part` in the SVG must be declared by the canonical contract
- design guides, grids, debug marks, and other unowned visible geometry are P0 blockers

Do not solve ownership failures by wrapping the entire SVG in one generic part. Semantic ownership must remain meaningful.

Before build, preflight again in `build` mode. If it fails, return `ASSET_NORMALIZATION_REQUIRED` or the reported blocker instead of producing an unsafe package.

## 4. Select gesture grammar and reactivity

Read `references/GESTURE-FAMILIES.md`.

Reuse semantic grammar, not copied keyframes. Never blindly reuse exact distances, pivots, rotations, stagger values, or element counts.

Choose reactivity:

- transition
- continuous-response
- event-pulse
- persistent-static

Stable ON states normally become visually stable after their transition. Continuous animation requires an ongoing semantic reason.

## 5. Define landing and interruption

Choose landing:

- return
- target-state
- symmetry
- hidden-rearm
- morph

Choose interruption:

- COMPLETE
- REVERSE
- RETARGET

Latest product state must win. High-frequency levels and continuously changing controls normally prefer RETARGET.

Separate transient transition behavior from persistent state presentation.

## 6. Apply motion language

Read `references/MOTION-LANGUAGE.md`.

Select personality, duration, easing, amplitude, overshoot, sequencing, and loop policy.

Frequently used controls should generally be faster and quieter.

For automotive HMI prioritize:

1. state clarity
2. responsiveness
3. low distraction
4. consistency
5. semantic motion
6. aesthetic flourish

## 7. Create the canonical production contract

For BUILD work, create `contract.json` conforming to:

`schemas/motion-icon-contract.schema.json`

Then validate it:

```bash
node scripts/validate-contract.mjs contract.json \
  --profile profiles/web-svg-waapi.json
```

The contract must define:

- product state and source of truth
- allowed states and initial state
- semantic verb and gesture family
- stable parts and actors
- persistent visual states
- runtime-neutral transition tracks
- interruption policy
- reduced-motion behavior
- platform profile
- verification scenarios

Business code communicates product facts. Prefer `setState({ ... })` or a product state value over named animation clips.

Read `references/DEVELOPER-HANDOFF.md` and `references/OUTPUT-SPEC.md` when creating the contract.

## 8. Apply the platform capability envelope

Read `references/IMPLEMENTATION.md`.

RC4 production backend scope is intentionally narrow:

- PRODUCTION: SVG + WAAPI
- HANDOFF / EXPERIMENTAL: Lottie / dotLottie / Rive

Do not claim production readiness for an unverified backend.

Use `profiles/web-svg-waapi.json` for the default production capability envelope. Platform constraints may narrow the motion design, but must not change product semantics.

If the requested runtime is unsupported for production build, return `RUNTIME_UNSUPPORTED` and provide handoff-only output when useful.

## 9. Normalize and compile

Normalize semantic SVG without changing intended geometry:

```bash
node scripts/svg-normalizer.mjs annotated.svg \
  --out normalized.svg \
  --id-prefix <icon-id>
```

Compile:

```bash
node scripts/svg-waapi-compiler.mjs \
  --svg normalized.svg \
  --contract contract.json \
  --profile profiles/web-svg-waapi.json \
  --out production-package
```

Or run the orchestrated build:

```bash
node scripts/build-motion-icon.mjs \
  --svg annotated.svg \
  --contract contract.json \
  --profile profiles/web-svg-waapi.json \
  --out production-package
```

Do not hand-author a replacement build path when these scripts cover the requested backend.

## 10. Verify the production candidate

Read `references/VERIFICATION.md`.

Run:

```bash
node scripts/verify-motion-icon.mjs production-package \
  --out production-package
```

Verifier v2 checks, when applicable:

- DOM/root invariants
- duplicate SVG IDs and external references
- complete visible-geometry ownership
- no contract-undeclared `data-part`
- contract-to-asset semantic part mapping
- non-zero geometry for every required semantic part
- each required semantic part is paintable in at least one allowed product state
- stable-part geometry invariants
- actual-size captures
- intermediate states
- final landing
- rapid retarget/reversal scenarios
- latest product state wins
- reduced-motion target meaning
- browser console/runtime failures
- optional pinned-environment screenshot hash baseline

Never describe a package as production-ready when `manifest.json` has verification status other than `PASS`.

## 11. Package the output

Read `references/PRODUCTION-PACKAGE.md`.

A production candidate contains at least:

```text
production-package/
├── source.svg
├── motion-icon.svg
├── controller.js
├── contract.json
├── platform-profile.json
├── manifest.json
├── preflight-report.json
├── normalize-report.json
├── compile-report.json
├── fixture.html
├── verify-report.json
├── verify-report.html
├── screenshots/
└── README.md
```

Return the complete package, not disconnected snippets.

## Hard blockers

Stop or downgrade the deliverable when any of these occur:

- `NEEDS_PRODUCT_MODEL` — state semantics are insufficient.
- `CONTRACT_CONFLICT` — state/role/source-of-truth definitions conflict.
- `NO_INTERNAL_SEMANTIC_MOTION` — no defensible semantic actor/action exists.
- `ASSET_NORMALIZATION_REQUIRED` — input cannot enter the tested build profile yet.
- `UNOWNED_VISIBLE_GEOMETRY` — renderable SVG geometry exists outside semantic ownership.
- `UNDECLARED_SEMANTIC_PART` — SVG contains a `data-part` absent from the contract.
- `SEMANTIC_PART_NOT_RENDERABLE` — a required semantic part has no usable geometry or is never paintable in allowed states.
- `RUNTIME_UNSUPPORTED` — requested backend is outside production scope.
- `BUILD_BLOCKED` — compiler/preflight/contract gate fails.
- `VERIFY_FAILED` — runtime, interaction, geometry, accessibility, or visual gate fails.

A blocker is preferable to silently generating a misleading asset.

# Review priorities

P0 — product-state, state/action, geometry ownership/renderability, latest-state, reduced-motion, build/runtime correctness

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

# Maintenance / release discipline

When updating this Skill or its production fixtures:

- Treat `evals/case-evidence.json`, semantic eval files, and executable fixtures as the evidence sources.
- Run `npm run docs:cases` after adding or changing cases so README and `evals/CASE-LEDGER.md` stay synchronized.
- Run `npm run test:docs` to catch stale versions, missing scripts, broken reference paths, or undocumented cases.
- Run `npm run test:production` before claiming the current RC is release-ready.
- Keep user-provided blind assets anonymized unless the user explicitly asks to publish the source files.
- Do not promote historical qualification summaries into current-release proof unless the individual suite is checked in and reproducible.

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
