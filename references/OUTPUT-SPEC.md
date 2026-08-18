# Output Specification

Choose output by mode.

## ANALYZE / DESIGN — single icon

### Functional Intent

### Product Model

Input model:

Representation role:

Source of truth:

Safety relevance:

### State Model

Allowed states:

Initial state:

Persistent state mapping:

### Semantic Concept

Verb:

No-motion justification when applicable:

### Geometry

Stable structure:

Actors:

Pivot / emitter / seam:

Movement axis:

### Gesture Family

Primary:

Secondary:

### Reactivity

Transition / continuous-response / event-pulse / persistent-static

### Motion Language

Personality:

Duration:

Easing:

Overshoot:

Loop policy:

### Interaction

Interrupt policy:

Reverse behavior:

Retarget behavior:

### Landing

### Reduced Motion

### Implementation

Production backend:

Platform profile:

Experimental/handoff alternative:

### Verification

List icon-specific gates and blockers.

## SYSTEM — Motion Icon Matrix

For batch/system work:

| Icon | Input | Role | States | Verb | Family | Actor | Reactivity | Timing | Landing | Interrupt | Backend | Verification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## BUILD — canonical contract

Create `contract.json` conforming to:

`schemas/motion-icon-contract.schema.json`

Do not omit persistent `visual_states`, platform profile, or verification scenarios.

## PACKAGE — production output

Return one complete `production-package/` as defined in `references/PRODUCTION-PACKAGE.md`.

Required status summary:

```text
Build: PASS | BLOCKED
Verification: PASS | FAIL | NOT_RUN
Runtime: svg-waapi
Platform profile: <id>
Contract: valid | invalid
Asset preflight: buildable | blocked
```

If blocked, return the blocker code and supporting report instead of pretending a production artifact exists.
