
# Failure Catalog

## F01 Generic Whole-Icon Motion

Whole icon scales, shakes, or bounces while a semantic sub-part should act.

## F02 Infinite Stable-State Loop

A stable ON state loops its entrance animation forever.

## F03 State Ambiguity

Target state is unclear after animation stops.

## F04 Fake Physics

Every icon receives bounce/overshoot regardless of material.

## F05 Wrong Pivot

Door, lock, bell, lid, or lever rotates around arbitrary center.

## F06 Decorative Stagger

Elements stagger only because it looks polished.

## F07 Transition Used as State

Transition motion is required forever to communicate a stable state.

## F08 Reduced Motion Removes Meaning

Animation removal makes ON/OFF or level state ambiguous.

## F09 Technology-Led Design

Concept exists only because a particular runtime is available.

## F10 Slow High-Frequency Control

Frequent controls make users wait for expressive animation.

## F11 Mid-Transition Trap

Rapid input leaves icon stuck between states.

## F12 Duplicate SVG IDs

Multiple instances collide through mask/clip/gradient IDs.

## F13 Morph Topology Damage

Intermediate morph loses recognizability.

## F14 Unjustified Root Motion

Whole SVG moves when only a semantic part should act.

## F15 Over-Animation

Primary + secondary + ambient + overshoot + stagger on a tiny icon.

## F16 Visible Re-arm

Element resets while visible.

## F17 Invalid Reverse

Playing the ON transition backward creates incorrect OFF semantics.

## F18 State/Action Confusion

Visible glyph communicates current state when the UI needs available action,
or vice versa.

## F19 Golden-Case Overfit

Unseen icon copies arbitrary:

- geometry
- wave count
- timing
- runtime

from an unrelated reference example.
