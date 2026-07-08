import { test } from "node:test";
import assert from "node:assert/strict";
import {
  linear,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
  type EasingFn,
} from "../src/easing.js";

const EPSILON = 1e-9;

const allEasings: Record<string, EasingFn> = {
  linear,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
};

const monotonicEasings: Record<string, EasingFn> = {
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
};

for (const [name, fn] of Object.entries(allEasings)) {
  test(`${name}: 端点が 0 と 1 になる`, () => {
    assert.ok(
      Math.abs(fn(0) - 0) < EPSILON,
      `${name}(0) は 0 に近い必要がある (実際: ${fn(0)})`,
    );
    assert.ok(
      Math.abs(fn(1) - 1) < EPSILON,
      `${name}(1) は 1 に近い必要がある (実際: ${fn(1)})`,
    );
  });
}

test("代表値の検証", () => {
  assert.equal(easeInQuad(0.5), 0.25);
  assert.equal(easeOutQuad(0.5), 0.75);
  assert.equal(easeInOutQuad(0.25), 0.125);
  assert.equal(easeOutBounce(1), 1);
  assert.equal(easeInOutExpo(0.5), 0.5);
});

for (const [name, fn] of Object.entries(monotonicEasings)) {
  test(`${name}: 0..1 の範囲で非減少である`, () => {
    let prev = fn(0);
    for (let i = 1; i <= 10; i++) {
      const t = i * 0.1;
      const current = fn(t);
      assert.ok(
        current >= prev - EPSILON,
        `${name} は t=${t} で減少してはならない (prev: ${prev}, current: ${current})`,
      );
      prev = current;
    }
  });
}
