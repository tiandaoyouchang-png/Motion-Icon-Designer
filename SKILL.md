---
name: design-motion-icons
description: Design, review, systematize, hand off, and verify semantic motion icons and icon micro-interactions for product UI, automotive HMI, mobile, web, embedded interfaces, and design systems. Use for static-to-animated icons, SVG/Lottie/Rive icon behavior, hover/tap/active/disabled/loading/level states, icon morphs, motion-icon reviews, icon motion systems, implementation handoff, and semantic or interaction verification. Do not use for general page animation, cinematic/video animation, character animation, or unrelated decorative motion.
---

# Design Motion Icons

Design product behavior expressed through icon motion.

Use:

PRODUCT STATE
→ REPRESENTATION ROLE
→ SEMANTIC VERB
→ GEOMETRY
→ GESTURE FAMILY
→ REACTIVITY
→ MOTION LANGUAGE
→ LANDING
→ IMPLEMENTATION
→ VERIFICATION

## 1. Understand the product model

Identify:

- source state
- target state
- persistent target state
- product input model
- representation role
- source of truth
- interaction frequency
- whether activity continues after the transition

Input models:

- boolean
- discrete
- continuous
- event
- derived

Representation roles:

- status
- action
- mode
- value
- progress
- alert

Read `references/PRODUCT-STATES.md` when state semantics are non-trivial.

Product state is authoritative.

Animation state is not.

## 2. Name the semantic verb

Describe what the represented object, signal, or material naturally does.

Good:

- heat rises
- bell rings
- battery fills
- fan turns
- signal radiates
- shackle opens
- pointer aligns
- lines reform

Do not begin from generic visual effects such as:

- scale
- bounce
- shake
- spin

unless that movement itself carries the intended meaning.

Decorative/control feedback is allowed when requested, but label it separately
from semantic icon motion.

## 3. Inspect geometry

When vector geometry exists, identify:

- stable structure
- semantic actor
- pivot
- seam
- emitter
- container
- direction
- symmetry
- clipping / occlusion

Do not animate the root icon by default.

Root motion is valid only when the whole represented object performs the
semantic action.

When geometry is inferred from a screenshot or raster image, say so.

## 4. Select a gesture family

Read `references/GESTURE-FAMILIES.md`.

Reuse semantic grammar.

Do not blindly reuse exact:

- keyframes
- distances
- pivots
- rotations
- stagger values
- element counts

Shared family does not mean identical animation.

## 5. Define reactivity

Choose:

- transition
- continuous-response
- event-pulse
- persistent-static

A stable ON state normally becomes visually stable after its transition.

Continuous animation requires an ongoing semantic reason.

## 6. Define the landing

Choose:

- return
- target-state
- symmetry
- hidden-rearm
- morph

Separate transient animation from persistent state presentation.

## 7. Apply motion language

Read `references/MOTION-LANGUAGE.md`.

Select:

- personality
- duration token
- easing
- amplitude
- overshoot
- sequencing
- loop policy

Frequently used controls should generally be faster and quieter.

For automotive HMI, prioritize:

1. state clarity
2. responsiveness
3. low distraction
4. consistency
5. semantic motion
6. aesthetic flourish

## 8. Define interruption behavior

For interactive controls choose:

- COMPLETE
- REVERSE
- RETARGET

Product state takes priority over completion of obsolete animation.

Level and continuously changing controls usually prefer RETARGET.

## 9. Design reduced motion

Preserve state meaning.

Reduce:

- travel
- bounce
- overshoot
- decorative follow-through

Do not remove the target state.

## 10. Select implementation

Read `references/IMPLEMENTATION.md`.

Choose runtime based on:

- state complexity
- interruption / retarget requirements
- live product data
- target platform
- team pipeline
- runtime maturity
- deterministic testing requirements

Technology is downstream of behavior.

## 11. Create developer handoff

When implementation is requested, read:

`references/DEVELOPER-HANDOFF.md`

Create one canonical product contract first.

Then map it to:

- SVG / WAAPI
- dotLottie / Lottie
- Rive
- another approved runtime

Business code should normally set product state rather than request named
animation clips.

## 12. Verify

Read `references/VERIFICATION.md`.

Verify:

- semantic meaning
- state/action correctness
- persistent state
- actual-size legibility
- intermediate frames
- landing
- rapid interaction
- interruption
- reduced motion
- duplicate instances
- latest product state wins

Use `scripts/verify-motion-icon.mjs` when a runnable implementation exists.

# Modes

## DESIGN

Create semantic motion for one or more icons.

## REVIEW

Diagnose before redesigning.

Prioritize:

P0 — semantic/state correctness

P1 — interaction/legibility

P2 — motion-system consistency

P3 — polish

## SYSTEM

For icon libraries establish:

Product State Grammar
→ Motion Personality
→ Gesture Families
→ Timing Tokens
→ Loop Policy
→ Implementation Rules
→ Verification Rules

Then create a Motion Icon Matrix.

## HANDOFF

Translate the canonical motion contract into production implementation.

## VERIFY

Run design and implementation gates.

# Important distinctions

CONTROL FEEDBACK
≠
ICON SEMANTIC MOTION

TRANSITION
≠
PERSISTENT STATE

PRODUCT STATE
≠
ANIMATION STATE

CURRENT STATE
≠
AVAILABLE ACTION

GESTURE FAMILY
≠
COPY-PASTED KEYFRAMES

# Decorative motion policy

Decorative motion is allowed.

Examples:

- subtle button scale
- hover glow
- brand-character bounce
- elevation response
- celebratory sparkle

Treat it as a separate layer.

CONTROL / BRAND MOTION
+
SEMANTIC ICON MOTION
+
PRODUCT STATE

may coexist.

Do not use decoration as a substitute for missing state semantics.

# Reference routing

Product states:
`references/PRODUCT-STATES.md`

Gesture grammar:
`references/GESTURE-FAMILIES.md`

Timing and personality:
`references/MOTION-LANGUAGE.md`

Runtime selection:
`references/IMPLEMENTATION.md`

Developer delivery:
`references/DEVELOPER-HANDOFF.md`

Quality gates:
`references/VERIFICATION.md`

HMI examples:
`references/HMI-GOLDEN-SUITE.md`

Failure diagnosis:
`references/FAILURE-CATALOG.md`

Output schemas:
`references/OUTPUT-SPEC.md`

Load only references needed for the current task.
