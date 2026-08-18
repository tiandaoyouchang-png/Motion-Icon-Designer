# Release Gate — Motion Icon Designer 1.0.0-rc2

RC2 is a production candidate only when all applicable gates pass.

## Gate A — Reasoning / semantic quality

- positive trigger precision >= 95%
- negative trigger precision >= 95%
- golden semantic cases: 10/10
- adversarial P0 semantic failures: 0
- blind semantic P0 failures: 0
- severe golden-case overfit: 0
- state/action semantic failures: 0

## Gate B — Contract / build quality

- production JSON Schema + semantic validator pass: 100%
- schema `additionalProperties` and type constraints are enforced in the production compiler path
- source SVG preflight known-unsafe blockers: 100%
- contract-to-asset semantic part mismatch correctly blocks build: 100%
- normalized SVG preserves viewBox, semantic parts, URL refs, and ARIA ID refs
- state values do not collide through `visual_states` string keys
- duplicate transition pairs: 0
- generated package contains all required files: 100%
- manifest integrity fields present for asset/controller/contract/profile/fixture: 100%

## Gate C — Runtime / interaction quality

- executable legacy fixtures: 4/4
- production end-to-end fixture: PASS
- browser/runtime errors: 0
- interaction correctness failures: 0
- rapid interaction stuck states: 0
- obsolete animation beats latest product state: 0
- RETARGET failures: 0
- REVERSE failures: 0
- COMPLETE queued-target settle failures: 0
- reduced-motion meaning preserved: 100%
- runtime state error after qualified transition: 0

## Gate D — Geometry / visual quality

- required semantic-part missing/degenerate geometry reaches PASS: 0
- stable-part invariant failures: 0
- final landing mismatch: 0
- target-size captures generated: 20/24/32/96px
- intermediate-frame captures generated at required sample points
- duplicate SVG IDs after normalization: 0
- external runtime references in production package: 0
- pinned-environment screenshot regression: PASS when baseline is enabled

## Gate E — Packaging / delivery

- `manifest.json > verification.status == PASS`
- mutation of integrity-tracked files invalidates verification
- package includes source, normalized asset, controller, contract, profile, build reports, verification reports, screenshots, and integration README
- production runtime is `svg-waapi` for RC2
- production capability envelope is limited to qualified behavior
- Lottie/Rive outputs are explicitly handoff/experimental, not production PASS

## Gate F — Blind production qualification

Run:

```bash
npm run test:qualification
```

Required before graduation:

- qualification suite total: >= 40 cases
- unseen successful build cases: 100%
- unsafe/dirty SVG blocker cases: 100%
- contract/platform fail-closed cases: 100%
- package mutation detection: 100%
- required semantic geometry hardening: 100%
- P0 qualification failures: 0

Current RC2 qualification evidence: `evals/QUALIFICATION-REPORT.md` and `evals/qualification-report.json` — **46/46 PASS** after qualification-found defects were fixed.

## RC2 qualified capability envelope

Production PASS is allowed only for:

- runtime: `svg-waapi`
- product input: boolean / discrete / derived
- reactivity: transition / persistent-static
- interruption: complete / reverse / retarget
- loop policy: never
- reduced motion: direct-state-establish / no-transient-motion

Continuous input, event-pulse, semantic loops, restrained-transition Reduced Motion, Lottie, dotLottie, and Rive must remain handoff/experimental until separately qualified.

## Absolute blockers

P0:

- wrong product state
- wrong state/action semantics
- runtime becomes business-state authority
- unsafe SVG passes production preflight unexpectedly
- JSON Schema-invalid contract reaches compiler/runtime
- contract/asset mapping mismatch reaches runtime
- unsupported RC2 capability receives production PASS
- obsolete animation beats latest product state
- COMPLETE leaves queued target stuck
- critical meaning disappears with reduced motion
- integrity-tracked package mutation is not detected
- runtime exception in qualified production fixture
- package claims PASS without completed verification

P1:

- stable geometry exceeds tolerance
- required semantic geometry is degenerate
- final landing differs from requested target
- exact visual baseline changes without review in a pinned environment

## Graduation rule

Do not tag `1.0.0` merely because the Skill validates as a Skill package.

Graduate RC2 to `1.0.0` only after Gate A–F pass in CI and project-specific platform/OEM validation confirms that the default capability profile matches the intended deployment environment.
