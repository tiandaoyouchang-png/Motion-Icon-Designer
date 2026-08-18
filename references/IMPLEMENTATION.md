# Implementation and Platform Selection

Choose implementation only after product semantics are defined.

## Production principle

Use:

PRODUCT CONTRACT
+
PLATFORM CAPABILITY PROFILE
→ FEASIBLE MOTION BUILD

Platform constraints may narrow implementation choices. They must not redefine product state, representation role, or semantic meaning.

## Questions before build

1. Is state boolean, discrete, continuous, event-based, or derived?
2. Can users interrupt or retarget?
3. Does the final visual depend on live product data?
4. Is the motion a transition, event pulse, or ongoing response?
5. Which runtimes are approved on the target platform?
6. Which SVG features are supported and allowed?
7. What are the duration, asset-size, rendering, and accessibility limits?
8. How will the behavior be deterministically verified?

## RC2 production capability envelope

### SVG + WAAPI — production

The RC2 production controller is qualified only for:

- product input: `boolean`, `discrete`, `derived`
- reactivity: `transition`, `persistent-static`
- interruption: `complete`, `reverse`, `retarget`
- loop policy: `never`
- reduced motion: `direct-state-establish`, `no-transient-motion`
- tested SVG features allowed by `profiles/web-svg-waapi.json`

Fail closed for RC2 production when the contract requests:

- live `continuous` input / `continuous-response`
- `event` input / `event-pulse` rearm semantics
- `while-active` or `continuous-semantic` loops
- `restrained-transition` reduced motion
- a runtime other than `svg-waapi`

These behaviors may still be designed or handed off, but must not receive production PASS from the RC2 backend.

Strengths:

- direct DOM control
- explicit semantic `data-part` mapping
- deterministic state APIs
- browser-based verification
- transform, opacity, stroke, fill, and simple structural transitions
- conservative failure on unsupported SVG features

Run asset preflight before build. Use `profiles/web-svg-waapi.json` as the default tested capability envelope.

The default profile intentionally blocks scripts, foreignObject, embedded raster images, external references, filters, inline handlers, and other unqualified features. Expand the profile only after target-runtime qualification.

Prefer semantic groups/parts:

```html
<g data-part="shackle">...</g>
```

Avoid fragile selectors such as `path:nth-child(3)`.

### Lottie / dotLottie — handoff/experimental in RC2

Useful for designer-authored vector choreography and coordinated multi-layer timelines.

Do not mark a Lottie output as RC2 production-ready until a dedicated compiler, target-runtime capability profile, and deterministic verification backend are implemented and qualified.

Verify marker, segment, state-machine, interactivity, clipping, text/font, and platform capabilities on the exact target runtime.

### Rive — handoff/experimental in RC2

Useful for interactive multi-state icons, live parameters, continuous values, and state-machine/data-driven behavior.

Do not mark a Rive output as RC2 production-ready until binary authoring/compilation, binding validation, target-runtime qualification, and deterministic verification are implemented.

Business state remains authoritative.

## Capability profiles

A platform profile should define at least:

- runtime id
- allowed/blocked SVG or runtime features
- external reference policy
- maximum asset size
- maximum duration
- maximum overshoot
- stable-part tolerance
- target verification sizes

The contract must name the profile it was built against.

## User-mandated technology

When a user requires a specific runtime:

1. preserve product behavior
2. identify target platform limits
3. use production backend only when qualified
4. otherwise provide a handoff-only or experimental result
5. state tradeoffs explicitly

Never silently weaken product correctness to fit a runtime.
