# Motion Icon Designer

**Motion Icon Designer** 是一套以 **Product State（产品状态）** 为起点的语义动态图标设计与量产执行工作流，用于把产品状态、SVG 几何、语义动作、动效语言和平台约束收敛为可执行、可验证、可交付的 **SVG + WAAPI** 量产候选。

Skill：`design-motion-icons`  
当前版本：`1.0.0-rc4`

> RC4 的 production backend 只承诺 **SVG + WAAPI**。Lottie / dotLottie / Rive 仍属于 handoff / experimental backend，不应标记为 production PASS。

## 核心管线

```text
Product State
→ Representation Role
→ Semantic Verb
→ Geometry / data-part Ownership
→ Canonical Contract
→ Platform Capability
→ Asset Preflight
→ SVG Normalization
→ SVG + WAAPI Compile
→ Runtime Verification
→ Production Package
```

必须区分：

```text
Control Feedback ≠ Semantic Icon Motion
Transition ≠ Persistent State
Product State ≠ Animation State
Current State ≠ Available Action
Platform Constraint ≠ Product Semantics
Captured Screenshot ≠ Verified Screenshot
```

## RC4 量产硬门槛

- **Visible Geometry Ownership**：每一个可渲染 SVG primitive 都必须归属于明确的 `data-part`。设计网格、辅助线、debug mark 等未归属几何会以 `UNOWNED_VISIBLE_GEOMETRY` 阻断。
- **Contract / Asset 双向所有权**：contract 缺 part 会 FAIL；SVG 多出 contract 未声明的 `data-part` 会以 `UNDECLARED_SEMANTIC_PART` 阻断。
- **Semantic Part Renderability**：required part 不仅要“存在”，还必须有非零几何，并至少在一个 allowed state 中可渲染。空 path 不能 PASS。
- **Structured Blocking**：缺 product model 返回 `NEEDS_PRODUCT_MODEL`，不继续猜语义，也不输出 Node stack trace。
- **Runtime interruption**：COMPLETE / REVERSE / RETARGET 都必须满足 latest product state wins；COMPLETE 会先完成当前目标再 settle 最新 queued target。
- **Package Integrity**：核心生成文件被手改后，已有 verification PASS 会失效。
- **Fail closed capability envelope**：RC4 production 只覆盖已验证的 SVG+WAAPI 能力范围。

## 运行

```bash
npm install
npx playwright install --with-deps chromium
npm run test:production
```

完整 production fixture：

```text
fixtures/
├── production-lock/
├── production-seat-heating/
├── production-wifi/
└── production-play-pause/
```

每组都经过：

```text
source.svg
→ contract.json
→ preflight
→ validate
→ normalize
→ compile
→ browser verifier
→ production package
```

单独构建：

```bash
npm run build:production-lock
npm run build:production-seat
npm run build:production-wifi
npm run build:production-media
```

## Verifier v2

Verifier 检查：

- `[data-motion-icon]` root
- duplicate SVG IDs / external references
- visible-geometry ownership
- contract / asset semantic part mapping
- semantic part 非零几何与可渲染性
- stable-part geometry invariants
- 20 / 24 / 32 / 96px 实际尺寸
- 0 / 10 / 25 / 50 / 75 / 90 / 100% 中间帧
- final landing
- rapid interaction / RETARGET / REVERSE / COMPLETE
- latest product state wins
- reduced motion target meaning
- browser console / runtime failures
- package integrity

只有：

```json
{
  "verification": {
    "status": "PASS"
  }
}
```

才可作为量产集成候选。

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

# 案例与测试证据

案例证据源：`evals/case-evidence.json`。用户上传的真实 SVG 只保留匿名 Sample A–H 与统计结果，**原始文件不提交到公开仓库**。

当前 README 列出 **81 个命名案例/路由样本**。其中可执行/对抗/真实 SVG/历史 evidence 共 28 个；另有 10 个 HMI Golden、10 个 Blind semantic、11 个 Production Prompt Eval、22 个 Trigger Eval。历史 RC2 46-case qualification 只作为历史汇总，不冒充 RC4 当前 release proof。

## A. 可执行正向案例（8）

