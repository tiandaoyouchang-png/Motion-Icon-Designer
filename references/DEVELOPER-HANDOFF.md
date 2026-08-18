# Developer Handoff

Create one canonical product contract before runtime-specific implementation.

# Canonical Contract

Example:

```json
{
  "id": "seat-heating",

  "product": {
    "input_model": "discrete",
    "representation_role": "value",
    "source_of_truth": "vehicle-state"
  },

  "state": {
    "source": 0,
    "target": 3,
    "persistent_target": 3
  },

  "behavior": {
    "reactivity": "transition",
    "interrupt_policy": "retarget"
  },

  "semantics": {
    "verb": "heat establishes upward",
    "primary_family": "emit-radiate",
    "secondary_family": "step-increment"
  },

  "geometry": {
    "stable_parts": ["seat"],
    "actors": [
      "heat-wave-1",
      "heat-wave-2",
      "heat-wave-3"
    ]
  },

  "motion": {
    "personality": "controlled-technical",
    "duration_token": "standard",
    "nominal_duration_ms": 220,
    "easing_token": "state",
    "overshoot": 0
  },

  "landing": {
    "type": "state",
    "persistent_visual": "three indicators visible"
  },

  "continuous_motion": {
    "enabled": false
  },

  "accessibility": {
    "reduced_motion": "direct-state-establish",
    "meaning_preserved": true
  },

  "implementation": {
    "preferred": "rive",
    "fallback": "svg-waapi"
  }
}
````

# Runtime Principle

Prefer:

setState({
heatLevel: 3
})

over:

playAnimation("Level3")

Business code communicates product facts.

The motion layer chooses visual interpolation.

# Runtime Adapter Contract

Adapters should expose a technology-independent surface:

```
class MotionIconAdapter {
  async load() {}
  async setState(state) {}
  async beginTransition(target) {}
  async seek(progress) {}
  async setReducedMotion(enabled) {}
  async getProductState() {}
  async getVisualState() {}
  async settle() {}
  async destroy() {}
}
```

# Handoff Template

Component:

Product input:

Representation role:

Source of truth:

State mapping:

Semantic verb:

Stable structure:

Actors:

Gesture family:

Motion personality:

Duration:

Easing:

Interrupt policy:

Landing:

Persistent target:

Continuous motion:

Reduced motion:

Preferred runtime:

Alternative runtime:

Runtime state API:

Verification cases:
