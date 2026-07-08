export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Circle = {
  kind: "circle";
  center: Vec2;
  r: number;
};

export type Line = {
  kind: "line";
  from: Vec2;
  to: Vec2;
};

export type Shape = Circle | Rect | Line;

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { kind: "rect", x, y, w, h };
}

export function circle(center: Vec2, r: number): Circle {
  return { kind: "circle", center, r };
}

export function line(from: Vec2, to: Vec2): Line {
  return { kind: "line", from, to };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function mul(v: Vec2, scalar: number): Vec2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function centerOf(rect: Rect): Vec2 {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

/**
 * 点列の軸平行バウンディングボックスを返す。
 */
export function boundsOfPoints(points: readonly Vec2[]): Rect {
  if (points.length === 0) {
    throw new Error("boundsOfPoints: points must not be empty.");
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return rect(minX, minY, maxX - minX, maxY - minY);
}

/**
 * 図形の軸平行バウンディングボックスを返す。
 * 図形操作の boundingRect と描画側のグラデーション基準はこの関数に集約する。
 */
export function boundsOf(shape: Shape): Rect {
  if (isRect(shape)) {
    return rect(shape.x, shape.y, shape.w, shape.h);
  }

  if (isCircle(shape)) {
    return rect(
      shape.center.x - shape.r,
      shape.center.y - shape.r,
      shape.r * 2,
      shape.r * 2,
    );
  }

  return boundsOfPoints([shape.from, shape.to]);
}

/**
 * Siv3D の boundingRect() 相当。boundsOf の別名。
 */
export const boundingRect = boundsOf;

export function moved(shape: Rect, offset: Vec2): Rect;
export function moved(shape: Circle, offset: Vec2): Circle;
export function moved(shape: Line, offset: Vec2): Line;
export function moved(shape: Shape, offset: Vec2): Shape {
  if (isRect(shape)) {
    return {
      ...shape,
      x: shape.x + offset.x,
      y: shape.y + offset.y,
    };
  }

  if (isCircle(shape)) {
    return {
      ...shape,
      center: add(shape.center, offset),
    };
  }

  return {
    kind: "line",
    from: add(shape.from, offset),
    to: add(shape.to, offset),
  };
}

export function contains(rect: Rect, point: Vec2): boolean;
export function contains(circle: Circle, point: Vec2): boolean;
export function contains(polygon: readonly Vec2[], point: Vec2): boolean;
export function contains(
  shape: Rect | Circle | readonly Vec2[],
  point: Vec2,
): boolean {
  if (Array.isArray(shape)) {
    return polygonContainsPoint(
      shape as readonly Vec2[],
      point,
      "contains",
    );
  }

  const target = shape as Rect | Circle;

  if (isRect(target)) {
    return (
      point.x >= target.x &&
      point.x <= target.x + target.w &&
      point.y >= target.y &&
      point.y <= target.y + target.h
    );
  }

  return distance(target.center, point) <= target.r;
}

export function intersects(a: Rect, b: Rect): boolean;
export function intersects(a: Circle, b: Circle): boolean;
export function intersects(a: Rect, b: Circle): boolean;
export function intersects(a: Circle, b: Rect): boolean;
export function intersects(a: Line, b: Line): boolean;
export function intersects(a: Line, b: Rect): boolean;
export function intersects(a: Rect, b: Line): boolean;
export function intersects(a: Line, b: Circle): boolean;
export function intersects(a: Circle, b: Line): boolean;
export function intersects(a: readonly Vec2[], b: Shape | readonly Vec2[]): boolean;
export function intersects(a: Shape, b: readonly Vec2[]): boolean;
export function intersects(
  a: Shape | readonly Vec2[],
  b: Shape | readonly Vec2[],
): boolean {
  // 多角形（頂点配列）を含む組み合わせは対称なので片側へ寄せる。
  if (Array.isArray(a)) {
    return intersectsPolygon(a as readonly Vec2[], b);
  }

  if (Array.isArray(b)) {
    return intersectsPolygon(b as readonly Vec2[], a);
  }

  const sa = a as Shape;
  const sb = b as Shape;

  if (isLine(sa)) {
    return intersectsLine(sa, sb);
  }

  if (isLine(sb)) {
    return intersectsLine(sb, sa);
  }

  if (isRect(sa) && isRect(sb)) {
    return (
      sa.x <= sb.x + sb.w &&
      sa.x + sa.w >= sb.x &&
      sa.y <= sb.y + sb.h &&
      sa.y + sa.h >= sb.y
    );
  }

  if (isCircle(sa) && isCircle(sb)) {
    return distance(sa.center, sb.center) <= sa.r + sb.r;
  }

  if (isRect(sa) && isCircle(sb)) {
    return intersectsRectCircle(sa, sb);
  }

  if (isCircle(sa) && isRect(sb)) {
    return intersectsRectCircle(sb, sa);
  }

  throw new Error("intersects: unsupported shape combination.");
}

const GEOMETRY_EPSILON = 1e-9;

// 外積 (a - o) × (b - o)。符号が p1→p2 に対する b の側を表す。
function crossAt(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// p が線分 ab 上にあるか（共線であることを前提に bbox で判定）。
function onSegment(p: Vec2, a: Vec2, b: Vec2): boolean {
  return (
    Math.min(a.x, b.x) - GEOMETRY_EPSILON <= p.x &&
    p.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON &&
    Math.min(a.y, b.y) - GEOMETRY_EPSILON <= p.y &&
    p.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON
  );
}

// 線分 p1p2 と p3p4 の交差判定（端点接触・共線重なりを含む）。
function segmentsIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d1 = crossAt(p3, p4, p1);
  const d2 = crossAt(p3, p4, p2);
  const d3 = crossAt(p1, p2, p3);
  const d4 = crossAt(p1, p2, p4);

  if (
    ((d1 > GEOMETRY_EPSILON && d2 < -GEOMETRY_EPSILON) ||
      (d1 < -GEOMETRY_EPSILON && d2 > GEOMETRY_EPSILON)) &&
    ((d3 > GEOMETRY_EPSILON && d4 < -GEOMETRY_EPSILON) ||
      (d3 < -GEOMETRY_EPSILON && d4 > GEOMETRY_EPSILON))
  ) {
    return true;
  }

  if (Math.abs(d1) <= GEOMETRY_EPSILON && onSegment(p1, p3, p4)) {
    return true;
  }

  if (Math.abs(d2) <= GEOMETRY_EPSILON && onSegment(p2, p3, p4)) {
    return true;
  }

  if (Math.abs(d3) <= GEOMETRY_EPSILON && onSegment(p3, p1, p2)) {
    return true;
  }

  return Math.abs(d4) <= GEOMETRY_EPSILON && onSegment(p4, p1, p2);
}

// 点 p と線分 ab の最短距離。
function distancePointToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;

  if (lengthSquared === 0) {
    return distance(p, a);
  }

  const t = clamp(
    ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared,
    0,
    1,
  );

  return distance(p, { x: a.x + abx * t, y: a.y + aby * t });
}

function assertPolygon(points: readonly Vec2[], caller: string): void {
  if (points.length < 3) {
    throw new Error(`${caller}: polygon must contain at least 3 points.`);
  }
}

// 境界上を内側とみなす偶奇判定（レイキャスティング）。
function polygonContainsPoint(
  points: readonly Vec2[],
  p: Vec2,
  caller: string,
): boolean {
  assertPolygon(points, caller);

  const n = points.length;
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const a = points[j]!;
    const b = points[i]!;

    if (distancePointToSegment(p, a, b) <= GEOMETRY_EPSILON) {
      return true;
    }

    if (a.y > p.y !== b.y > p.y) {
      const crossX = a.x + ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y);

      if (p.x < crossX) {
        inside = !inside;
      }
    }
  }

  return inside;
}

