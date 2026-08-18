export class SvgWaapiAdapter {
constructor(api) {
this.api = api;
}

async load() {}

async setState(state) {
return this.api.setState?.(state);
}

async beginTransition(target) {
return this.api.beginTransition?.(target);
}

async seek(progress) {
return this.api.seek?.(progress);
}

async setReducedMotion(enabled) {
return this.api.setReducedMotion?.(enabled);
}

async getProductState() {
return this.api.getProductState?.()
?? this.api.getState?.();
}

async getVisualState() {
return this.api.getVisualState?.()
?? this.api.getState?.();
}

async settle() {
return this.api.seek?.(1);
}

async destroy() {}
}
