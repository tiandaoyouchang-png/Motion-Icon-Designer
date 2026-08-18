# Implementation Selection

Choose technology after defining the product contract.

Ask:

1. Is state discrete, continuous, event-based, or derived?
2. Can users interrupt or retarget?
3. Does the final visual depend on live product data?
4. Is the motion mainly timeline choreography or persistent state?
5. What runtimes are approved on the target platform?
6. What is the team's authoring pipeline?
7. How will behavior be deterministically verified?

# SVG + CSS / WAAPI

Strong choice for:

- transform
- opacity
- stroke reveal
- simple morphs
- small web UI
- deterministic browser testing
- direct DOM control

Prefer semantic groups.

Avoid fragile selectors such as:

path:nth-child(3)

Use meaningful parts such as:

data-part="shackle"

# Lottie / dotLottie

Strong choice for:

- designer-authored vector choreography
- coordinated multi-layer timelines
- portable animation assets

Where supported, markers, segments, interactivity, and state-machine features
may help with product behavior.

Verify capability on the actual target runtime.

Do not assume every platform has identical support.

# Rive

Strong choice for:

- interactive multi-state icons
- live parameters
- retargetable controls
- continuous values
- state-machine/data-driven visual behavior

For modern projects prefer product data binding / view-model-driven
architecture where supported.

Business state should remain authoritative.

# Runtime Selection

Do not ask:

"Which animation technology is best?"

Ask:

"Which runtime best expresses this product-state contract on this target
platform?"

# User-mandated technology

When a user requires a specific runtime:

1. preserve product behavior
2. identify tradeoffs
3. adapt where feasible
4. state what becomes harder
5. offer alternatives only as comparison/fallback

Never silently weaken product correctness to fit a runtime.
