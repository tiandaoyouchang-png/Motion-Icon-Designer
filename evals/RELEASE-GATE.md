# Release Gate — Motion Icon Designer 1.0.0-rc4

RC4 is a production candidate only when all applicable gates pass. Skill validation alone is not production evidence.

## Gate A — Reasoning / semantic quality

- positive trigger precision >= 95%
- negative trigger precision >= 95%
- golden semantic cases: 10/10
- blind semantic P0 failures: 0
- state/action semantic failures: 0

## Gate B — Contract / build quality

- contract semantic/schema validation pass: 100%
- unknown/additional contract fields fail closed
- missing product model returns `NEEDS_PRODUCT_MODEL`
- unsafe SVG blockers: 100%
- contract/asset semantic mismatch blocks build
- unowned visible geometry blocks build
- contract-undeclared semantic parts block build
- state-key collisions: 0
- duplicate transition pairs: 0

## Gate C — Runtime / interaction quality

- production E2E fixtures: Lock / Seat Heating / Wi-Fi / Play-Pause = 4/4
- legacy fixtures: 4/4
- browser/runtime errors: 0
- interaction correctness failures: 0
- stuck states: 0
- obsolete animation beats latest product state: 0
- RETARGET failures: 0
- REVERSE failures: 0
- COMPLETE queued-target settle failures: 0
- reduced-motion meaning preserved: 100%

## Gate D — Geometry / visual quality

- required semantic part with zero geometry reaches PASS: 0
- required semantic part never paintable reaches PASS: 0
- unowned visible geometry reaches package: 0
- undeclared semantic `data-part` reaches runtime: 0
- stable-part invariant failures: 0
- final landing mismatch: 0
- target-size evidence: 20/24/32/96px
- duplicate SVG IDs after normalization: 0
- external runtime references: 0

## Gate E — Packaging / integrity

- `manifest.json > verification.status == PASS`
- mutation of integrity-tracked files invalidates prior PASS
- package contains source, normalized asset, controller, contract, profile, reports, screenshots and integration README
- production runtime is `svg-waapi`
- Lottie / dotLottie / Rive remain handoff/experimental

## Gate F — Case / evidence integrity

- `evals/case-evidence.json` release matches `package.json`
- README includes every named evidence/eval route ID
- README case count matches evidence sources
- user blind SVG originals are not committed; only anonymous observations are recorded
- CI workflow runs `npm run test:production`
- referenced scripts/resources/evidence sources exist

Current RC4 README catalog: **81 named cases/routes**.

`evals/QUALIFICATION-REPORT.md` is historical RC2 evidence only and must not be presented as current RC4 release proof.

## RC4 qualified capability envelope

Production PASS is limited to:

- runtime: `svg-waapi`
- product input: boolean / discrete / derived
- reactivity: transition / persistent-static
- interruption: complete / reverse / retarget
- loop policy: never
- reduced motion: direct-state-establish / no-transient-motion

Continuous input, event-pulse, semantic loops, restrained-transition Reduced Motion, Lottie, dotLottie and Rive remain unqualified for production.

## Absolute P0 blockers

- wrong product state / state-action semantics
- runtime becomes business-state authority
- unsafe SVG passes production preflight
- unsupported capability receives production PASS
- unowned visible geometry reaches a package
- contract-undeclared semantic part reaches runtime
- required semantic part has zero geometry or is never paintable but verifier reports PASS
- obsolete animation beats latest state
- COMPLETE leaves queued target stuck
- reduced-motion critical meaning disappears
- package mutation is not detected
- runtime exception in a qualified fixture
- package claims PASS without completed verification
- README/evidence sources claim cases that are absent or non-reproducible without being marked historical/observed

## Graduation rule

Do not tag `1.0.0` merely because the Skill validates. Graduate only after Gate A–F pass with reproducible release evidence and target-platform/OEM validation confirms the deployment profile.
