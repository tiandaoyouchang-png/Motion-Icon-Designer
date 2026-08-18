
# Motion Icon Verification

Do not judge only from a looping preview.

# V1 Semantic Test

Does movement belong to the represented object/signal?

If identical keyframes transfer unchanged to an unrelated icon, review the
semantic design.

# V2 Product State Test

Verify:

source state is correct
target state is correct
persistent target remains correct

# V3 Representation Test

Is the icon showing:

- status
- action
- mode
- value
- progress
- alert

correctly?

# V4 Rest / Landing Test

Verify:

- position
- scale
- rotation
- stroke
- fill
- opacity
- clipping
- target geometry

# V5 Intermediate Frame Test

Sample key moments.

Check:

- recognizability
- collisions
- broken silhouettes
- morph midpoint
- hidden swaps
- peak deformation

# V6 Motion Test

Check:

- bad pivot
- abrupt reset
- excessive speed
- accidental pause
- unnecessary bounce
- clipping
- shimmer

# V7 Duplicate Instance Test

Check:

- SVG ID collisions
- clipPath collisions
- masks
- gradients
- filters
- shared runtime state

# V8 Reduced Motion Test

State meaning must survive.

Reduced motion may:

- remove travel
- remove overshoot
- switch directly to target
- use a restrained transition

It must not erase target state.

# V9 Actual Size Test

Review at intended sizes.

Common:

20px
24px
32px

Use enlarged size such as 96px for geometry inspection.

# V10 Interaction Test

Test:

- rapid repeat
- reverse
- retarget
- disabled state
- re-entry

# V11 Retarget Continuity Test

Interrupt at:

25%
50%
75%

Request a different valid target.

Verify:

- no snap back
- obsolete target does not win
- no stuck intermediate pose
- final visual matches latest product state

# V12 State vs Action Test

Example:

Product state:
playing

Visible media control:
pause

Incorrect mapping is a semantic failure.

# Release Blockers

P0:

- wrong product state
- wrong state/action semantics
- critical meaning disappears under reduced motion
- animation runtime becomes business-state authority

P1:

- rapid interaction leaves stuck intermediate state
- obsolete animation target wins
- final landing does not match requested state
- unjustified distracting stable-state loop
