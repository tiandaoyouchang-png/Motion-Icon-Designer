# Motion Icon Designer

**Motion Icon Designer** 是一套以 **Product State（产品状态）** 为起点的语义动态图标设计与量产执行工作流。

它不仅用于“想动效”，还负责把产品状态、SVG 几何、语义动作、动效语言和平台约束收敛成可执行的 **SVG + WAAPI** 量产候选，并生成自动验证报告与标准交付包。

Skill 名称：

`design-motion-icons`

当前版本：

`1.0.0-rc2`

> RC2 的量产 backend **只承诺 SVG + WAAPI**。Lottie / dotLottie / Rive 目前保留为设计交付与实验性 backend，不应标记为 production PASS。

## 核心模型

```text
产品状态 Product State
→ 表达角色 Representation Role
→ 语义动词 Semantic Verb
→ 几何结构 Geometry
→ 手势家族 Gesture Family
→ 响应方式 Reactivity
→ 动效语言 Motion Language
→ Canonical Contract
→ Platform Capability
→ Build
→ Verification
→ Production Package
```

## 为什么不是“给图标加动画”

量产动态图标首先要保证产品事实正确：

```text
产品 / 车辆 / 设备状态
→ Motion Contract
→ Runtime Controller
→ Visual State
```

动画运行时不能反过来成为业务状态来源。

必须区分：

```text
Control Feedback ≠ Semantic Icon Motion
Transition ≠ Persistent State
Product State ≠ Animation State
Current State ≠ Available Action
Platform Constraint ≠ Product Semantics
Captured Screenshot ≠ Verified Screenshot
```

## RC2 新增：端到端 SVG + WAAPI 量产管线

RC1 主要解决“如何正确设计、交付和验证动态图标”。

RC2 增加真正的执行层：

```text
Source SVG
+
Product State / Motion Contract
+
Platform Profile
↓
Asset Preflight
↓
SVG Normalization
↓
SVG + WAAPI Compile
↓
Runtime Verification
↓
Production Package
```

### 1. Canonical Contract Schema

正式 contract 定义在：

```text
schemas/motion-icon-contract.schema.json
```

contract 必须包含：

- 产品输入模型与 source of truth
- allowed states / initial state
- representation role
- semantic verb / gesture family
- stable parts / actors
- persistent visual states
- transition tracks
- interrupt policy
- reduced motion
- runtime / platform profile
- verification scenarios

### 2. Asset Preflight

```bash
node scripts/asset-preflight.mjs icon.svg \
  --profile profiles/web-svg-waapi.json \
  --mode intake \
  --out preflight.json
```

默认会检查：

- viewBox
- SVG 大小
- scripts / foreignObject / embedded raster 等阻断元素
- 外部引用
- inline event handler
- duplicate IDs
- broken internal references
- `data-part` 语义标注

不安全资产会直接进入 `BLOCKED`，而不是继续生成一个“看起来能跑”的错误结果。

### 3. SVG Normalizer

```bash
node scripts/svg-normalizer.mjs annotated.svg \
  --out normalized.svg \
  --id-prefix my-icon
```

主要负责：

- 添加 `[data-motion-icon]`
- 补齐 SVG namespace
- 确定性 ID 前缀
- 同步重写 `url(#id)` / `href="#id"`
- 保留 `data-part`
- 输出 normalization report

### 4. SVG + WAAPI Compiler

```bash
node scripts/svg-waapi-compiler.mjs \
  --svg normalized.svg \
  --contract contract.json \
  --profile profiles/web-svg-waapi.json \
  --out production-package
```

compiler 会检查 contract 和 SVG 的 semantic part 是否一致，然后生成 runtime controller、fixture、manifest 和编译报告。

### 5. 一键 Build

```bash
node scripts/build-motion-icon.mjs \
  --svg annotated.svg \
  --contract contract.json \
  --profile profiles/web-svg-waapi.json \
  --out production-package
```

默认流程会执行：

```text
preflight
→ contract validation
→ normalization
→ build-mode preflight
→ compile
→ runtime verification
```

任何 P0 gate 失败都会停止构建。

## Verifier v2

```bash
node scripts/verify-motion-icon.mjs production-package \
  --out production-package
```

Verifier v2 不再只是截图工具。

它会检查：

- 单一 `[data-motion-icon]` root
- duplicate SVG IDs
- external references
- contract / asset semantic parts
- stable-part geometry invariant
- 20 / 24 / 32 / 96px 实际尺寸
- 0 / 10 / 25 / 50 / 75 / 90 / 100% 中间帧
- final landing
- RETARGET / rapid interaction
- latest product state wins
- reduced motion target meaning
- browser console / page / request failures
- 可选的 pinned-environment screenshot hash baseline

