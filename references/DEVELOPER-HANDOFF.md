# Developer Handoff and Canonical Contract

Create one canonical product contract before runtime-specific implementation.

The production contract is machine-readable and must conform to:

`schemas/motion-icon-contract.schema.json`

Validate it before build:

```bash
node scripts/validate-contract.mjs contract.json \
  --profile profiles/web-svg-waapi.json
```

## Contract responsibilities

The contract owns:

- product input model
- representation role
- authoritative source of truth
- allowed states and initial state
- semantic verb and gesture family
- named stable/actor geometry parts
- persistent visual states
- transition tracks
- interruption policy
- landing behavior
- reduced-motion behavior
- runtime/platform profile
- verification scenarios

The source SVG owns geometry. The contract references semantic `data-part` names; it must not depend on nth-child or incidental path ordering.

## Runtime principle

Prefer business code communicating product facts:

```js
controller.setState("locked")
controller.beginTransition("unlocked")
```

or structured product data at the application adapter boundary.

Avoid business code requesting named animation clips:

```js
playAnimation("UnlockClip")
```

The motion layer chooses visual interpolation while the product layer remains authoritative.

## SVG/WAAPI production API

The generated `controller.js` exposes:

```js
const api = MotionIconRuntime.create(root, contract)

api.setState(state)
api.beginTransition(target)
api.seek(progress)
api.settle()
api.setReducedMotion(enabled)
api.getState()
api.getVisualState()
api.getTestScenarios()
api.reset()
```

`setState` establishes a persistent product state directly.

`beginTransition` performs semantic interpolation toward a requested state. Under RETARGET/REVERSE, active motion is interrupted from the current visual pose so the latest requested state wins.

Reduced motion must still establish the requested target state.

## Handoff checklist

Component id:

Product input:

Representation role:

Source of truth:

Allowed states:

Initial state:

Semantic verb:

Stable structure:

Actors:

Pivot / emitter / seam:

Gesture family:

Motion personality:

Duration/easing:

Interrupt policy:

Landing:

Persistent state mapping:

Reduced motion:

Runtime:

Platform profile:

Runtime state API:

Verification scenarios:

Verification status:

Package manifest:

## Production handoff rule

A handoff is not a production package until build and verification gates pass. For RC2, only the SVG+WAAPI backend can receive production `PASS` status.