function rectToPoints(rect: Rect): Vec2[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
}

// 線分 vs 各図形。
function intersectsLine(line: Line, other: Shape): boolean {
  if (isLine(other)) {
    return segmentsIntersect(line.from, line.to, other.from, other.to);
  }

  if (isCircle(other)) {
    return (
      distancePointToSegment(other.center, line.from, line.to) <= other.r
    );
  }

  // Rect: 端点が内部にあるか、4 辺のいずれかと交差するか。
  if (contains(other, line.from) || contains(other, line.to)) {
    return true;
  }

  const corners = rectToPoints(other);

  for (let i = 0; i < 4; i += 1) {
    const a = corners[i]!;
    const b = corners[(i + 1) % 4]!;

    if (segmentsIntersect(line.from, line.to, a, b)) {
      return true;
    }
  }

  return false;
}

// 多角形 vs 図形または多角形。
function intersectsPolygon(
  polygon: readonly Vec2[],
  other: Shape | readonly Vec2[],
): boolean {
  assertPolygon(polygon, "intersects");

  const n = polygon.length;

  if (Array.isArray(other)) {
    const otherPolygon = other as readonly Vec2[];
    assertPolygon(otherPolygon, "intersects");

    // 辺同士の交差、または一方が他方を完全に含むケース。
    for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
      const a = polygon[j]!;
      const b = polygon[i]!;
      const m = otherPolygon.length;

      for (let k = 0, l = m - 1; k < m; l = k, k += 1) {
        if (segmentsIntersect(a, b, otherPolygon[l]!, otherPolygon[k]!)) {
          return true;
        }
      }
    }

    return (
      polygonContainsPoint(polygon, otherPolygon[0]!, "intersects") ||
      polygonContainsPoint(otherPolygon, polygon[0]!, "intersects")
    );
  }

  const shape = other as Shape;

  if (isRect(shape)) {
    return intersectsPolygon(polygon, rectToPoints(shape));
  }

  if (isCircle(shape)) {
    if (polygonContainsPoint(polygon, shape.center, "intersects")) {
      return true;
    }

    for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
      if (
        distancePointToSegment(shape.center, polygon[j]!, polygon[i]!) <=
        shape.r
      ) {
        return true;
      }
    }

    return false;
  }

  // Line: いずれかの辺と交差するか、端点が内部にあるか。
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    if (segmentsIntersect(shape.from, shape.to, polygon[j]!, polygon[i]!)) {
      return true;
    }
  }

  return polygonContainsPoint(polygon, shape.from, "intersects");
}