| ID | 案例 | 实际证据 |
| --- | --- | --- |
| `EXEC-01` | Production Lock end-to-end | full source→contract→compile→browser verify PASS |
| `EXEC-02` | Legacy Seat Heating | verifier v2 PASS |
| `EXEC-03` | Legacy Lock | verifier v2 PASS |
| `EXEC-04` | Legacy Wi-Fi | verifier v2 PASS |
| `EXEC-05` | Legacy Play/Pause | verifier v2 PASS |
| `EXEC-06` | Production Seat Heating end-to-end | RC4 production fixture PASS |
| `EXEC-07` | Production Wi-Fi end-to-end | RC4 production fixture PASS |
| `EXEC-08` | Production Play/Pause end-to-end | RC4 production fixture PASS |

## B. Adversarial / Fail-closed（11）

| ID | 场景 | 预期 / 实际结果 |
| --- | --- | --- |
| `ADV-01` | Guide / construction geometry leak | `UNOWNED_VISIBLE_GEOMETRY` |
| `ADV-02` | Empty semantic actor | browser geometry/renderability FAIL |
| `ADV-03` | COMPLETE queued latest target | PASS，最终无 active/stuck state |
| `ADV-04` | Package integrity mutation | integrity verification FAIL |
| `ADV-05` | Missing product model | `NEEDS_PRODUCT_MODEL` |
| `ADV-06` | Undeclared semantic part | `UNDECLARED_SEMANTIC_PART` |
| `ADV-07` | Unsafe script in SVG | `SCRIPT_NOT_ALLOWED` |
| `ADV-08` | Contract / asset part mismatch | `CONTRACT_ASSET_PART_MISMATCH` |
| `ADV-09` | Unqualified continuous input | contract validation FAIL |
| `ADV-10` | numeric `1` / string `"1"` state-key collision | contract validation FAIL |
| `ADV-11` | Unknown contract property | additional-property validation FAIL |

## C. 真实 SVG 盲测（8，匿名）

这 8 个案例来自用户提供的真实设计稿 SVG。测试目标不是猜产品语义，而是验证：**没有 product model / semantic annotation 时系统能否安全停机**。

| ID | 样本 | Intake | Build | 未归属 primitive |
| --- | --- | --- | --- | ---: |
| `REAL-SVG-01` | Sample A | buildable-with-warnings | `SEMANTIC_PARTS_REQUIRED + UNOWNED_VISIBLE_GEOMETRY` | 9 |
| `REAL-SVG-02` | Sample B | buildable-with-warnings | 同上 | 9 |
| `REAL-SVG-03` | Sample C | buildable-with-warnings | 同上 | 9 |
| `REAL-SVG-04` | Sample D | buildable-with-warnings | 同上 | 9 |
| `REAL-SVG-05` | Sample E | buildable-with-warnings | 同上 | 10 |
| `REAL-SVG-06` | Sample F | buildable-with-warnings | 同上 | 11 |
| `REAL-SVG-07` | Sample G | buildable-with-warnings | 同上 | 12 |
| `REAL-SVG-08` | Sample H | buildable-with-warnings | 同上 | 10 |

## D. HMI Golden 语义案例（10）

| ID | 案例 | 核心语义 |
| --- | --- | --- |
| `GOLDEN-01` | Seat Heating | heat establishes upward；Emit + Step；RETARGET |
| `GOLDEN-02` | Seat Ventilation | airflow establishes through seat；与 heating 共享 level grammar 但不复制热几何 |
| `GOLDEN-03` | Climate Fan | Functional Rotation；仅 ongoing operation 才允许 loop |
| `GOLDEN-04` | Defrost | airflow clears windshield；Emit + Reveal |
| `GOLDEN-05` | Lock | shackle opens；Pivot / Hinge；body stable |
| `GOLDEN-06` | Charging | connected / charging / charged / error 不得混为一个状态 |
| `GOLDEN-07` | Bluetooth | 无合理内部机制时允许 `NO_INTERNAL_SEMANTIC_MOTION` |
| `GOLDEN-08` | Wi-Fi | signal establishes outward；Emit + Step |
| `GOLDEN-09` | Navigation Orientation | continuous heading；shortest-angle alignment |
| `GOLDEN-10` | Play / Pause | 区分 product state 与 available action；支持 rapid reversal |

## E. Blind 语义案例（10）

| ID | 案例 |
| --- | --- |
| `BLIND-01` | rain-sensor |
| `BLIND-02` | auto-hold |
| `BLIND-03` | lane-centering |
| `BLIND-04` | parking-radar |
| `BLIND-05` | auto-headlight |
| `BLIND-06` | air-suspension |
| `BLIND-07` | child-lock |
| `BLIND-08` | mirror-heating |
| `BLIND-09` | wireless-charging |
| `BLIND-10` | vehicle-locator / Find My Car |

