# Motion Language

Meaning comes from the gesture.

Personality modifies the gesture.

Do not reverse that priority.

# Personality Profiles

## Controlled Technical

Best default for:

- automotive HMI
- embedded systems
- professional tools

Suggested:

instant: 80–110ms
quick: 110–160ms
standard: 160–220ms
expressive: 220–300ms

Overshoot:
0–3%

## Premium Calm

quick: 140–190ms
standard: 200–300ms
expressive: 300–450ms

Overshoot:
0–2%

## Energetic

instant: 60–90ms
quick: 90–140ms
standard: 140–200ms

Overshoot:
0–5%

## Playful

quick: 120–180ms
standard: 180–280ms
expressive: 280–450ms

Overshoot:
5–15%

Avoid playful physics in safety-relevant HMI unless explicitly justified.

# Interaction Frequency

High-frequency controls:

- shorter
- lower amplitude
- minimal overshoot

Rare expressive events may use richer motion.

# Easing

Entering:
decelerate toward target.

Leaving:
controlled acceleration.

State transformation:
smooth state easing or restrained spring.

Constant mechanical movement:
linear may be correct.

# Timing hierarchy

Feedback should begin before decorative expression ends.

Example:

0ms
input acknowledged

30ms
semantic transition starts

180ms
target state already clear

220ms
minor settle ends

# Loop Policy

Loop only when ongoing motion communicates an ongoing process.

Potentially valid:

- loading
- scanning
- active fan
- recording
- continuous navigation feedback

Usually invalid:

- heater remains ON
- Wi-Fi connected
- door locked
- Bluetooth connected

# Design System Tokens

Define shared:

motion.instant
motion.quick
motion.standard
motion.expressive

ease.enter
ease.exit
ease.state
ease.continuous

overshoot.none
overshoot.subtle
overshoot.expressive
