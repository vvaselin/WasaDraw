import type { Rect, Vec2 } from "./geometry.js";

/**
 * グラデーションの色停止点。offset は 0〜1。
 */
export type GradientStop = {
  offset: number;
  color: string;
};

/**
 * 線形グラデーション。from / to は図形の bbox に対する正規化座標（0..1）。
 * 例: from {0,0} → to {0,1} で上から下への縦グラデーション。
 */
export type LinearGradient = {
  kind: "linear";
  from: Vec2;
  to: Vec2;
  stops: GradientStop[];
};

/**
 * 放射グラデーション。center は bbox 正規化座標（0..1）、
 * radius は bbox の長辺の半分を 1 とする倍率。
 */
export type RadialGradient = {
  kind: "radial";
  center: Vec2;
  radius: number;
  stops: GradientStop[];
};

export type Gradient = LinearGradient | RadialGradient;

/**
 * 図形の塗り・枠の指定。string（色）または Gradient。
 */
export type Fill = string | Gradient;

export function isGradient(fill: Fill): fill is Gradient {
  return typeof fill !== "string";
}

/**
 * 色の配列を等間隔の GradientStop 配列に変換する。
 * GradientStop 配列はそのまま検証して返す。
 */
export function toGradientStops(
  colors: readonly string[] | readonly GradientStop[],
): GradientStop[] {
  if (colors.length < 2) {
    throw new Error("gradient: at least 2 colors are required.");
  }

  const first = colors[0]!;

  if (typeof first === "string") {
    const strings = colors as readonly string[];
    const last = strings.length - 1;
    return strings.map((color, i) => ({ offset: i / last, color }));
  }

  const stops = colors as readonly GradientStop[];

  for (const stop of stops) {
    if (!Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1) {
      throw new RangeError(
        "gradient: stop offset must be a finite number in the range 0-1.",
      );
    }
  }

  return [...stops];
}

/**
 * 任意方向の線形グラデーション。from / to は bbox 正規化座標（0..1）。
 */
export function linearGradient(
  from: Vec2,
  to: Vec2,
  colors: readonly string[] | readonly GradientStop[],
): LinearGradient {
  return { kind: "linear", from, to, stops: toGradientStops(colors) };
}

/** 上→下の縦グラデーション。 */
export function verticalGradient(
  top: string,
  bottom: string,
): LinearGradient {
  return linearGradient({ x: 0, y: 0 }, { x: 0, y: 1 }, [top, bottom]);
}

/** 左→右の横グラデーション。 */
export function horizontalGradient(
  left: string,
  right: string,
): LinearGradient {
  return linearGradient({ x: 0, y: 0 }, { x: 1, y: 0 }, [left, right]);
}

/** 左上→右下の斜めグラデーション。 */
export function diagonalGradient(
  topLeft: string,
  bottomRight: string,
): LinearGradient {
  return linearGradient({ x: 0, y: 0 }, { x: 1, y: 1 }, [
    topLeft,
    bottomRight,
  ]);
}

/** 中心→外周の放射グラデーション。 */
export function radialGradient(
  inner: string,
  outer: string,
  options: { center?: Vec2; radius?: number } = {},
): RadialGradient {
  const radius = options.radius ?? 1;

  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError(
      "gradient: radius must be a finite number greater than 0.",
    );
  }

  return {
    kind: "radial",
    center: options.center ?? { x: 0.5, y: 0.5 },
    radius,
    stops: toGradientStops([inner, outer]),
  };
}

/**
 * Gradient を bbox に合わせて CanvasGradient へ変換する。
 * bbox が退化している（幅・高さ 0 で方向が定まらない）場合は
 * 最初の stop の色へフォールバックする。
 */
export function resolveFill(
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  bounds: Rect,
): string | CanvasGradient {
  if (typeof fill === "string") {
    return fill;
  }

  const stops = fill.stops;

  if (stops.length === 0) {
    throw new Error("gradient: stops must not be empty.");
  }

  if (fill.kind === "linear") {
    const x0 = bounds.x + fill.from.x * bounds.w;
    const y0 = bounds.y + fill.from.y * bounds.h;
    const x1 = bounds.x + fill.to.x * bounds.w;
    const y1 = bounds.y + fill.to.y * bounds.h;

    // 始点と終点が一致すると Canvas は何も描画しないため、単色へ退避する。
    if (x0 === x1 && y0 === y1) {
      return stops[0]!.color;
    }

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    return gradient;
  }

  const cx = bounds.x + fill.center.x * bounds.w;
  const cy = bounds.y + fill.center.y * bounds.h;
  const r = (fill.radius * Math.max(bounds.w, bounds.h)) / 2;

  if (r <= 0) {
    return stops[0]!.color;
  }

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

  for (const stop of stops) {
    gradient.addColorStop(stop.offset, stop.color);
  }

  return gradient;
}
