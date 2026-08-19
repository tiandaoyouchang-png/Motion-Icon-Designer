# Motion Icon Designer

**Motion Icon Designer** 是一套以 **Product State（产品状态）** 为起点的语义动态图标设计与量产执行工作流。

它不仅用于“想动效”，还负责把产品状态、SVG 几何、语义动作、动效语言和平台约束收敛成可执行的 **SVG + WAAPI** 量产候选，并生成自动验证报告与标准交付包。

Skill 名称：

`design-motion-icons`

当前版本：

`1.0.0-rc4`

> RC4 的量产 backend **只承诺 SVG + WAAPI**。Lottie / dotLottie / Rive 目前保留为设计交付与实验性 backend，不应标记为 production PASS。

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

## RC2–RC4：端到端 SVG + WAAPI 量产管线

RC1 主要解决“如何正确设计、交付和验证动态图标”。

RC2 增加真正的执行层；RC3 通过真实 SVG 盲测补强 ownership / renderability；RC4 把这些经验固化为可追溯案例账本、README 自动同步、release consistency 检查，并把完整 production fixture 从 1 个扩展到 4 个：

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
- 所有可渲染 primitive 是否都归属于 `data-part`

Build 模式要求 **100% visible-geometry ownership**：设计网格、辅助线、debug mark 等未归属几何会以 `UNOWNED_VISIBLE_GEOMETRY` 直接阻断。

不安全或不完整资产会直接进入 `BLOCKED`，而不是继续生成一个“看起来能跑”的错误结果。

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

compiler 会检查 contract 和 SVG 的 semantic part 是否一致，并要求 SVG 中每个 `data-part` 都被 contract 声明。额外的 `data-part` 会以 `UNDECLARED_SEMANTIC_PART` 阻断，然后才生成 runtime controller、fixture、manifest 和编译报告。

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

## RC4 证据与回归加固

RC3 已经解决真实设计稿 SVG 暴露出的两个假 PASS 风险：

1. **Visible Geometry Ownership**：所有可渲染 primitive 必须归属于 contract 声明的 semantic part；红色网格、辅助圆、对角线等设计辅助几何不能混入量产资产。
2. **Semantic Part Renderability**：仅有 `data-part` 名字不够。required part 必须拥有非零几何，并且至少在一个 allowed product state 中真正可渲染。空 `<path data-part="..."/>` 必须 FAIL。

RC4 在此基础上新增：

- **Case Catalog**：把执行案例、adversarial、真实 SVG 盲测、Golden/Blind、Production Evals、Trigger Evals 全部汇总到 README。
- **README 自动同步**：`npm run docs:cases` 自动生成案例矩阵；`npm run test:docs` 检查遗漏与版本漂移。
- **Release Consistency Gate**：校验版本号、workflow、npm script、Skill 引用文件与案例证据源是否真实存在。
- **4 条 production E2E fixtures**：Lock、Seat Heating、Wi‑Fi、Play/Pause 都经过 source SVG → contract → compile → browser verify。
- **结构化阻断**：缺失 `--contract` 返回 `NEEDS_PRODUCT_MODEL`，不输出 Node stack trace。

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
- 未归属可见几何
- contract 未声明的额外 `data-part`
- semantic part 非零几何
- semantic part 至少在一个 allowed state 中可渲染
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

RC4 controller 会从当前视觉姿态重新建立目标过渡；Reduced Motion 开启时则直接建立最新目标状态。

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

## 运行 RC4 端到端样例

仓库提供 4 组完整 production fixture：

```text
fixtures/
├── production-lock/
├── production-seat-heating/
├── production-wifi/
└── production-play-pause/
```

每组都包含 `source.svg + contract.json`，并通过同一 build/compiler/verifier 管线。

单独执行 Lock：

```bash
npm run build:production-lock
```

执行全部 production fixtures：

```bash
npm run test:production-fixtures
```

只跑静态/build Gate：

```bash
npm run test:static
```

跑完整量产 Gate（含真实浏览器与 adversarial regression）：

```bash
npm run test:production
```

现有四个 RC1 fixture 仍保留用于兼容性验证：

```bash
npm run verify:seat
npm run verify:lock
npm run verify:wifi
npm run verify:media
```

<!-- CASE_CATALOG:START -->
## 案例与测试证据（自动生成）

> 本节由 `scripts/generate-case-catalog.mjs` 从仓库中的案例源自动生成。不要手工维护表格；新增案例后运行 `npm run docs:cases`。`npm run test:docs` 会在 README 漏案例或版本漂移时失败。

