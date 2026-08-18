# Product States

Motion icons exist inside product behavior.

Define the product model before animation.

# Input Model

## BOOLEAN

Examples:

- locked / unlocked
- mute / unmute
- enabled / disabled

## DISCRETE

Examples:

- heat level 0–3
- fan speed 0–5
- suspension low / normal / high

## CONTINUOUS

Examples:

- heading angle
- distance
- sensor intensity
- progress percentage

## EVENT

Examples:

- notification
- arrival
- success
- action confirmed

## DERIVED

Examples:

- rain detected
- connection quality
- ADAS availability

# Representation Role

## STATUS

Communicates current state.

## ACTION

Communicates what the user can do next.

Example:

Product state:
playing

Visible media control:
pause

## MODE

Communicates the selected control strategy.

Example:

Auto headlights enabled.

This is different from headlights currently illuminated.

## VALUE

Communicates magnitude or level.

## PROGRESS

Communicates movement toward completion.

## ALERT

Communicates a condition requiring attention.

# Reactivity

## TRANSITION

A → B → stable target.

## CONTINUOUS RESPONSE

Visual behavior continuously maps live product data.

## EVENT PULSE

Short semantic response to an event.

## PERSISTENT STATIC

Stable visual state with no continuing motion.

# Persistent State

Always distinguish:

transition behavior

from:

persistent target presentation.

Example:

Seat heater OFF → Level 3

Transition:
heat indicators establish.

Persistent:
three indicators remain visible and stable.

# Interaction Interruption

## COMPLETE

Finish current semantic event before another visual transition.

Use rarely.

## REVERSE

Smoothly reverse toward previous state.

Suitable for simple binary structural states.

## RETARGET

Continue from current visual state toward newest requested state.

Preferred for:

- levels
- continuous values
- rapid controls

Latest product state always wins.

# Source of Truth

Correct:

Application / Vehicle / Device State
→ Motion Adapter
→ Animation Runtime

Avoid:

Animation Runtime
→ inferred business state

Examples:

heatLevel = 3
fanLevel = 2
isLocked = true
connectionState = connected
playbackState = playing

# Automotive / HMI

For HMI:

- respond quickly
- use modest amplitude
- preserve legibility
- avoid unnecessary loops
- leave stable states stable
- do not use motion as the only carrier of critical meaning