function intersectsRectCircle(rect: Rect, circle: Circle): boolean {
  const nearest = {
    x: clamp(circle.center.x, rect.x, rect.x + rect.w),
    y: clamp(circle.center.y, rect.y, rect.y + rect.h),
  };

  return distance(nearest, circle.center) <= circle.r;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isRect(shape: Shape): shape is Rect {
  return shape.kind === "rect";
}

function isCircle(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}

function isLine(shape: Shape): shape is Line {
  return shape.kind === "line";
}

function assertFiniteFactor(name: string, factor: number): void {
  if (!Number.isFinite(factor)) {
    throw new RangeError(`${name}: factor must be a finite number.`);
  }
}

function toFactorVec2(name: string, factor: number | Vec2): Vec2 {
  if (typeof factor === "number") {
    assertFiniteFactor(name, factor);
    return { x: factor, y: factor };
  }
  assertFiniteFactor(name, factor.x);
  assertFiniteFactor(name, factor.y);
  return factor;
}

export function scaled(shape: Rect, factor: number | Vec2): Rect;
export function scaled(shape: Circle, factor: number): Circle;
export function scaled(
  shape: Rect | Circle,
  factor: number | Vec2,
): Rect | Circle {
  if (isRect(shape)) {
    toFactorVec2("scaled", factor);
    return scaledAt(shape, centerOf(shape), factor);
  }

  if (typeof factor !== "number") {
    throw new RangeError("scaled: factor must be a finite number.");
  }
  assertFiniteFactor("scaled", factor);
  if (factor < 0) {
    throw new RangeError("scaled: factor must not be negative.");
  }

  return scaledAt(shape, shape.center, factor);
}

export function scaledAt(shape: Rect, pos: Vec2, factor: number | Vec2): Rect;
export function scaledAt(shape: Circle, pos: Vec2, factor: number): Circle;
export function scaledAt(
  shape: Rect | Circle,
  pos: Vec2,
  factor: number | Vec2,
): Rect | Circle {
  if (isRect(shape)) {
    const { x: fx, y: fy } = toFactorVec2("scaledAt", factor);
    const newX = pos.x + (shape.x - pos.x) * fx;
    const newY = pos.y + (shape.y - pos.y) * fy;
    return rect(newX, newY, shape.w * fx, shape.h * fy);
  }

  if (typeof factor !== "number") {
    throw new RangeError("scaledAt: factor must be a finite number.");
  }
  assertFiniteFactor("scaledAt", factor);
  if (factor < 0) {
    throw new RangeError("scaledAt: factor must not be negative.");
  }

  const newCenter = {
    x: pos.x + (shape.center.x - pos.x) * factor,
    y: pos.y + (shape.center.y - pos.y) * factor,
  };
  return circle(newCenter, shape.r * factor);
}

export function stretched(rect: Rect, all: number): Rect;
export function stretched(rect: Rect, x: number, y: number): Rect;
export function stretched(
  rect: Rect,
  top: number,
  right: number,
  bottom: number,
  left: number,
): Rect;
export function stretched(
  target: Rect,
  a: number,
  b?: number,
  c?: number,
  d?: number,
): Rect {
  let top: number;
  let right: number;
  let bottom: number;
  let left: number;

  if (c !== undefined && d !== undefined) {
    top = a;
    right = b as number;
    bottom = c;
    left = d;
  } else if (b !== undefined) {
    left = right = b;
    top = bottom = a;
  } else {
    top = right = bottom = left = a;
  }

  return {
    kind: "rect",
    x: target.x - left,
    y: target.y - top,
    w: target.w + left + right,
    h: target.h + top + bottom,
  };
}

export function rotatedAt(point: Vec2, center: Vec2, angle: number): Vec2 {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function rotatedPointsAt(
  points: readonly Vec2[],
  center: Vec2,
  angle: number,
): Vec2[] {
  return points.map((point) => rotatedAt(point, center, angle));
}

export function rotatedRectAt(
  rect: Rect,
  center: Vec2,
  angle: number,
): [Vec2, Vec2, Vec2, Vec2] {
  const topLeft = { x: rect.x, y: rect.y };
  const topRight = { x: rect.x + rect.w, y: rect.y };
  const bottomRight = { x: rect.x + rect.w, y: rect.y + rect.h };
  const bottomLeft = { x: rect.x, y: rect.y + rect.h };

  return [
    rotatedAt(topLeft, center, angle),
    rotatedAt(topRight, center, angle),
    rotatedAt(bottomRight, center, angle),
    rotatedAt(bottomLeft, center, angle),
  ];
}

export function area(shape: Rect | Circle): number {
  if (isRect(shape)) {
    return shape.w * shape.h;
  }
  return Math.PI * shape.r * shape.r;
}

export function areaOfPolygon(points: readonly Vec2[]): number {
  if (points.length < 3) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i] as Vec2;
    const next = points[(i + 1) % points.length] as Vec2;
    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

export function perimeter(shape: Rect | Circle | Line): number {
  if (isRect(shape)) {
    return 2 * (shape.w + shape.h);
  }
  if (isCircle(shape)) {
    return 2 * Math.PI * shape.r;
  }
  return distance(shape.from, shape.to);
}

export function perimeterOfPolygon(points: readonly Vec2[]): number {
  if (points.length < 2) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i] as Vec2;
    const next = points[(i + 1) % points.length] as Vec2;
    sum += distance(current, next);
  }

  return sum;
}

