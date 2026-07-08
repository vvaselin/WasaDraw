import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rect,
  circle,
  line,
  scaled,
  scaledAt,
  stretched,
  rotatedAt,
  rotatedPointsAt,
  rotatedRectAt,
  area,
  areaOfPolygon,
  perimeter,
  perimeterOfPolygon,
  getPointByAngle,
  shearedX,
  shearedY,
  skewedX,
  skewedY,
} from "../src/geometry.js";

const EPSILON = 1e-9;

function assertVec2Close(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
  epsilon = EPSILON,
): void {
  assert.ok(
    Math.abs(actual.x - expected.x) < epsilon,
    `x が一致しない (実際: ${actual.x}, 期待: ${expected.x})`,
  );
  assert.ok(
    Math.abs(actual.y - expected.y) < epsilon,
    `y が一致しない (実際: ${actual.y}, 期待: ${expected.y})`,
  );
}

test("scaled: Rect は中心を基準に拡大縮小する", () => {
  const r = scaled(rect(0, 0, 10, 10), 2);
  assert.deepStrictEqual(r, rect(-5, -5, 20, 20));
});

test("scaledAt: 原点基準の拡大縮小", () => {
  const r = scaledAt(rect(0, 0, 10, 10), { x: 0, y: 0 }, 2);
  assert.deepStrictEqual(r, rect(0, 0, 20, 20));
});

test("scaledAt: Vec2 factor による非等方スケール", () => {
  const r = scaledAt(rect(0, 0, 10, 10), { x: 0, y: 0 }, { x: 2, y: 3 });
  assert.deepStrictEqual(r, rect(0, 0, 20, 30));
});

test("scaled/scaledAt: 非有限 factor は RangeError", () => {
  assert.throws(() => scaled(rect(0, 0, 10, 10), NaN), RangeError);
  assert.throws(() => scaled(circle({ x: 0, y: 0 }, 5), Infinity), RangeError);
});

test("scaled: Circle の factor 負値は RangeError", () => {
  assert.throws(() => scaled(circle({ x: 0, y: 0 }, 5), -1), RangeError);
});

test("stretched: 引数1つは全方向に均等伸縮する", () => {
  const r = stretched(rect(0, 0, 10, 10), 5);
  assert.deepStrictEqual(r, rect(-5, -5, 20, 20));
});

test("stretched: 引数2つはx方向・y方向で独立に伸縮する", () => {
  const r = stretched(rect(0, 0, 10, 10), 1, 2);
  assert.deepStrictEqual(r, rect(-2, -1, 14, 12));
});

test("stretched: 引数4つはtop/right/bottom/leftそれぞれに伸縮する", () => {
  const r = stretched(rect(0, 0, 10, 10), 1, 2, 3, 4);
  assert.deepStrictEqual(r, rect(-4, -1, 16, 14));
});

test("rotatedAt: 90度回転の座標が近似一致する", () => {
  const p = rotatedAt({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
  assertVec2Close(p, { x: 0, y: 1 });
});

test("rotatedPointsAt: 複数点をまとめて回転する", () => {
  const points = rotatedPointsAt(
    [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    { x: 0, y: 0 },
    Math.PI / 2,
  );
  assertVec2Close(points[0]!, { x: 0, y: 1 });
  assertVec2Close(points[1]!, { x: -1, y: 0 });
});

test("rotatedRectAt: 4頂点が回転後の位置になる", () => {
  const [tl, tr, br, bl] = rotatedRectAt(
    rect(0, 0, 2, 2),
    { x: 0, y: 0 },
    Math.PI / 2,
  );
  assertVec2Close(tl, { x: 0, y: 0 });
  assertVec2Close(tr, { x: 0, y: 2 });
  assertVec2Close(br, { x: -2, y: 2 });
  assertVec2Close(bl, { x: -2, y: 0 });
});

test("area: Rect は w*h", () => {
  assert.equal(area(rect(0, 0, 4, 5)), 20);
});

test("area: Circle は πr²", () => {
  assert.ok(Math.abs(area(circle({ x: 0, y: 0 }, 3)) - Math.PI * 9) < EPSILON);
});

test("areaOfPolygon: 三角形の面積は靴紐公式で6", () => {
  const points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];
  assert.equal(areaOfPolygon(points), 6);
});

test("areaOfPolygon: 頂点順を逆にしても面積は6", () => {
  const points = [{ x: 0, y: 0 }, { x: 0, y: 3 }, { x: 4, y: 0 }];
  assert.equal(areaOfPolygon(points), 6);
});

test("areaOfPolygon: 3点未満は0", () => {
  assert.equal(areaOfPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }]), 0);
});

test("perimeter: Rect は 2(w+h)", () => {
  assert.equal(perimeter(rect(0, 0, 4, 5)), 18);
});

test("perimeter: Circle は 2πr", () => {
  assert.ok(
    Math.abs(perimeter(circle({ x: 0, y: 0 }, 3)) - 2 * Math.PI * 3) < EPSILON,
  );
});

test("perimeter: Line は長さ", () => {
  assert.equal(perimeter(line({ x: 0, y: 0 }, { x: 3, y: 4 })), 5);
});

test("perimeterOfPolygon: 正方形は4辺の合計", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ];
  assert.equal(perimeterOfPolygon(points), 8);
});

test("perimeterOfPolygon: 2点未満は0", () => {
  assert.equal(perimeterOfPolygon([{ x: 0, y: 0 }]), 0);
});

test("getPointByAngle: angle 0 は真上", () => {
  const p = getPointByAngle(circle({ x: 10, y: 10 }, 5), 0);
  assertVec2Close(p, { x: 10, y: 5 });
});

test("getPointByAngle: angle π/2 は右", () => {
  const p = getPointByAngle(circle({ x: 10, y: 10 }, 5), Math.PI / 2);
  assertVec2Close(p, { x: 15, y: 10 });
});

test("shearedX: 仕様式通りの頂点座標になる", () => {
  const points = shearedX(rect(0, 0, 10, 10), 2);
  assert.deepStrictEqual(points, [
    { x: 2, y: 0 },
    { x: 12, y: 0 },
    { x: 8, y: 10 },
    { x: -2, y: 10 },
  ]);
});

test("shearedY: 仕様式通りの頂点座標になる", () => {
  const points = shearedY(rect(0, 0, 10, 10), 2);
  assert.deepStrictEqual(points, [
    { x: 0, y: -2 },
    { x: 10, y: 2 },
    { x: 10, y: 12 },
    { x: 0, y: 8 },
  ]);
});

test("skewedX: π/4はshearedX(h/2)と一致する", () => {
  const r = rect(0, 0, 10, 10);
  const skewed = skewedX(r, Math.PI / 4);
  const sheared = shearedX(r, r.h / 2);
  assertVec2Close(skewed[0], sheared[0]);
  assertVec2Close(skewed[1], sheared[1]);
  assertVec2Close(skewed[2], sheared[2]);
  assertVec2Close(skewed[3], sheared[3]);
});

test("skewedX: π/2はRangeErrorになる", () => {
  assert.throws(() => skewedX(rect(0, 0, 10, 10), Math.PI / 2), RangeError);
});

test("skewedY: π/4はshearedY(w/2)と一致する", () => {
  const r = rect(0, 0, 10, 10);
  const skewed = skewedY(r, Math.PI / 4);
  const sheared = shearedY(r, r.w / 2);
  assertVec2Close(skewed[0], sheared[0]);
  assertVec2Close(skewed[1], sheared[1]);
  assertVec2Close(skewed[2], sheared[2]);
  assertVec2Close(skewed[3], sheared[3]);
});