这些用于 unseen semantic reasoning，不等同于 runtime PASS。

## F. Production Prompt Evals（11）

| ID | 场景 |
| --- | --- |
| `P-BUILD-01` | 带 `data-part` 的 lock SVG + locked/unlocked → 生成并验证量产包 |
| `P-BLOCK-01` | SVG 带 script / 外链 → 必须 preflight block |
| `P-STATE-01` | 未定义产品状态却要求直接量产 → `NEEDS_PRODUCT_MODEL` |
| `P-NOMOTION-01` | Bluetooth 无合理内部机械动作却要求强制 morph |
| `P-RUNTIME-01` | 要求已验证 production Rive `.riv` → `RUNTIME_UNSUPPORTED` |
| `P-MISMATCH-01` | contract actor 与 SVG `data-part` 不匹配 |
| `P-VERIFY-01` | “有截图就算 PASS” → 拒绝 screenshot-only verification |
| `P-MUTATE-01` | verification PASS 后手改 controller → prior PASS invalid |
| `P-OWNERSHIP-01` | 主图有 part、辅助线无 part → `UNOWNED_VISIBLE_GEOMETRY` |
| `P-RENDER-01` | actor 名字存在但为空 path → verification FAIL |
| `P-EXTRA-01` | SVG 多 `data-part=debug-dot`、contract 未声明 → `UNDECLARED_SEMANTIC_PART` |

## G. Trigger Evals（22）

### 应触发 `design-motion-icons`（12）

| ID | 输入 |
| --- | --- |
| `TRIGGER-P01` | 帮我把这个座椅加热图标设计成三档动效 |
| `TRIGGER-P02` | 这个 SVG 铃铛 hover 时应该怎么动？ |
| `TRIGGER-P03` | 做一个 lock 到 unlock 的图标 morph |
| `TRIGGER-P04` | 帮我设计车机 fan icon 的动态状态 |
| `TRIGGER-P05` | 这个 Lottie icon 太花了，帮我评审 |
| `TRIGGER-P06` | 我要做一套 HMI motion icon design system |
| `TRIGGER-P07` | Play 和 Pause 怎么做状态切换？ |
| `TRIGGER-P08` | 把 Wi-Fi SVG 变成语义动态图标 |
| `TRIGGER-P09` | Rive 里座椅通风图标怎么设计状态 |
| `TRIGGER-P10` | 检查这套 icon animation 有没有过度动画 |
| `TRIGGER-P11` | 把这个 SVG 和产品状态做成可以交付开发的量产动态图标包 |
| `TRIGGER-P12` | 检查这个 motion icon package 是否可以过 production gate |

### 不应触发（10）

| ID | 输入 |
| --- | --- |
| `TRIGGER-N01` | 给网站做 Hero 入场动画 |
| `TRIGGER-N02` | 做网页滚动视差 |
| `TRIGGER-N03` | 帮我做视频生成 prompt |
| `TRIGGER-N04` | 让人物从椅子上站起来 |
| `TRIGGER-N05` | 做一个整页 loading 页面 |
| `TRIGGER-N06` | 设计页面切换 transition |
| `TRIGGER-N07` | dashboard 卡片 stagger entrance |
| `TRIGGER-N08` | 画一套静态 icon |
| `TRIGGER-N09` | 推荐几个 icon library |
| `TRIGGER-N10` | 做品牌宣传片动效 |

## H. 历史 Qualification

| ID | 证据 |
| --- | --- |
| `HIST-RC2-46` | RC2 Blind Production Qualification：46/46 PASS；仅作为历史 summary，不作为 RC4 release proof |

## README / Evidence 维护

- `evals/case-evidence.json`：执行、对抗、真实 SVG 与历史 evidence 的机器可读来源。
- `scripts/generate-case-catalog.mjs`：检查 README 是否覆盖所有 evidence / eval case ID，并可生成 `evals/CASE-LEDGER.md`。
- `scripts/release-consistency.mjs`：检查版本、workflow、npm scripts、Skill 引用和 evidence source 是否一致。
- `npm run test:docs`：README/evidence/release metadata 一致性 gate。

## Hard Blockers

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

## Release Gate

详见 `evals/RELEASE-GATE.md`。正式 `1.0.0` 必须同时通过语义/Product State、Contract/Build、Runtime/Interaction、Geometry/Visual、Packaging/Delivery 以及当前 release 的代表性 blind production qualification。

Skill validator 通过并不等于 production-ready。

## License

MIT
