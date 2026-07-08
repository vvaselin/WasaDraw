import type { Vec2 } from "./geometry.js";

export type Bezier2 = { kind: "bezier2"; p0: Vec2; p1: Vec2; p2: Vec2 };
export type Bezier3 = {
  kind: "bezier3";
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
};

export function bezier2(p0: Vec2, p1: Vec2, p2: Vec2): Bezier2 {
  return { kind: "bezier2", p0, p1, p2 };
}

export function bezier3(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): Bezier3 {
  return { kind: "bezier3", p0, p1, p2, p3 };
}

export function pointOnBezier2(curve: Bezier2, t: number): Vec2 {
  const u = 1 - t;
  const a = u * u;
  const b = 2 * u * t;
  const c = t * t;

  return {
    x: a * curve.p0.x + b * curve.p1.x + c * curve.p2.x,
    y: a * curve.p0.y + b * curve.p1.y + c * curve.p2.y,
  };
}

export function pointOnBezier3(curve: Bezier3, t: number): Vec2 {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;

  return {
    x: a * curve.p0.x + b * curve.p1.x + c * curve.p2.x + d * curve.p3.x,
    y: a * curve.p0.y + b * curve.p1.y + c * curve.p2.y + d * curve.p3.y,
  };
}

export function splineToBeziers(
  points: readonly Vec2[],
  options?: { closed?: boolean; tension?: number },
): Bezier3[] {
  if (points.length < 2) {
    throw new Error(
      "splineToBeziers: points must contain at least 2 points.",
    );
  }

  const closed = options?.closed ?? false;
  const tension = options?.tension ?? 0.5;
  const n = points.length;

  const at = (index: number): Vec2 => {
    if (closed) {
      return points[((index % n) + n) % n]!;
    }

    if (index < 0) {
      return points[0]!;
    }

    if (index > n - 1) {
      return points[n - 1]!;
    }

    return points[index]!;
  };

  const segmentCount = closed ? n : n - 1;
  const beziers: Bezier3[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const c1: Vec2 = {
      x: p1.x + ((p2.x - p0.x) * tension) / 3,
      y: p1.y + ((p2.y - p0.y) * tension) / 3,
    };
    const c2: Vec2 = {
      x: p2.x - ((p3.x - p1.x) * tension) / 3,
      y: p2.y - ((p3.y - p1.y) * tension) / 3,
    };

    beziers.push(bezier3(p1, c1, c2, p2));
  }

  return beziers;
}
