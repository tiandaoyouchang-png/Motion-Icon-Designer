# Motion Icon Verification v2

Do not judge only from a looping preview or screenshot contact sheet.

A production candidate must prove semantic, contract, runtime, geometry, interaction, accessibility, and packaging correctness.

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
- contract validates against the platform profile

P0 failure examples:

- wrong product state
- wrong state/action semantics
- missing persistent visual state
- runtime becomes business-state authority

## Gate B — Asset and DOM correctness

Verify:

- exactly one `[data-motion-icon]` root
- valid/stable viewBox
- no duplicate SVG IDs
- no blocked external references
- no unexpected root transform
- every contract actor/stable part exists as `data-part`
- finite root bounds
- source asset passed preflight

## Gate C — Runtime and interaction correctness

Verify:

- no browser page errors
- no failed runtime resources
- no unhandled console errors
- final state equals latest requested product state
- animation is settled after seek/landing
- rapid input does not leave a stuck intermediate state
- RETARGET/REVERSE reaches the latest requested state
- missing/obsolete transition never beats current product state

Interrupt at representative points such as 25%, 50%, and 75% when the icon's risk profile requires it.

## Gate D — Geometry and actual-size correctness

Capture representative frames at intended sizes, commonly:

- 20px
- 24px
- 32px
- 96px inspection size

Check:

- stable parts remain within configured geometry tolerance
- semantic actor movement follows the correct pivot/emitter/seam
- silhouettes remain recognizable
- no clipping or unexpected root-bound expansion
- target geometry lands exactly

Verifier v2 automatically checks configured stable-part bounds when `getVisualState()` and a production contract are available.

## Gate E — Reduced motion

State meaning must survive.

Reduced motion may:

- remove travel
- remove overshoot
- switch directly to target
- use a restrained transition

It must not erase the target state. Every allowed state should remain establishable with reduced motion enabled.

## Gate F — Visual regression

Screenshots are evidence, not validation by themselves.

Verifier v2 can write and compare exact screenshot hashes:

```bash
node scripts/verify-motion-icon.mjs production-package \
  --write-baseline baseline.json

node scripts/verify-motion-icon.mjs production-package \
  --baseline baseline.json
```

Exact hashes are appropriate only in a pinned browser/OS rendering environment. Treat them as deterministic CI regression evidence, not a cross-platform perceptual metric.

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
- browser/runtime exception during qualified verification

P1:

- stable geometry moves beyond tolerance
- final landing differs from contract target
- high-frequency interaction snaps/sticks unexpectedly
- actual-size icon loses recognizability
