import { test } from "node:test";
import assert from "node:assert/strict";
import {
  circle,
  contains,
  intersects,
  line,
  rect,
  vec2,
  type Vec2,
} from "../src/geometry.js";

const square: Vec2[] = [vec2(0, 0), vec2(10, 0), vec2(10, 10), vec2(0, 10)];

// 凹多角形（L字）: (5,5)-(9,9) の切り欠きは外側
const lShape: Vec2[] = [
  vec2(0, 0),
  vec2(10, 0),
  vec2(10, 5),
  vec2(5, 5),
  vec2(5, 10),
  vec2(0, 10),
];

test("contains(polygon): 内部・外部・境界", () => {
  assert.equal(contains(square, vec2(5, 5)), true);
  assert.equal(contains(square, vec2(11, 5)), false);
  assert.equal(contains(square, vec2(0, 5)), true); // 辺上
  assert.equal(contains(square, vec2(10, 10)), true); // 頂点上
});

test("contains(polygon): 凹多角形の切り欠きは外側", () => {
  assert.equal(contains(lShape, vec2(2, 2)), true);
  assert.equal(contains(lShape, vec2(8, 8)), false);
});

test("contains(polygon): 3点未満は throw", () => {
  assert.throws(() => contains([vec2(0, 0), vec2(1, 1)], vec2(0, 0)), Error);
});

test("intersects(line, line): 交差・非交差・端点接触・共線", () => {
  assert.equal(
    intersects(line(vec2(0, 0), vec2(10, 10)), line(vec2(0, 10), vec2(10, 0))),
    true,
  );
  assert.equal(
    intersects(line(vec2(0, 0), vec2(1, 1)), line(vec2(5, 0), vec2(6, 1))),
    false,
  );
  // 端点で接触
  assert.equal(
    intersects(line(vec2(0, 0), vec2(5, 5)), line(vec2(5, 5), vec2(10, 0))),
    true,
  );
  // 共線で重なる / 共線で離れている
  assert.equal(
    intersects(line(vec2(0, 0), vec2(5, 0)), line(vec2(3, 0), vec2(8, 0))),
    true,
  );
  assert.equal(
    intersects(line(vec2(0, 0), vec2(2, 0)), line(vec2(3, 0), vec2(8, 0))),
    false,
  );
});

test("intersects(line, rect): 貫通・内包・辺接触・非交差", () => {
  const r = rect(0, 0, 10, 10);
  assert.equal(intersects(line(vec2(-5, 5), vec2(15, 5)), r), true); // 貫通
  assert.equal(intersects(line(vec2(2, 2), vec2(8, 8)), r), true); // 完全内包
  assert.equal(intersects(line(vec2(-5, 10), vec2(15, 10)), r), true); // 辺に沿って接触
  assert.equal(intersects(line(vec2(-5, 20), vec2(15, 20)), r), false);
  assert.equal(intersects(r, line(vec2(-5, 5), vec2(15, 5))), true); // 引数順対称
});

test("intersects(line, circle): 割線・接線・非交差", () => {
  const c = circle(vec2(0, 0), 5);
  assert.equal(intersects(line(vec2(-10, 0), vec2(10, 0)), c), true);
  assert.equal(intersects(line(vec2(-10, 5), vec2(10, 5)), c), true); // 距離ちょうど r
  assert.equal(intersects(line(vec2(-10, 6), vec2(10, 6)), c), false);
  assert.equal(intersects(c, line(vec2(-10, 0), vec2(10, 0))), true);
});

test("intersects(polygon, polygon): 重なり・包含・非交差", () => {
  const other: Vec2[] = [vec2(5, 5), vec2(15, 5), vec2(15, 15), vec2(5, 15)];
  const inner: Vec2[] = [vec2(2, 2), vec2(4, 2), vec2(3, 4)];
  const far: Vec2[] = [vec2(20, 20), vec2(30, 20), vec2(25, 30)];

  assert.equal(intersects(square, other), true);
  assert.equal(intersects(square, inner), true); // 完全包含（辺は交差しない）
  assert.equal(intersects(inner, square), true);
  assert.equal(intersects(square, far), false);
});

test("intersects(polygon, rect / circle / line)", () => {
  assert.equal(intersects(square, rect(8, 8, 10, 10)), true);
  assert.equal(intersects(square, rect(20, 20, 5, 5)), false);
  assert.equal(intersects(rect(8, 8, 10, 10), square), true);

  assert.equal(intersects(square, circle(vec2(5, 5), 1)), true); // 中心が内部
  assert.equal(intersects(square, circle(vec2(15, 5), 5)), true); // 外から辺に接触
  assert.equal(intersects(square, circle(vec2(20, 20), 3)), false);
  assert.equal(intersects(circle(vec2(5, 5), 1), square), true);

  assert.equal(intersects(square, line(vec2(-5, 5), vec2(15, 5))), true);
  assert.equal(intersects(square, line(vec2(2, 2), vec2(3, 3))), true); // 内包
  assert.equal(intersects(square, line(vec2(20, 0), vec2(20, 10))), false);
  assert.equal(intersects(line(vec2(-5, 5), vec2(15, 5)), square), true);
});

test("intersects(polygon): 3点未満は throw", () => {
  assert.throws(() => intersects([vec2(0, 0), vec2(1, 0)], square), Error);
});
