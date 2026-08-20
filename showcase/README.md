# Motion Icon Showcase

以下都是 RC4 production fixture 对应的最终动态图标展示。GitHub 展示使用真正的多帧 `preview.gif`，确保仓库页面可以直接播放；`motion-icon.svg` 是生成后的语义 SVG 资产，运行时行为由对应 contract + SVG/WAAPI controller 驱动。

## Lock / Unlock

![Lock / Unlock](production-lock/preview.gif)

[`motion-icon.svg`](production-lock/motion-icon.svg) · [`contract`](../fixtures/production-lock/contract.json)

## Seat Heating 0–3

![Seat Heating](production-seat-heating/preview.gif)

[`motion-icon.svg`](production-seat-heating/motion-icon.svg) · [`contract`](../fixtures/production-seat-heating/contract.json)

## Wi-Fi 0–3

![Wi-Fi](production-wifi/preview.gif)

[`motion-icon.svg`](production-wifi/motion-icon.svg) · [`contract`](../fixtures/production-wifi/contract.json)

## Play / Pause

![Play / Pause](production-play-pause/preview.gif)

[`motion-icon.svg`](production-play-pause/motion-icon.svg) · [`contract`](../fixtures/production-play-pause/contract.json)

## 交付约束

- 只有完成 production verification 的仓库案例才进入 Showcase。
- GitHub README / Showcase 的直接预览优先使用多帧 GIF；不要依赖 README 中的 SVG 动画执行。
- 可视 preview 不替代 verifier；production readiness 仍以生成包的 `manifest.json > verification.status == PASS` 为准。
- 最终成品必须同时可找到视觉预览、生成 SVG、contract 和运行时实现。
- 用户提供的 blind / 私有 SVG 默认不公开。
