# Motion Icon Designer

**Motion Icon Designer** 是一套以 **Product State（产品状态）** 为起点的语义动态图标设计工作流，用于设计、评审、实现、交付和验证产品界面中的动态图标与图标微交互。

它适用于 UI、车载 HMI、移动端、Web 和嵌入式界面，核心目标不是“让图标动起来”，而是让运动准确表达产品状态、功能含义和交互反馈。

Skill 名称：

`design-motion-icons`

## 核心模型

```text
产品状态 Product State
→ 表达角色 Representation Role
→ 语义动词 Semantic Verb
→ 几何结构 Geometry
→ 手势家族 Gesture Family
→ 响应方式 Reactivity
→ 动效语言 Motion Language
→ 中断策略 Interrupt Policy
→ 规范契约 Canonical Contract
→ 运行时 Runtime
→ 验证 Verification
```

## 适用场景

- UI 动态图标设计
- 车载 HMI Motion Icon
- 图标状态切换与状态 Morph
- SVG / WAAPI 图标动画
- Lottie / dotLottie 动效设计与交付
- Rive 状态机与数据驱动态图标
- Motion Icon Design System
- 图标动效评审与问题诊断
- 开发交付规范
- Motion QA 与交互验证

## 核心原则

### 1. 产品状态优先

先定义产品真实状态，再定义动画。

```text
产品 / 车辆 / 设备状态
→ Motion Adapter
→ Animation Runtime
```

动画运行时不应该反过来成为业务状态的来源。

### 2. 控件反馈 ≠ 图标语义动效

按钮按下时可以缩放、发光或产生触感反馈，但这些属于 **Control Feedback**。

图标内部真正表达产品状态变化的运动属于 **Semantic Icon Motion**。

两者可以同时存在，但不能互相替代。

### 3. Transition ≠ Persistent State

一次状态切换动画结束后，图标必须稳定落在正确的目标状态。

例如座椅加热从 0 档切到 3 档：

- Transition：三档热量逐步建立
- Persistent State：三档指示保持可见并稳定
- 默认不应该让进入动画无限循环

### 4. 最新产品状态优先

对于高频交互、档位切换或连续值控制，优先采用 **RETARGET**。

如果动画尚未结束时用户再次操作，应从当前视觉状态继续朝最新目标过渡，而不是让过期动画覆盖最新产品状态。

## 语义手势家族

Motion Icon Designer 使用可复用的语义运动语法，而不是为所有图标复制同一套 keyframe。

当前包含的主要 Gesture Family：

- Trace / Reveal：描边、路径、完成过程
- Directional Travel：上传、下载、发送、导航
- Pivot / Hinge：锁扣、门、盖板、杠杆
- Separate / Rejoin：插头、连接、解耦
- Arrive / Settle：到达与落位
- Fill / Level：电量、液位、数值等级
- Emit / Radiate：信号、热量、声音、光线、雷达
- Step / Increment：离散档位与等级
- Functional Rotation：风扇、刷新、罗盘等具有真实旋转语义的对象
- Contents in Frame：容器稳定、内部内容变化
- Reshape：材料或形态真正发生变化
- State Morph：Play / Pause、Menu / Close 等结构状态切换

## 支持的实现路径

### SVG + CSS / WAAPI

适合：

- transform / opacity
- stroke reveal
- 简单 morph
- Web UI
- 需要确定性浏览器测试的场景

建议按语义拆分 SVG 分组，例如：

```html
<g data-part="shackle">...</g>
```

避免依赖 `path:nth-child(...)` 之类脆弱选择器。

### Lottie / dotLottie

适合设计师主导的多图层时间线编排和可移植矢量动画。

在真实产品中需要额外确认目标运行时是否支持 marker、segment、interactivity 或 state-machine 能力。

### Rive

适合：

- 多状态交互图标
- 实时参数
- 高频 RETARGET
- 连续值映射
- 数据驱动状态机

业务层应传递产品事实，例如：

```js
setState({ heatLevel: 3 })
```

而不是：

```js
playAnimation("Level3")
```

## 安装与开发

安装依赖：

```bash
npm install
npx playwright install chromium
```

运行座椅加热 fixture：

```bash
npm run verify:seat
```

运行其他 fixture：

```bash
npm run verify:lock
npm run verify:wifi
npm run verify:media
```

## 验证体系

验证不仅检查动画“看起来顺不顺”，还检查：

- 产品状态是否正确
- 当前状态与可执行动作是否混淆
- 最终落点是否准确
- 中间帧是否仍可识别
- 快速连续操作是否出现卡死
- RETARGET 是否连续
- Reduced Motion 是否仍保留状态含义
- 多实例 SVG 是否发生 ID / mask / clipPath 冲突
- 最新产品状态是否始终胜出

可运行实现可以使用：

```bash
node scripts/verify-motion-icon.mjs <fixture.html> --out <output-directory>
```

## 仓库结构

```text
Motion-Icon-Designer/
├── SKILL.md
├── README.md
├── LICENSE
├── package.json
├── agents/
│   └── openai.yaml
├── references/
│   ├── PRODUCT-STATES.md
│   ├── GESTURE-FAMILIES.md
│   ├── MOTION-LANGUAGE.md
│   ├── IMPLEMENTATION.md
│   ├── DEVELOPER-HANDOFF.md
│   ├── VERIFICATION.md
│   ├── HMI-GOLDEN-SUITE.md
│   ├── FAILURE-CATALOG.md
│   └── OUTPUT-SPEC.md
├── scripts/
│   ├── verify-motion-icon.mjs
│   └── adapters/
├── fixtures/
│   ├── seat-heating/
│   ├── lock/
│   ├── wifi/
│   └── play-pause/
└── evals/
    ├── trigger-evals.json
    ├── adversarial-evals.json
    ├── blind/
    └── RELEASE-GATE.md
```

## 当前版本

`1.0.0-rc1`

只有在 Release Gate 全部通过后，RC 才应升级为正式 `1.0.0`。

关键发布阻断项包括：

- 产品状态错误
- 状态 / 动作语义错误
- 过期动画覆盖最新状态
- Reduced Motion 导致关键含义消失
- 高频交互产生卡死或错误落点

## 设计来源与参考

本工作流参考了公开的 Motion Design 与 Semantic SVG Animation 实践，包括 SoraLabsOSS `animating-icons` 与 LottieFiles `motion-design-skill` 等项目。

本仓库进一步形成了以 Product State 为核心的 Motion Icon Designer 方法，包括：

- HMI 产品状态层
- Gesture Family 语义语法
- Motion Language
- Canonical Developer Contract
- SVG / Lottie / Rive Runtime Routing
- RETARGET 中断策略
- Golden Suite / Blind Eval
- 自动化 Verification

## License

MIT