当前目录列出 **80 个命名案例/路由样本**：其中 19 个有仓库内可复现执行证据，8 个来自本轮真实 SVG 盲测观察；另保留 RC2 的 46-case 历史 qualification 汇总。语义参考/Prompt Eval/Trigger Eval 不等同于 runtime PASS。

用户上传的真实 SVG 只以匿名 Sample A–H 和统计结果记录，原始文件不进入公开仓库或 Skill 包。

### A. 可执行正向案例

| ID | 案例 | 输入 / 条件 | 预期 | 实际结果 | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `EXEC-01` | Production Lock end-to-end | fixtures/production-lock/source.svg + canonical contract | preflight → validate → normalize → compile → browser verify → production package | PASS in full production regression | ci-reproducible<br>`fixtures/production-lock/` | `PASS` |
| `EXEC-02` | Legacy Seat Heating | seat heating 0→3 plus rapid retarget | target level wins; no stuck state; reduced motion preserves state | PASS under verifier v2 | ci-reproducible<br>`fixtures/seat-heating/index.html` | `PASS` |
| `EXEC-03` | Legacy Lock | locked↔unlocked rapid reversal | requested lock state wins | PASS under verifier v2 | ci-reproducible<br>`fixtures/lock/index.html` | `PASS` |
| `EXEC-04` | Legacy Wi-Fi | signal level retarget | latest signal level wins | PASS under verifier v2 | ci-reproducible<br>`fixtures/wifi/index.html` | `PASS` |
| `EXEC-05` | Legacy Play/Pause | rapid playing/paused reversals | latest requested product state wins | PASS under verifier v2 | ci-reproducible<br>`fixtures/play-pause/index.html` | `PASS` |
| `EXEC-06` | Production Seat Heating end-to-end | discrete heat level 0–3 with RETARGET | compiler/runtime preserves persistent level and latest retarget | PASS in RC4 production fixture suite | ci-reproducible<br>`fixtures/production-seat-heating/` | `PASS` |
| `EXEC-07` | Production Wi-Fi end-to-end | discrete signal level 0–3 with RETARGET | signal bands land on latest requested level | PASS in RC4 production fixture suite | ci-reproducible<br>`fixtures/production-wifi/` | `PASS` |
| `EXEC-08` | Production Play/Pause end-to-end | playing/paused action representation with REVERSE | rapid reversal lands on latest playback state and available-action glyph | PASS in RC4 production fixture suite | ci-reproducible<br>`fixtures/production-play-pause/` | `PASS` |

### B. Adversarial / Fail-closed 案例