export function getPointByAngle(circle: Circle, angle: number): Vec2 {
  return {
    x: circle.center.x + circle.r * Math.sin(angle),
    y: circle.center.y - circle.r * Math.cos(angle),
  };
}

export function shearedX(
  rect: Rect,
  px: number,
): [Vec2, Vec2, Vec2, Vec2] {
  const { x, y, w, h } = rect;
  return [
    { x: x + px, y },
    { x: x + w + px, y },
    { x: x + w - px, y: y + h },
    { x: x - px, y: y + h },
  ];
}

export function shearedY(
  rect: Rect,
  px: number,
): [Vec2, Vec2, Vec2, Vec2] {
  const { x, y, w, h } = rect;
  return [
    { x, y: y - px },
    { x: x + w, y: y + px },
    { x: x + w, y: y + h + px },
    { x, y: y + h - px },
  ];
}

function assertSkewAngle(name: string, angle: number): void {
  if (Math.abs(angle) >= Math.PI / 2) {
    throw new RangeError(`${name}: angle must be less than PI / 2 in magnitude.`);
  }
}

export function skewedX(
  rect: Rect,
  angle: number,
): [Vec2, Vec2, Vec2, Vec2] {
  assertSkewAngle("skewedX", angle);
  const offset = Math.tan(angle) * (rect.h / 2);
  return shearedX(rect, offset);
}

export function skewedY(
  rect: Rect,
  angle: number,
): [Vec2, Vec2, Vec2, Vec2] {
  assertSkewAngle("skewedY", angle);
  const offset = Math.tan(angle) * (rect.w / 2);
  return shearedY(rect, offset);
}
