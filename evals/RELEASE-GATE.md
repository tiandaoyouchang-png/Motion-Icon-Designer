
# Release Gate

Release requires:

- positive trigger precision >= 95%
- negative trigger precision >= 95%
- golden cases: 10/10
- executable fixtures: 4/4
- adversarial P0 failures: 0
- interaction correctness failures: 0
- blind PASS or stronger: >= 8/10
- blind P0 failures: 0
- severe golden-case overfit: 0
- reduced-motion meaning preserved: 100%
- rapid interaction stuck states: 0

Absolute blockers:

- wrong product state
- wrong state/action semantics
- obsolete animation beats latest product state
- critical meaning disappears with reduced motion
