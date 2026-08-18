# Motion Icon Verification v2

Do not judge only from a looping preview or screenshot contact sheet.

A production candidate must prove contract, runtime, geometry, interaction, accessibility, integrity, and packaging correctness.

Run:

```bash
node scripts/verify-motion-icon.mjs production-package \
  --out production-package
```

## Gate A — Product and contract correctness

Verify:

- source/target states are valid
- representation role is correct
- persistent target exists
- current state is not confused with available action
- product state remains authoritative
- JSON Schema and semantic contract validation pass
- contract stays inside the qualified platform capability envelope

P0 failure examples:

- wrong product state
- wrong state/action semantics
- missing persistent visual state
- runtime becomes business-state authority
- unsupported continuous/event/loop capability presented as RC2 production-ready

## Gate B — Asset, DOM, and geometry correctness

Verify:

- exactly one `[data-motion-icon]` root
- valid/stable viewBox
- no duplicate SVG IDs
- no duplicate semantic `data-part` names
- no blocked external references
- no unexpected root transform
- every contract actor/stable part exists as `data-part`
- required semantic parts have finite, non-degenerate bounds
- stable parts stay within configured geometry tolerance
- source asset passed preflight

## Gate C — Package integrity

The generated manifest records hashes for:

- `motion-icon.svg`
- `controller.js`
- `contract.json`
- `platform-profile.json`
- `fixture.html`

Verifier v2 recomputes these hashes before runtime checks. Any mismatch is a verification failure.

A prior PASS is invalid after manual mutation of an integrity-tracked file. Re-run verification after every generated-package change.

## Gate D — Runtime and interaction correctness

Verify:

- no browser page errors
- no failed runtime resources
- no unhandled console errors
- final state equals latest requested product state
- no runtime `lastError` remains after a qualified transition
- animation is settled after landing
- rapid input does not leave a stuck intermediate state
- RETARGET reaches the newest state from current visual pose
- REVERSE returns to the requested prior state
- COMPLETE finishes the active transition and then settles the latest queued target
- missing/obsolete transition never beats current product state

Interrupt at representative points such as 25%, 50%, and 75% when risk requires it.

## Gate E — Actual-size visual evidence

Capture representative frames at intended sizes, commonly:

- 20px
- 24px
- 32px
- 96px inspection size

Check:

- actor movement follows the intended pivot/emitter/seam
- silhouettes remain recognizable
- no clipping or unexpected root-bound expansion
- target geometry lands exactly

Screenshots are evidence, not validation by themselves.

## Gate F — Reduced motion

State meaning must survive.

RC2 production supports:

- `direct-state-establish`
- `no-transient-motion`

`restrained-transition` is a design/handoff option but is not a qualified RC2 production behavior yet and must fail contract validation for BUILD/PACKAGE.

Every allowed state should remain directly establishable with reduced motion enabled.

## Gate G — Visual regression

Verifier v2 can write and compare exact screenshot hashes:

```bash
node scripts/verify-motion-icon.mjs production-package \
  --write-baseline baseline.json

node scripts/verify-motion-icon.mjs production-package \
  --baseline baseline.json
```

Exact hashes are appropriate only in a pinned browser/OS rendering environment. Treat them as deterministic CI regression evidence, not a cross-platform perceptual metric.

## Qualification suite

Run:

```bash
npm run test:qualification
```

The RC2 qualification suite includes unseen successful builds, unsafe SVG blockers, contract/platform blockers, integrity mutation attacks, geometry hardening, and interruption-policy cases.

## Output

The verifier writes:

- `verify-report.json`
- `verify-report.html`
- `screenshots/`
- `manifest.json > verification`

A production package must have:

```json
{
  "verification": {
    "status": "PASS"
  }
}
```

## Absolute blockers

P0:

- wrong product state
- wrong state/action semantics
- latest product state does not win
- reduced motion loses critical meaning
- contract/asset semantic part mismatch
- unsafe SVG feature passes build unexpectedly
- integrity-tracked package mutation is not detected
- browser/runtime exception during qualified verification
- package claims support for an unqualified RC2 capability

P1:

- stable geometry moves beyond tolerance
- required semantic part is degenerate
- final landing differs from contract target
- high-frequency interaction snaps/sticks unexpectedly
- actual-size icon loses recognizability
