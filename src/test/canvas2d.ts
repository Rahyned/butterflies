export type CtxCall = { method: string; args: unknown[] };

function makeRoughCtx(): CanvasRenderingContext2D & { __calls: CtxCall[] } {
  const calls: CtxCall[] = [];
  const target: Record<string, unknown> = {};
  const ctx = new Proxy(target, {
    get(_t, prop) {
      if (prop === '__calls') return calls;
      if (prop === 'measureText') {
        return (text: string) => ({ width: String(text).length * 7 });
      }
      if (prop === 'canvas') {
        return { width: 800, height: 600 };
      }
      if (typeof prop === 'string') {
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return undefined;
        };
      }
      return undefined;
    },
    set(_t, prop, value) {
      target[String(prop)] = value;
      return true;
    },
  });
  return ctx as unknown as CanvasRenderingContext2D & { __calls: CtxCall[] };
}

export function installCanvas2DStub(): void {
  const ctxCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D & { __calls: CtxCall[] }>();
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
    if (contextId === '2d') {
      const cached = ctxCache.get(this);
      if (cached) return cached as unknown as CanvasRenderingContext2D;
      const created = makeRoughCtx();
      ctxCache.set(this, created);
      return created as unknown as CanvasRenderingContext2D;
    }
    const originalGetContext = (this as HTMLCanvasElement).getContext;
    return originalGetContext.call(this, contextId as '2d', ...args);
  };
}