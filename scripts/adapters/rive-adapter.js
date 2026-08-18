export class RiveAdapter {
  constructor({ rive, bindings = {} }) {
    this.rive = rive;
    this.bindings = bindings;
    this.productState = {};
  }

  async load() {}

  async setState(state) {
    this.productState = { ...this.productState, ...state };
    for (const [key, value] of Object.entries(state)) {
      const binding = this.bindings[key];
      if (binding && "value" in binding) {
        binding.value = value;
      }
    }
  }

  async beginTransition(target) {
    return this.setState(target);
  }

  async seek() {
    // Runtime-specific deterministic seeking belongs in the target app test harness.
  }

  async setReducedMotion(enabled) {
    const binding = this.bindings.reducedMotion;
    if (binding && "value" in binding) {
      binding.value = enabled;
    }
  }

  async getProductState() {
    return this.productState;
  }

  async getVisualState() {
    return { runtime: "rive", productState: this.productState };
  }

  async destroy() {
    this.rive?.cleanup?.();
  }
}
