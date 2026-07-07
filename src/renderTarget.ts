import { CanvasDrawContext } from "./draw.js";
import type { DrawContext, Size2D } from "./types.js";

export type RenderTargetOptions = {
  maxDpr?: number;
};

export type RenderTargetFrameContext = {
  draw: DrawContext;
  size: Size2D;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

export type RenderTarget = {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  render(callback: (context: RenderTargetFrameContext) => void): void;
  clear(color?: string): void;
  resize(width: number, height: number): void;
  destroy(): void;
};

export function createRenderTarget(
  width: number,
  height: number,
  options: RenderTargetOptions = {},
): RenderTarget {
  assertRenderSize("width", width);
  assertRenderSize("height", height);

  const maxDpr = options.maxDpr ?? Infinity;

  if (Number.isNaN(maxDpr) || maxDpr <= 0) {
    throw new Error("createRenderTarget: maxDpr must be greater than 0.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    throw new Error(
      "createRenderTarget: failed to get CanvasRenderingContext2D.",
    );
  }

  const draw = new CanvasDrawContext(ctx);

  let currentWidth = 0;
  let currentHeight = 0;
  let dpr = 1;
  let size: Size2D = { width: 0, height: 0, center: { x: 0, y: 0 } };
  let destroyed = false;

  const applySize = (nextWidth: number, nextHeight: number): void => {
    currentWidth = nextWidth;
    currentHeight = nextHeight;
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);
    // callback 内は CSS ピクセル座標で描けるようにします。
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = {
      width: nextWidth,
      height: nextHeight,
      center: { x: nextWidth / 2, y: nextHeight / 2 },
    };
    draw.setSize(size);
  };

  applySize(width, height);

  const assertAlive = (method: string): void => {
    if (destroyed) {
      throw new Error(
        `createRenderTarget: cannot call ${method}() on a destroyed render target.`,
      );
    }
  };

  return {
    get canvas() {
      return canvas;
    },
    get width() {
      return currentWidth;
    },
    get height() {
      return currentHeight;
    },
    get dpr() {
      return dpr;
    },

    render(callback: (context: RenderTargetFrameContext) => void): void {
      assertAlive("render");
      ctx.save();

      try {
        callback({ draw, size, canvas, context: ctx });
      } finally {
        ctx.restore();
      }
    },

    clear(color?: string): void {
      assertAlive("clear");
      draw.clear(color);
    },

    resize(nextWidth: number, nextHeight: number): void {
      assertAlive("resize");
      assertRenderSize("width", nextWidth);
      assertRenderSize("height", nextHeight);
      applySize(nextWidth, nextHeight);
    },

    destroy(): void {
      if (destroyed) {
        return;
      }

      canvas.width = 0;
      canvas.height = 0;
      destroyed = true;
    },
  };
}

function assertRenderSize(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `createRenderTarget: ${name} must be a finite number greater than 0.`,
    );
  }
}
