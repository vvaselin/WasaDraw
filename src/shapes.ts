import type { Vec2 } from "./geometry.js";

/** ローカル座標上の点を原点中心に angle だけ回転する（時計回り正）。 */
function rotateLocal(point: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/** ローカル座標の点列を angle 回転してから center へ平行移動する。 */
function toWorldPoints(
  localPoints: readonly Vec2[],
  center: Vec2,
  angle: number,
): Vec2[] {
  return localPoints.map((point) => {
    const rotated = rotateLocal(point, angle);
    return { x: center.x + rotated.x, y: center.y + rotated.y };
  });
}

/** 極座標 (r, θ) から角度0=真上・時計回り正の頂点座標を求める。 */
function polarPoint(center: Vec2, r: number, theta: number): Vec2 {
  return {
    x: center.x + r * Math.sin(theta),
    y: center.y - r * Math.cos(theta),
  };
}

/** 正 n 角形の頂点列を返す。角度0で頂点が真上、正で時計回り。 */
export function ngon(center: Vec2, n: number, r: number, angle = 0): Vec2[] {
  if (!Number.isInteger(n) || n < 3) {
    throw new Error("ngon: n must be an integer greater than or equal to 3.");
  }

  if (!(Number.isFinite(r) && r > 0)) {
    throw new RangeError("ngon: r must be a positive finite number.");
  }

  const points: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const baseAngle = ((2 * Math.PI) / n) * i;
    points.push(polarPoint(center, r, angle + baseAngle));
  }
  return points;
}

/** 正五角形の頂点列を返す。 */
export function pentagon(center: Vec2, r: number, angle = 0): Vec2[] {
  return ngon(center, 5, r, angle);
}

/** 正六角形の頂点列を返す。 */
export function hexagon(center: Vec2, r: number, angle = 0): Vec2[] {
  return ngon(center, 6, r, angle);
}

/** n 個の頂点を持つ星形（2n 頂点）の頂点列を返す。 */
export function nStar(
  center: Vec2,
  n: number,
  rOuter: number,
  rInner: number,
  angle = 0,
): Vec2[] {
  if (!Number.isInteger(n) || n < 2) {
    throw new Error("nStar: n must be an integer greater than or equal to 2.");
  }
  if (!(Number.isFinite(rOuter) && rOuter > 0)) {
    throw new RangeError("nStar: rOuter must be a positive finite number.");
  }
  if (!(Number.isFinite(rInner) && rInner > 0)) {
    throw new RangeError("nStar: rInner must be a positive finite number.");
  }

  const points: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const outerAngle = ((2 * Math.PI) / n) * i;
    const innerAngle = ((2 * Math.PI) / n) * (i + 0.5);
    points.push(polarPoint(center, rOuter, angle + outerAngle));
    points.push(polarPoint(center, rInner, angle + innerAngle));
  }
  return points;
}

/** 五芒星の頂点列を返す。 */
export function star(center: Vec2, r: number, angle = 0): Vec2[] {
  return nStar(center, 5, r, r * ((3 - Math.sqrt(5)) / 2), angle);
}

/** ひし形の頂点列を返す。 */
export function rhombus(center: Vec2, w: number, h: number, angle = 0): Vec2[] {
  const localPoints: Vec2[] = [
    { x: 0, y: -h / 2 },
    { x: w / 2, y: 0 },
    { x: 0, y: h / 2 },
    { x: -w / 2, y: 0 },
  ];
  return toWorldPoints(localPoints, center, angle);
}

/** プラス（十字）形の頂点列（12頂点）を返す。 */
export function plus(center: Vec2, r: number, width: number, angle = 0): Vec2[] {
  if (!(Number.isFinite(width) && width > 0 && width <= 2 * r)) {
    throw new RangeError("plus: width must satisfy 0 < width <= 2 * r.");
  }

  const half = width / 2;
  const localPoints: Vec2[] = [
    { x: -half, y: -r },
    { x: half, y: -r },
    { x: half, y: -half },
    { x: r, y: -half },
    { x: r, y: half },
    { x: half, y: half },
    { x: half, y: r },
    { x: -half, y: r },
    { x: -half, y: half },
    { x: -r, y: half },
    { x: -r, y: -half },
    { x: -half, y: -half },
  ];
  return toWorldPoints(localPoints, center, angle);
}

/** クロス（X字）形の頂点列を返す。plus を45度回転したもの。 */
export function cross(center: Vec2, r: number, width: number, angle = 0): Vec2[] {
  return plus(center, r, width, angle + Math.PI / 4);
}

/** 階段形の頂点列を返す。base は左下の頂点。 */
export function stairs(
  base: Vec2,
  w: number,
  h: number,
  steps: number,
  upStairs = true,
): Vec2[] {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error("stairs: steps must be an integer greater than or equal to 1.");
  }
  if (!(Number.isFinite(w) && w > 0)) {
    throw new RangeError("stairs: w must be a positive finite number.");
  }
  if (!(Number.isFinite(h) && h > 0)) {
    throw new RangeError("stairs: h must be a positive finite number.");
  }

  const { x, y } = base;
  const stepW = w / steps;
  const stepH = h / steps;

  const points: Vec2[] = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y - h },
  ];
  for (let i = 1; i <= steps - 1; i++) {
    points.push({ x: x + w - i * stepW, y: y - h + (i - 1) * stepH });
    points.push({ x: x + w - i * stepW, y: y - h + i * stepH });
  }

  // 最下段の踏み面の左端。これが無いと (x, y) への閉路が最終段を斜めに切る。
  points.push({ x, y: y - stepH });

  if (!upStairs) {
    return points.map((point) => ({
      x: base.x + w - (point.x - base.x),
      y: point.y,
    }));
  }
  return points;
}

/** アステロイド曲線を64分割サンプリングした頂点列を返す。 */
export function astroid(center: Vec2, a: number, b = a, angle = 0): Vec2[] {
  if (!(Number.isFinite(a) && a > 0)) {
    throw new RangeError("astroid: a must be a positive finite number.");
  }
  if (!(Number.isFinite(b) && b > 0)) {
    throw new RangeError("astroid: b must be a positive finite number.");
  }

  const segments = 64;
  const localPoints: Vec2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = ((2 * Math.PI) / segments) * i;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    localPoints.push({
      x: a * cosT * cosT * cosT,
      y: b * sinT * sinT * sinT,
    });
  }
  return toWorldPoints(localPoints, center, angle);
}
