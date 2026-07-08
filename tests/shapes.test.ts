import { test } from "node:test";
import assert from "node:assert/strict";
import type { Vec2 } from "../src/geometry.js";
import {
  ngon,
  pentagon,
  hexagon,
  nStar,
  star,
  rhombus,
  plus,
  cross,
  stairs,
  astroid,
} from "../src/shapes.js";

const EPS = 1e-9;

/** 靴紐公式によるローカル面積計算（テスト用）。 */
function shoelaceArea(points: readonly Vec2[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i]!;
    const next = points[(i + 1) % points.length]!;
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

test("ngon: 4角形の頂点数・第0頂点・center からの距離を確認する", () => {
  const center: Vec2 = { x: 10, y: 20 };
  const r = 5;
  const points = ngon(center, 4, r);

  assert.strictEqual(points.length, 4);
  assert.ok(Math.abs(points[0]!.x - center.x) < EPS);
  assert.ok(Math.abs(points[0]!.y - (center.y - r)) < EPS);

  for (const p of points) {
    assert.ok(Math.abs(distance(p, center) - r) < EPS);
  }
});

test("ngon: n が3未満だとthrowする", () => {
  assert.throws(
    () => ngon({ x: 0, y: 0 }, 2, 5),
    /ngon: n must be an integer greater than or equal to 3\./,
  );
});

test("pentagon/hexagon: ngon への委譲として頂点数が一致する", () => {
  assert.strictEqual(pentagon({ x: 0, y: 0 }, 5).length, 5);
  assert.strictEqual(hexagon({ x: 0, y: 0 }, 5).length, 6);
});

test("nStar: 5個の頂点で10頂点、偶数番目がrOuter・奇数番目がrInnerの距離になる", () => {
  const center: Vec2 = { x: 0, y: 0 };
  const rOuter = 10;
  const rInner = 4;
  const points = nStar(center, 5, rOuter, rInner);

  assert.strictEqual(points.length, 10);
  for (let i = 0; i < points.length; i++) {
    const expected = i % 2 === 0 ? rOuter : rInner;
    assert.ok(Math.abs(distance(points[i]!, center) - expected) < EPS);
  }
});

test("nStar: n が2未満だとthrowする", () => {
  assert.throws(() => nStar({ x: 0, y: 0 }, 1, 10, 5));
});

test("nStar: rOuter/rInnerが非正だとRangeErrorになる", () => {
  assert.throws(() => nStar({ x: 0, y: 0 }, 5, 0, 5), RangeError);
  assert.throws(() => nStar({ x: 0, y: 0 }, 5, 10, -1), RangeError);
});

test("star: 五芒星がnStar(5, r, r*(3-sqrt5)/2)と一致する", () => {
  const center: Vec2 = { x: 1, y: 2 };
  const r = 8;
  const expected = nStar(center, 5, r, r * ((3 - Math.sqrt(5)) / 2));
  const actual = star(center, r);

  assert.deepStrictEqual(actual, expected);
});

test("rhombus: 4頂点の座標が仕様通りになる", () => {
  const center: Vec2 = { x: 3, y: 4 };
  const w = 6;
  const h = 10;
  const points = rhombus(center, w, h);

  assert.strictEqual(points.length, 4);
  assert.deepStrictEqual(points[0], { x: center.x, y: center.y - h / 2 });
  assert.deepStrictEqual(points[1], { x: center.x + w / 2, y: center.y });
  assert.deepStrictEqual(points[2], { x: center.x, y: center.y + h / 2 });
  assert.deepStrictEqual(points[3], { x: center.x - w / 2, y: center.y });
});

test("plus: 12頂点でbboxが(±r, ±r)になる", () => {
  const center: Vec2 = { x: 0, y: 0 };
  const r = 10;
  const width = 4;
  const points = plus(center, r, width);

  assert.strictEqual(points.length, 12);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  assert.ok(Math.abs(minX + r) < EPS);
  assert.ok(Math.abs(maxX - r) < EPS);
  assert.ok(Math.abs(minY + r) < EPS);
  assert.ok(Math.abs(maxY - r) < EPS);
});

test("plus: widthが2rを超えるとRangeErrorになる", () => {
  assert.throws(() => plus({ x: 0, y: 0 }, 10, 21), RangeError);
});

test("cross: plusをπ/4回転したものと一致する", () => {
  const center: Vec2 = { x: 5, y: -2 };
  const r = 10;
  const width = 4;
  const angle = 0.3;

  const expected = plus(center, r, width, angle + Math.PI / 4);
  const actual = cross(center, r, width, angle);

  assert.strictEqual(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) {
    assert.ok(Math.abs(actual[i]!.x - expected[i]!.x) < EPS);
    assert.ok(Math.abs(actual[i]!.y - expected[i]!.y) < EPS);
  }
});

test("stairs: steps=3で頂点数8、bboxがw×hになる", () => {
  const base: Vec2 = { x: 0, y: 0 };
  const w = 9;
  const h = 6;
  const points = stairs(base, w, h, 3);

  // 3 + 2*(steps-1) + 最下段踏み面の左端 1 点
  assert.strictEqual(points.length, 3 + 2 * 2 + 1);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  assert.ok(Math.abs(maxX - minX - w) < EPS);
  assert.ok(Math.abs(maxY - minY - h) < EPS);
});

test("stairs: upStairs=falseでxが反転する", () => {
  const base: Vec2 = { x: 2, y: 5 };
  const w = 9;
  const h = 6;
  const up = stairs(base, w, h, 3, true);
  const down = stairs(base, w, h, 3, false);

  assert.strictEqual(up.length, down.length);
  for (let i = 0; i < up.length; i++) {
    const expectedX = base.x + w - (up[i]!.x - base.x);
    assert.ok(Math.abs(down[i]!.x - expectedX) < EPS);
    assert.ok(Math.abs(down[i]!.y - up[i]!.y) < EPS);
  }
});

test("stairs: steps=1は長方形になる", () => {
  const points = stairs({ x: 0, y: 0 }, 4, 3, 1);

  assert.deepStrictEqual(points, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: -3 },
    { x: 0, y: -3 },
  ]);
});

