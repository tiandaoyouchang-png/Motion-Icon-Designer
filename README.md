# Motion Icon Designer

**Motion Icon Designer** is a product-state-first workflow for designing,
reviewing, implementing, and verifying semantic animated icons across UI,
automotive HMI, mobile, web, and embedded interfaces.

Skill name:

`design-motion-icons`

## Core model

```
Product State
→ Representation Role
→ Semantic Verb
→ Geometry
→ Gesture Family
→ Reactivity
→ Motion Language
→ Interrupt Policy
→ Canonical Contract
→ Runtime
→ Verification
```

## What it is for

- animated UI icons
- automotive HMI motion icons
- icon state transitions
- SVG icon animation
- Lottie / dotLottie behavior
- Rive-driven product-state icons
- motion icon design systems
- developer handoff
- motion QA

## Main distinction

Control feedback is not the same as semantic icon motion.

A button may scale on press while the icon inside performs a separate
state-relevant semantic action.

## Installation / development

Install dependencies:

```
npm install
npx playwright install chromium
```

Run a fixture:

```
npm run verify:seat
```

Other fixtures:

```
npm run verify:lock
npm run verify:wifi
npm run verify:media
```

## Status

`1.0.0-rc1`

The release candidate should graduate to `1.0.0` only after the release gate
passes.

## Influences

The workflow was informed by public motion-design and semantic SVG animation
work from projects such as SoraLabsOSS `animating-icons` and LottieFiles
`motion-design-skill`.

The product-state model, HMI state layer, canonical developer contract,
runtime-routing model, retarget policy, and verification system in this
repository form the Motion Icon Designer workflow.
