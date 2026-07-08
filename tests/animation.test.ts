import { test } from "node:test";
import assert from "node:assert/strict";
import { createAnimation } from "../src/animation.js";
import { easeInQuad } from "../src/easing.js";

test("2キーフレーム線形補間: 中間値と端点", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100 },
    ],
  });

  assert.equal(anim.value("x", 0), 0);
  assert.equal(anim.value("x", 5), 50);
  assert.equal(anim.value("x", 10), 100);
});

test("範囲外の時刻は端点値にクランプされる", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100 },
    ],
  });

  assert.equal(anim.value("x", -5), 0);
  assert.equal(anim.value("x", 15), 100);
});

test("ease 指定区間: easeInQuad で t=0.5 のとき 0.25 相当", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100, ease: easeInQuad },
    ],
  });

  assert.equal(anim.value("x", 5), 25);
});

test("区間幅0（同一time）では後者の値を採用する", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 5, value: 10 },
      { time: 5, value: 20 },
      { time: 10, value: 100 },
    ],
  });

  assert.equal(anim.value("x", 5), 20);
});

test("loop: 周期2でtime=3がtime=1と一致する", () => {
  const anim = createAnimation(
    {
      x: [
        { time: 0, value: 0 },
        { time: 2, value: 100 },
      ],
    },
    { loop: 2 },
  );

  assert.equal(anim.value("x", 3), anim.value("x", 1));
});

test("loop: 負のtimeも正しく折り返す", () => {
  const anim = createAnimation(
    {
      x: [
        { time: 0, value: 0 },
        { time: 2, value: 100 },
      ],
    },
    { loop: 2 },
  );

  assert.equal(anim.value("x", -1), anim.value("x", 1));
});

test("at() は全トラックの値を返す", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100 },
    ],
    y: [
      { time: 0, value: 10 },
      { time: 10, value: 20 },
    ],
  });

  assert.deepEqual(anim.at(5), { x: 50, y: 15 });
});

test("duration は全トラック中で最大のキーフレーム時刻", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100 },
    ],
    y: [
      { time: 0, value: 0 },
      { time: 20, value: 50 },
    ],
  });

  assert.equal(anim.duration, 20);
});

test("空トラックはエラーになる", () => {
  assert.throws(
    () => createAnimation({ x: [] }),
    /createAnimation: track "x" must contain at least 1 keyframe\./,
  );
});

test("未ソートのキーフレームはエラーになる", () => {
  assert.throws(
    () =>
      createAnimation({
        x: [
          { time: 10, value: 0 },
          { time: 0, value: 100 },
        ],
      }),
    /createAnimation: track "x" keyframes must be sorted by time\./,
  );
});

test("loopが0以下の場合はRangeError", () => {
  assert.throws(
    () =>
      createAnimation(
        {
          x: [
            { time: 0, value: 0 },
            { time: 10, value: 100 },
          ],
        },
        { loop: 0 },
      ),
    RangeError,
  );
});

test("未知のトラック名を指定するとエラーになる", () => {
  const anim = createAnimation({
    x: [
      { time: 0, value: 0 },
      { time: 10, value: 100 },
    ],
  });

  assert.throws(
    () => anim.value("y" as never, 0),
    /createAnimation: unknown track "y"\./,
  );
});