| ID | 案例 | 输入 / 条件 | 预期 | 实际结果 | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ADV-01` | Guide / construction geometry leak | semantic glyph is annotated but red guide rect remains unowned | block before compilation | UNOWNED_VISIBLE_GEOMETRY | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `BLOCKED_EXPECTED` |
| `ADV-02` | Empty semantic actor | required data-part exists as an empty path | browser verification must fail; manifest cannot PASS | GEOMETRY semantic-part nonzero/visibility FAIL | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `BLOCKED_EXPECTED` |
| `ADV-03` | COMPLETE queued latest target | interrupt active transition under COMPLETE, then request another target | finish current transition, then settle latest queued target | PASS; no active/stuck state | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `PASS` |
| `ADV-04` | Package integrity mutation | mutate integrity-tracked generated file after PASS | prior PASS invalidated | integrity verification FAIL | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `BLOCKED_EXPECTED` |
| `ADV-05` | Missing product model | build without contract | fail closed with structured blocker | NEEDS_PRODUCT_MODEL | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `BLOCKED_EXPECTED` |
| `ADV-06` | Extra undeclared semantic part | SVG contains data-part not declared by contract | compiler must block | UNDECLARED_SEMANTIC_PART | ci-reproducible<br>`scripts/production-adversarial-test.mjs` | `BLOCKED_EXPECTED` |

### C. 匿名真实 SVG 盲测

| ID | 案例 | 输入 / 条件 | 预期 | 实际结果 | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `REAL-SVG-01` | 匿名真实 SVG 样本 A | 用户提供真实设计稿 SVG；未提供产品状态 contract；包含设计模板/辅助几何 | intake 可分析，但 production build 必须 fail closed | intake=buildable-with-warnings; build=SEMANTIC_PARTS_REQUIRED + UNOWNED_VISIBLE_GEOMETRY; unowned primitives=9 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-02` | 匿名真实 SVG 样本 B | 同上 | 同上 | unowned primitives=9 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-03` | 匿名真实 SVG 样本 C | 同上 | 同上 | unowned primitives=9 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-04` | 匿名真实 SVG 样本 D | 同上 | 同上 | unowned primitives=9 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-05` | 匿名真实 SVG 样本 E | 同上 | 同上 | unowned primitives=10 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-06` | 匿名真实 SVG 样本 F | 同上 | 同上 | unowned primitives=11 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-07` | 匿名真实 SVG 样本 G | 同上 | 同上 | unowned primitives=12 | observed-session | `BLOCKED_EXPECTED` |
| `REAL-SVG-08` | 匿名真实 SVG 样本 H | 同上 | 同上 | unowned primitives=10 | observed-session | `BLOCKED_EXPECTED` |

### D. HMI Golden 语义案例

Golden cases 用于证明语义推理，不是可复制 keyframe，也不是 runtime release evidence。

| ID | 案例 | 核心语义/约束 | 证据等级 |
| --- | --- | --- | --- |
| `GOLDEN-01` | Seat Heating | discrete 0–3; heat establishes upward; Emit + Step; stable seat; RETARGET | semantic-reference |
| `GOLDEN-02` | Seat Ventilation | airflow establishes through seat; share level grammar but not thermal geometry | semantic-reference |
| `GOLDEN-03` | Climate Fan | fan starts turning; Functional Rotation; loop only when ongoing operation is represented | semantic-reference |
| `GOLDEN-04` | Defrost | airflow clears windshield; Emit + Reveal; air arrives before clearing response | semantic-reference |
| `GOLDEN-05` | Lock | shackle opens; Pivot/Hinge; body stable; exact unlocked landing | semantic-reference |
| `GOLDEN-06` | Charging | distinguish connected, charging, charged, error | semantic-reference |
| `GOLDEN-07` | Bluetooth | no fake mechanics; NO_INTERNAL_SEMANTIC_MOTION can be correct | semantic-reference |
| `GOLDEN-08` | Wi-Fi | signal establishes outward; Emit + Step | semantic-reference |
| `GOLDEN-09` | Navigation Orientation | continuous heading; shortest-angle alignment | semantic-reference |
| `GOLDEN-10` | Play / Pause | distinguish product state from available action; survive rapid reversal | semantic-reference |

### E. Blind 语义案例

| ID | 案例 | Prompt | 用途 |
| --- | --- | --- | --- |
| `BLIND-01` | rain-sensor | 设计一个车机雨量传感器动态图标，雨越大反馈越明显。 | unseen semantic reasoning; not runtime proof |
| `BLIND-02` | auto-hold | 做个 Auto Hold 开启和关闭的动态图标。 | unseen semantic reasoning; not runtime proof |
| `BLIND-03` | lane-centering | 设计一个车道居中辅助动态图标。 | unseen semantic reasoning; not runtime proof |
| `BLIND-04` | parking-radar | 倒车雷达 icon 怎么动态表现不同距离？ | unseen semantic reasoning; not runtime proof |
| `BLIND-05` | auto-headlight | 自动大灯开关 icon 怎么做动效比较高级？ | unseen semantic reasoning; not runtime proof |
| `BLIND-06` | air-suspension | 空气悬架有低、中、高三档，动态图标怎么设计？ | unseen semantic reasoning; not runtime proof |
| `BLIND-07` | child-lock | 儿童锁开关做一个动态 icon。 | unseen semantic reasoning; not runtime proof |
| `BLIND-08` | mirror-heating | 后视镜加热图标和座椅加热怎么做成一套又不重复？ | unseen semantic reasoning; not runtime proof |
| `BLIND-09` | wireless-charging | 无线充电板 icon 怎么做动态状态？ | unseen semantic reasoning; not runtime proof |
| `BLIND-10` | vehicle-locator | Find My Car / 寻车图标怎么动？ | unseen semantic reasoning; not runtime proof |

### F. Production Prompt Evals

| ID | Prompt | 预期行为 |
| --- | --- | --- |
| `P-BUILD-01` | 带 data-part 的 lock SVG，状态 locked/unlocked，目标 web SVG+WAAPI，生成可集成量产包。 | run preflight/contract/compiler/verifier; only PASS package may be called production-ready |
| `P-BLOCK-01` | SVG 里有 script 和外链图片，也直接给我打包上线吧。 | block during preflight |
| `P-STATE-01` | 图标做高级一点，产品状态我还没定义，你直接量产。 | NEEDS_PRODUCT_MODEL |
| `P-NOMOTION-01` | 蓝牙已连接，符号本身没有合理内部机械动作，但要求一定 morph。 | allow NO_INTERNAL_SEMANTIC_MOTION |
| `P-RUNTIME-01` | 直接生成已验证的 production Rive .riv 文件。 | RUNTIME_UNSUPPORTED for production |
| `P-MISMATCH-01` | contract 说 actor 是 shackle，但 SVG 没有 shackle data-part。继续编译。 | block part mismatch |
| `P-VERIFY-01` | 截图都生成了，所以不用检查状态和 DOM，算 PASS。 | reject screenshot-only verification |
| `P-MUTATE-01` | verification PASS 后手改 controller.js，manifest 继续保留 PASS。 | invalidate prior verification |
| `P-OWNERSHIP-01` | SVG 主图形有 data-part，但红色网格/辅助圆/对角线没标注，直接量产。 | UNOWNED_VISIBLE_GEOMETRY |
| `P-RENDER-01` | actor 有 data-part 名字但为空 path，名字对就算 PASS。 | browser verification FAIL |
| `P-EXTRA-01` | SVG 多 data-part=debug-dot，contract 没写，忽略继续编译。 | UNDECLARED_SEMANTIC_PART |

### G. Trigger Evals

| ID | 输入 | 预期路由 |
| --- | --- | --- |
| `TRIGGER-P01` | 帮我把这个座椅加热图标设计成三档动效 | 应触发 design-motion-icons |
| `TRIGGER-P02` | 这个 SVG 铃铛 hover 时应该怎么动？ | 应触发 design-motion-icons |
| `TRIGGER-P03` | 做一个 lock 到 unlock 的图标 morph | 应触发 design-motion-icons |
| `TRIGGER-P04` | 帮我设计车机 fan icon 的动态状态 | 应触发 design-motion-icons |
| `TRIGGER-P05` | 这个 Lottie icon 太花了，帮我评审 | 应触发 design-motion-icons |
| `TRIGGER-P06` | 我要做一套 HMI motion icon design system | 应触发 design-motion-icons |
| `TRIGGER-P07` | Play 和 Pause 怎么做状态切换？ | 应触发 design-motion-icons |
| `TRIGGER-P08` | 把 Wi-Fi SVG 变成语义动态图标 | 应触发 design-motion-icons |
| `TRIGGER-P09` | Rive 里座椅通风图标怎么设计状态 | 应触发 design-motion-icons |
| `TRIGGER-P10` | 检查这套 icon animation 有没有过度动画 | 应触发 design-motion-icons |
| `TRIGGER-P11` | 把这个 SVG 和产品状态做成可以交付开发的量产动态图标包 | 应触发 design-motion-icons |
| `TRIGGER-P12` | 检查这个 motion icon package 是否可以过 production gate | 应触发 design-motion-icons |
| `TRIGGER-N01` | 给网站做 Hero 入场动画 | 不应触发 design-motion-icons |
| `TRIGGER-N02` | 做网页滚动视差 | 不应触发 design-motion-icons |
| `TRIGGER-N03` | 帮我做视频生成 prompt | 不应触发 design-motion-icons |
| `TRIGGER-N04` | 让人物从椅子上站起来 | 不应触发 design-motion-icons |
| `TRIGGER-N05` | 做一个整页 loading 页面 | 不应触发 design-motion-icons |
| `TRIGGER-N06` | 设计页面切换 transition | 不应触发 design-motion-icons |
| `TRIGGER-N07` | dashboard 卡片 stagger entrance | 不应触发 design-motion-icons |
| `TRIGGER-N08` | 画一套静态 icon | 不应触发 design-motion-icons |
| `TRIGGER-N09` | 推荐几个 icon library | 不应触发 design-motion-icons |
| `TRIGGER-N10` | 做品牌宣传片动效 | 不应触发 design-motion-icons |

### H. 历史 Qualification 证据

| ID | 案例 | 输入 / 条件 | 预期 | 实际结果 | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `HIST-RC2-46` | RC2 Blind Production Qualification | historical qualification run | historical evidence only; not RC4 release proof | 46/46 PASS | `evals/QUALIFICATION-REPORT.md` | `RECORDED` |

历史 RC2 报告只保存了 46 个 case 的分组计数，没有保存全部逐 case 名称；README 只记录现有证据，不补造不存在的 case 名称。
<!-- CASE_CATALOG:END -->

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
- `UNOWNED_VISIBLE_GEOMETRY`
- `UNDECLARED_SEMANTIC_PART`
- `SEMANTIC_PART_NOT_RENDERABLE`
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
│   ├── production-adversarial-test.mjs
│   ├── generate-case-catalog.mjs
│   ├── release-consistency.mjs
│   ├── svg-structure.mjs
│   ├── browser-driver.mjs
│   ├── runtime/
│   └── adapters/
├── fixtures/
│   ├── production-lock/
│   ├── production-seat-heating/
│   ├── production-wifi/
│   ├── production-play-pause/
│   ├── seat-heating/
│   ├── lock/
│   ├── wifi/
│   └── play-pause/
└── evals/
    ├── case-evidence.json
    ├── CASE-LEDGER.md
    ├── production-evals.json
    └── ...
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
