# Motion Icon Designer

**Motion Icon Designer** 是一套以 **Product State（产品状态）** 为核心的语义动态图标设计与量产执行工作流。

当前版本：`1.0.0-rc3`

> RC3 的 production backend 只承诺 **SVG + WAAPI**。Lottie / dotLottie / Rive 目前仍属于 handoff / experimental backend，不能标记为 production PASS。

## RC3 的核心目标

把动态图标从“设计建议”升级成可验证的执行链：

```text
Product State
→ Semantic Model
→ SVG Asset Preflight
→ Canonical Contract
→ Platform Capability
→ SVG Normalization
→ SVG + WAAPI Compile
→ Runtime Verification
→ Production Package
```

## RC3 新增的量产硬门槛

### 1. Visible Geometry Ownership

生产构建要求每一个可渲染 SVG primitive 都必须归属于明确的 `data-part`。

设计辅助线、网格、debug mark、模板边框等未声明可见几何会触发：

`UNOWNED_VISIBLE_GEOMETRY`

并直接阻断 build。

### 2. Semantic Part Renderability

仅有 `data-part` 名称不够。Verifier 会检查：

- semantic part 是否存在
- 是否具有非零几何
- 是否具备可绘制 fill / stroke
- 是否在至少一个 allowed product state 中实际可见

空 path、零面积 actor 或永远不可见的关键部件不能获得 PASS。

### 3. Contract / Asset 双向所有权

- contract 需要的 part 缺失：FAIL
- SVG 多出 contract 未声明的 `data-part`：FAIL
- SVG 存在未归属的可见 primitive：FAIL

### 4. Structured Build Blocking

缺少产品状态模型时不会继续猜测，也不会输出 Node stack trace：

`NEEDS_PRODUCT_MODEL`

其他结构化 blocker 包括 `ASSET_REQUIRED`、`ASSET_NOT_FOUND`、`RUNTIME_UNSUPPORTED`、`CONTRACT_INVALID` 等。

### 5. Runtime interruption hardening

RC3 对 COMPLETE / REVERSE / RETARGET 进行 fail-closed 验证。COMPLETE 会先完成当前过渡，再处理最新 queued target，避免 stuck state。

### 6. Package integrity

`manifest.json` 对 asset / controller / contract / platform profile / fixture 记录 SHA-256。验证后修改核心生成文件会使 verification FAIL。

## 量产能力边界

RC3 production PASS 目前限定为：

- runtime：SVG + WAAPI
- input model：boolean / discrete / derived
- reactivity：transition / persistent-static
- interrupt：COMPLETE / REVERSE / RETARGET
- loop policy：never
- reduced motion：direct-state-establish / no-transient-motion

连续值、event-pulse、语义循环、Lottie、dotLottie、Rive 等能力在单独 qualification 前不进入 production PASS。

## 运行生产回归

安装：

```bash
npm install
npx playwright install chromium
```

运行完整 RC3 gate：

```bash
npm run test:production
```

其中包含：

- static/build self-test
- production-lock 端到端 build + browser verification
- production adversarial regression
- RC1 四个 legacy fixture 回归

## 端到端构建

```bash
node scripts/build-motion-icon.mjs \
  --svg annotated.svg \
  --contract contract.json \
  --profile profiles/web-svg-waapi.json \
  --out production-package
```

执行链：

```text
preflight
→ contract validation
→ normalization
→ build-mode preflight
→ compile
→ runtime verification
```

任何 P0 gate 失败都会停止构建。

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

只有 `manifest.json > verification.status == PASS` 才能作为量产集成候选。

## 关键目录

- `SKILL.md` — Skill 控制面
- `schemas/` — Canonical Contract schema
- `profiles/` — platform capability envelope
- `scripts/asset-preflight.mjs` — SVG 安全与 ownership 预检
- `scripts/svg-normalizer.mjs` — SVG normalization
- `scripts/svg-waapi-compiler.mjs` — production compiler
- `scripts/verify-motion-icon.mjs` — verifier v2
- `scripts/production-adversarial-test.mjs` — P0 攻击回归
- `references/` — 产品状态、手势语法、实现、handoff、verification、package 文档
- `evals/RELEASE-GATE.md` — 发布门禁

## 当前发布状态

`1.0.0-rc3`

RC3 不因为 Skill validator 通过就自动升级 `1.0.0`。正式版本仍要求可复现的 blind production qualification 和目标平台/OEM 验证。

## License

MIT
