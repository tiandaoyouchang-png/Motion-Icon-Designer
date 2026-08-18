# Release Gate — Motion Icon Designer 1.0.0-rc2

RC2 is a production candidate only when all applicable gates pass.

## Gate A — Reasoning / semantic quality

- positive trigger precision >= 95%
- negative trigger precision >= 95%
- golden semantic cases: 10/10
- adversarial P0 semantic failures: 0
- blind PASS or stronger: >= 8/10
- blind P0 failures: 0
- severe golden-case overfit: 0
- state/action semantic failures: 0

## Gate B — Contract / build quality

- production contract schema/validator pass: 100%
- source SVG preflight correctly blocks known unsafe cases: 100%
- contract-to-asset semantic part mismatch correctly blocks build: 100%
- production build fixture success: 100%
- normalized SVG preserves viewBox and semantic parts: 100%
- generated package contains all required files: 100%
- generated manifest integrity fields present: 100%

## Gate C — Runtime / interaction quality

- executable legacy fixtures: 4/4
- production end-to-end fixture: PASS
- browser/runtime errors: 0
- interaction correctness failures: 0
- rapid interaction stuck states: 0
- obsolete animation beats latest product state: 0
- RETARGET final-state failures: 0
- reduced-motion meaning preserved: 100%

## Gate D — Geometry / visual quality

- stable-part invariant failures: 0
- final landing mismatch: 0
- target-size captures generated: 20/24/32/96px
- intermediate-frame captures generated at required sample points
- duplicate SVG IDs after normalization: 0
- external runtime references in production package: 0
- pinned-environment screenshot regression: PASS when baseline is enabled

## Gate E — Packaging / delivery

- `manifest.json > verification.status == PASS`
- package includes source, normalized asset, controller, contract, profile, build reports, verification reports, screenshots, and integration README
- no manual mutation after verification without re-running verification
- production runtime is `svg-waapi` for RC2
- Lottie/Rive outputs are explicitly marked handoff/experimental, not production PASS

## Absolute blockers

P0:

- wrong product state
- wrong state/action semantics
- runtime becomes business-state authority
- unsafe SVG passes the production preflight unexpectedly
- contract/asset mapping mismatch reaches runtime
- obsolete animation beats latest product state
- critical meaning disappears with reduced motion
- runtime exception in qualified production fixture
- package claims PASS without completed verification

P1:

- stable geometry exceeds tolerance
- final landing differs from requested target
- unqualified runtime/platform is presented as production-ready
- exact visual baseline changes without review in a pinned environment

## Graduation rule

Do not tag `1.0.0` merely because the Skill validates as a Skill package.

Graduate RC2 to `1.0.0` only after Gate A–E pass in CI and the SVG+WAAPI production pipeline has been exercised on a representative unseen icon set, including ambiguous inputs and build-blocked cases.
