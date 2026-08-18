
# HMI Golden Suite

Golden cases demonstrate reasoning.

They are not templates.

Never copy arbitrary:

- geometry
- element count
- direction
- timing
- runtime choice

into unrelated icons.

## 01 Seat Heating

Input:
discrete 0–3

Role:
value

Verb:
heat establishes upward

Family:
Emit + Step

Stable:
seat

Actors:
heat indicators

Landing:
state

Loop:
no

Interrupt:
RETARGET

## 02 Seat Ventilation

Input:
discrete

Verb:
airflow establishes through seat

Share level grammar with heating, but do not copy thermal geometry.

## 03 Climate Fan

Verb:
fan starts turning

Family:
Functional Rotation

Continuous loop:
conditionally valid when representing ongoing operation.

## 04 Defrost

Verb:
airflow clears windshield

Family:
Emit + Reveal

Causality:
air arrives before clearing response.

## 05 Lock

Verb:
shackle opens

Family:
Pivot / Hinge

Actor:
shackle

Stable:
body

Landing:
exact unlocked state

## 06 Charging

Distinguish:

- connected
- charging
- charged
- error

Do not collapse them into one generic electric animation.

## 07 Bluetooth

Do not invent fake mechanics for the rune.

"No semantic internal motion" can be a valid choice.

Use persistent connection semantics.

## 08 Wi-Fi

Verb:
signal establishes outward

Family:
Emit + Step

Signal topology differs from thermal rise.

## 09 Navigation Orientation

Input:
continuous heading

Verb:
pointer aligns to heading

Use shortest-angle transition.

350° → 10°
should normally travel +20°, not -340°.

## 10 Play / Pause

Product state:
playing / paused

Visible control may represent available action.

Must survive rapid reversal and repeated input.
