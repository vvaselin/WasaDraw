import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bezier2,
  bezier3,
  pointOnBezier2,
  pointOnBezier3,
  splineToBeziers,
} from "../src/curve.js";

test("pointOnBezier2: t=0でp0、t=1で終点に一致する", () => {
  const curve = bezier2({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 });

  assert.deepStrictEqual(pointOnBezier2(curve, 0), { x: 0, y: 0 });
  assert.deepStrictEqual(pointOnBezier2(curve, 1), { x: 1, y: 1 });
});

test("pointOnBezier2: t=0.5の値が手計算値と一致する", () => {
  const curve = bezier2({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 });
  const p = pointOnBezier2(curve, 0.5);

  assert.ok(Math.abs(p.x - 0.75) < 1e-9);
  assert.ok(Math.abs(p.y - 0.25) < 1e-9);
});

test("pointOnBezier3: t=0でp0、t=1で終点に一致する", () => {
  const curve = bezier3(
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
  );

  assert.deepStrictEqual(pointOnBezier3(curve, 0), { x: 0, y: 0 });
  assert.deepStrictEqual(pointOnBezier3(curve, 1), { x: 3, y: 3 });
});

test("pointOnBezier3: t=0.5の値が手計算値と一致する", () => {
  const curve = bezier3(
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
  );
  const p = pointOnBezier3(curve, 0.5);

  // (1-t)^3 p0 + 3(1-t)^2 t p1 + 3(1-t) t^2 p2 + t^3 p3, t=0.5
  // 係数はすべて 0.125, 0.375, 0.375, 0.125
  const expectedX = 0.125 * 0 + 0.375 * 1 + 0.375 * 2 + 0.125 * 3;
  const expectedY = 0.125 * 0 + 0.375 * 0 + 0.375 * 0 + 0.125 * 3;

  assert.ok(Math.abs(p.x - expectedX) < 1e-9);
  assert.ok(Math.abs(p.y - expectedY) < 1e-9);
});

test("splineToBeziers: 開曲線で3点入力すると区間数2で連続する", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 0 },
  ];
  const beziers = splineToBeziers(points);

  assert.strictEqual(beziers.length, 2);
  assert.deepStrictEqual(beziers[0]!.p0, points[0]);
  assert.deepStrictEqual(beziers[0]!.p3, points[1]);
  assert.deepStrictEqual(beziers[1]!.p0, points[1]);
  assert.deepStrictEqual(beziers[1]!.p3, points[2]);
  assert.deepStrictEqual(beziers[0]!.p3, beziers[1]!.p0);
});

test("splineToBeziers: 閉曲線で3点入力すると区間数3で最後が最初に戻る", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 0 },
  ];
  const beziers = splineToBeziers(points, { closed: true });

  assert.strictEqual(beziers.length, 3);
  assert.deepStrictEqual(beziers[2]!.p3, points[0]);
});

test("splineToBeziers: 直線上の点列では制御点も同一直線上になる", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ];
  const beziers = splineToBeziers(points);

  for (const b of beziers) {
    assert.strictEqual(b.p0.y, 0);
    assert.strictEqual(b.p1.y, 0);
    assert.strictEqual(b.p2.y, 0);
    assert.strictEqual(b.p3.y, 0);
  }
});

test("splineToBeziers: 1点入力ではthrowする", () => {
  assert.throws(
    () => splineToBeziers([{ x: 0, y: 0 }]),
    /splineToBeziers: points must contain at least 2 points\./,
  );
});
