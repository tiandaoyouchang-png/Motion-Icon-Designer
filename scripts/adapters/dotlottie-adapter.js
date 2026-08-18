export class DotLottieAdapter {
  constructor(runtime, mapping = {}) {
    this.runtime = runtime;
    this.mapping = mapping;
    this.productState = null;
    this.reducedMotion = false;
  }
  async load() {}
  async setState(state) {
    this.productState = state;
    const marker = this.mapping.states?.[String(state)];
    if (marker && typeof this.runtime.setMarker === "function") this.runtime.setMarker(marker);
    return state;
  }
  async beginTransition(target) {
    if (this.reducedMotion) return this.setState(target);
    const key = `${this.productState}>${target}`;
    const marker = this.mapping.transitions?.[key];
    if (marker && typeof this.runtime.setMarker === "function") this.runtime.setMarker(marker);
    if (typeof this.runtime.play === "function") this.runtime.play();
    this.productState = target;
    return target;
  }
  async seek(progress) { if (typeof this.runtime.seek === "function") this.runtime.seek(progress); }
  async setReducedMotion(enabled) { this.reducedMotion = Boolean(enabled); }
  async getProductState() { return this.productState; }
  async getVisualState() { return { runtime: "dotlottie", productState: this.productState }; }
  async destroy() { this.runtime?.destroy?.(); }
}