验证完成后：

```json
{
  "verification": {
    "status": "PASS"
  }
}
```

会写入 `manifest.json`。

**没有 PASS，不应宣称量产可用。**

## 标准 Production Package

```text
production-package/
├── source.svg
├── motion-icon.svg
├── controller.js
├── contract.json
├── platform-profile.json
├── manifest.json
├── preflight-report.json
├── normalize-report.json
├── compile-report.json
├── fixture.html
├── verify-report.json
├── verify-report.html
├── screenshots/
└── README.md
```

开发拿到的是一套可追溯、可运行、可验证的交付物，而不是几段零散代码。

## Runtime API

生成的 SVG + WAAPI controller 使用产品状态 API：

```js
const api = MotionIconRuntime.create(root, contract)

api.setState("locked")
api.beginTransition("unlocked")
api.setReducedMotion(true)
```

而不是：

```js
playAnimation("UnlockClip")
```

业务代码表达产品事实，motion layer 负责视觉插值。

## RETARGET

用户在动画中途再次操作时：

```text
旧目标
× 不应该继续赢

当前视觉姿态
→ 最新产品目标
```

RC2 controller 会从当前视觉姿态重新建立目标过渡；Reduced Motion 开启时则直接建立最新目标状态。

## Platform Capability Profile

默认 profile：

```text
profiles/web-svg-waapi.json
```

它定义：

- runtime
- SVG allowlist / blocklist
- external reference policy
- asset size 上限
- duration 上限
- overshoot 上限
- stable geometry tolerance
- 验证尺寸

量产设计不是：

```text
Motion Design → 强行塞进 Runtime
```

而是：

```text
Product Semantics
+
Platform Capability
→ Feasible Motion Build
```

## 运行 RC2 端到端样例

仓库提供：

```text
fixtures/production-lock/
├── source.svg
└── contract.json
```

执行：

```bash
npm run build:production-lock
```

或者只跑非浏览器 gate：

```bash
npm run test:static
npm run test:production
```

现有四个 RC1 fixture 仍保留用于兼容性验证：

```bash
npm run verify:seat
npm run verify:lock
npm run verify:wifi
npm run verify:media
```

## 浏览器依赖

Verifier 优先使用 Playwright Chromium；如果 Playwright 不存在，也可以尝试系统 Chromium 的 CDP fallback。

标准 CI 建议：

```bash
npm install --no-audit --no-fund
npx playwright install --with-deps chromium
npm run test:production
```

## Hard Blockers

以下情况应停止或降级，而不是继续“生成”：

- `NEEDS_PRODUCT_MODEL`
- `CONTRACT_CONFLICT`
- `NO_INTERNAL_SEMANTIC_MOTION`
- `ASSET_NORMALIZATION_REQUIRED`
- `RUNTIME_UNSUPPORTED`
- `BUILD_BLOCKED`
- `VERIFY_FAILED`

能正确拒绝不可靠输入，是量产能力的一部分。

## Release Gate

详见：

```text
evals/RELEASE-GATE.md
```

正式 `1.0.0` 必须同时通过：

- 语义 / Product State Gate
- Contract / Build Gate
- Runtime / Interaction Gate
- Geometry / Visual Gate
- Packaging / Delivery Gate

Skill validator 通过并不等于 production-ready。

## 仓库结构

```text
Motion-Icon-Designer/
├── SKILL.md
├── README.md
├── schemas/
│   └── motion-icon-contract.schema.json
├── profiles/
│   └── web-svg-waapi.json
├── agents/
│   └── openai.yaml
├── references/
├── scripts/
│   ├── asset-preflight.mjs
│   ├── svg-normalizer.mjs
│   ├── svg-waapi-compiler.mjs
│   ├── build-motion-icon.mjs
│   ├── verify-motion-icon.mjs
│   ├── browser-driver.mjs
│   ├── runtime/
│   └── adapters/
├── fixtures/
│   ├── production-lock/
│   ├── seat-heating/
│   ├── lock/
│   ├── wifi/
│   └── play-pause/
└── evals/
```

## 设计来源与参考

本工作流参考了公开的 Motion Design 与 Semantic SVG Animation 实践，包括 SoraLabsOSS `animating-icons` 与 LottieFiles `motion-design-skill` 等项目。

Motion Icon Designer 在此基础上重点建立：

- Product State first
- HMI state semantics
- Gesture Family
- Canonical Contract
- Platform Capability Profile
- SVG + WAAPI compiler
- RETARGET runtime
- Automated Verification
- Production Package
- Golden / Adversarial / Blind Eval

## License

MIT
