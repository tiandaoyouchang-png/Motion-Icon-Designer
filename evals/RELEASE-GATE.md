# Release Gate — Motion Icon Designer 1.0.0-rc3

RC3 is a production candidate only when all applicable gates pass.

## Gate A — Reasoning / semantic quality

- positive trigger precision >= 95%
- negative trigger precision >= 95%
- golden semantic cases: 10/10
- adversarial P0 semantic failures: 0
- blind semantic P0 failures: 0
- state/action semantic failures: 0

## Gate B — Contract / build quality

- contract semantic validator pass: 100%
- unknown/additional production contract fields fail closed
- missing product model returns `NEEDS_PRODUCT_MODEL`: 100%
- unsafe SVG blocker cases: 100%
- contract/asset semantic mismatch blocks build: 100%
- unowned visible geometry blocks build: 100%
- contract-undeclared semantic parts block build: 100%
- state string-key collisions: 0
- duplicate transition pairs: 0
- manifest integrity hashes present: 100%

## Gate C — Runtime / interaction quality

- executable legacy fixtures: 4/4
- production end-to-end fixture: PASS
- browser/runtime errors: 0
- interaction correctness failures: 0
- stuck states: 0
- obsolete animation beats latest state: 0
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
- target-size captures generated: 20/24/32/96px
- duplicate SVG IDs after normalization: 0
- external runtime references: 0

## Gate E — Packaging / integrity

- `manifest.json > verification.status == PASS`
- mutation of integrity-tracked files invalidates verification
- package contains source, normalized asset, controller, contract, profile, reports, screenshots and integration README
- production runtime is `svg-waapi`
- Lottie/Rive remain handoff/experimental

## Gate F — Blind production qualification

Use unseen cases including unannotated SVGs, guide-contaminated templates, unsafe SVGs, degenerate actors, contract/platform fail-closed cases, integrity mutation, ambiguous product-state inputs, and multiple valid gesture/state builds.

Required:

- unsafe/dirty blocker cases: 100%
- contract/platform fail-closed cases: 100%
- unowned visible geometry detection: 100%
- semantic renderability detection: 100%
- package mutation detection: 100%
- P0 qualification failures: 0

`evals/QUALIFICATION-REPORT.md` is historical RC2 evidence, not a substitute for a reproducible RC3 qualification suite.

## RC3 qualified capability envelope

Production PASS is limited to:

- runtime: `svg-waapi`
- product input: boolean / discrete / derived
- reactivity: transition / persistent-static
- interruption: complete / reverse / retarget
- loop policy: never
- reduced motion: direct-state-establish / no-transient-motion

Continuous input, event-pulse, semantic loops, restrained-transition Reduced Motion, Lottie, dotLottie, and Rive remain unqualified for production.

## Absolute P0 blockers

- wrong product state or state/action semantics
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
- runtime exception in qualified fixture
- package claims PASS without completed verification

## Graduation rule

Do not tag `1.0.0` merely because the Skill validates. Graduate only after Gate A–F pass with reproducible release evidence and target-platform/OEM validation confirms the deployment profile.