test("stairs: stepsが1未満だとthrowする", () => {
  assert.throws(() => stairs({ x: 0, y: 0 }, 9, 6, 0));
});

test("stairs: w/hが非正だとRangeErrorになる", () => {
  assert.throws(() => stairs({ x: 0, y: 0 }, -1, 6, 3), RangeError);
  assert.throws(() => stairs({ x: 0, y: 0 }, 9, 0, 3), RangeError);
});

test("astroid: 64頂点、t=0相当の頂点が(cx+a, cy)、bboxが(±a,±b)になる", () => {
  const center: Vec2 = { x: 1, y: 1 };
  const a = 10;
  const b = 6;
  const points = astroid(center, a, b);

  assert.strictEqual(points.length, 64);
  assert.ok(Math.abs(points[0]!.x - (center.x + a)) < EPS);
  assert.ok(Math.abs(points[0]!.y - center.y) < EPS);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  assert.ok(Math.abs(minX - (center.x - a)) < EPS);
  assert.ok(Math.abs(maxX - (center.x + a)) < EPS);
  assert.ok(Math.abs(minY - (center.y - b)) < EPS);
  assert.ok(Math.abs(maxY - (center.y + b)) < EPS);
});

test("astroid: a/bが非正だとRangeErrorになる", () => {
  assert.throws(() => astroid({ x: 0, y: 0 }, 0), RangeError);
  assert.throws(() => astroid({ x: 0, y: 0 }, 10, -1), RangeError);
});

test("靴紐公式: 正六角形の面積が (3√3/2) r^2 に一致する", () => {
  const r = 4;
  const points = hexagon({ x: 0, y: 0 }, r);
  const area = shoelaceArea(points);
  const expected = ((3 * Math.sqrt(3)) / 2) * r * r;

  assert.ok(Math.abs(area - expected) < 1e-6);
});
