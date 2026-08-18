# Gesture Families

Gesture families are semantic motion grammar.

The family defines logic.

The glyph defines:

- direction
- distance
- pivot
- amplitude
- count
- sequencing

Never copy arbitrary geometry from unrelated icons.

## G01 Trace / Reveal

Use for:

- route
- check
- connection path
- signature
- completion stroke

## G02 Directional Travel

Use when an object goes somewhere.

Examples:

- download
- upload
- send
- navigation

## G03 Pivot / Hinge

Use for:

- shackle
- door
- lid
- folder
- lever

Identify the real visible pivot.

## G04 Separate / Rejoin

Use for:

- plug
- unlink
- coupling
- detach

Movement should follow the physical seam.

## G05 Arrive / Settle

Use when something reaches a destination.

Avoid automatic bouncing.

## G06 Fill / Level

Use for bounded magnitude.

Examples:

- battery
- tank
- temperature level

Keep the container stable.

## G07 Emit / Radiate

Use for:

- signal
- heat
- sound
- light
- radar

Identify the true emitter.

## G08 Step / Increment

Use for discrete levels.

Examples:

- seat heating
- fan speed
- signal bars

## G09 Functional Rotation

Use when rotation itself is meaningful.

Examples:

- fan
- refresh
- compass
- rotor

## G10 Contents in Frame

Keep frame stable while internal contents change.

Examples:

- calendar
- screen
- document
- device

## G11 Reshape

Use when the represented material actually changes form.

Do not morph rigid objects unnecessarily.

## G12 State Morph

Use for structural icon transitions.

Examples:

- menu ↔ close
- play ↔ pause
- plus ↔ check

The target must land exactly on the intended target glyph.

# Selecting a family

Ask:

1. What changed in the product?
2. What does the icon represent?
3. What would that object/signal naturally do?
4. Which part performs that verb?
5. Which gesture family describes it?
6. How does it land?

If an identical animation can be transferred to an unrelated icon unchanged,
it is probably decorative rather than semantic.

# Combining families

Normally use one primary family.

Secondary families are allowed only when causally justified.

Examples:

Download:
Directional Travel → Arrive

Seat Heating:
Emit + Step

Defrost:
Emit + Reveal
