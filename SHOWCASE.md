# Verified Motion Icon Showcase

这里展示通过 production verifier 的最终动态图标成品。`showcase/` 中的 `preview.svg` 用于 GitHub 直接查看动效；真正的量产实现仍以对应的 `motion-icon.svg`、production fixture contract 和 `scripts/runtime/svg-waapi-controller.js` 为准。

| 成品 | 动态预览 | Production source |
| --- | --- | --- |
| Lock / Unlock | ![Lock / Unlock](showcase/production-lock/preview.svg) | [`showcase/production-lock/`](showcase/production-lock/) |
| Seat Heating 0–3 | ![Seat Heating](showcase/production-seat-heating/preview.svg) | [`showcase/production-seat-heating/`](showcase/production-seat-heating/) |
| Wi-Fi 0–3 | ![Wi-Fi](showcase/production-wifi/preview.svg) | [`showcase/production-wifi/`](showcase/production-wifi/) |
| Play / Pause | ![Play / Pause](showcase/production-play-pause/preview.svg) | [`showcase/production-play-pause/`](showcase/production-play-pause/) |

## 发布规则

- 只有完整 production pipeline 验证通过的成品才允许进入 `showcase/`。
- Showcase 预览不能替代 verifier 证据；量产结论仍以 production package 的 `verification.status == PASS` 为准。
- 最终交付必须同时保留：产品 contract、可集成运行时实现、验证证据和可视预览。
- 用户提供的 blind / 私有 SVG 默认不公开；只有明确允许公开或仓库自带的 production fixture 才进入 Showcase。
