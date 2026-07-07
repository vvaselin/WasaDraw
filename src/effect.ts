export type EffectFunction<TContext> = (
  t: number,
  context: TContext,
) => boolean;

export type EffectManager<TContext> = {
  add(effect: EffectFunction<TContext>): void;
  update(deltaTime: number, context: TContext): void;
  clear(): void;
  readonly count: number;
};

type ActiveEffect<TContext> = {
  age: number;
  fn: EffectFunction<TContext>;
};

export function createEffectManager<TContext>(): EffectManager<TContext> {
  const effects: Array<ActiveEffect<TContext>> = [];

  return {
    add(effect) {
      effects.push({
        age: 0,
        fn: effect,
      });
    },

    update(deltaTime, context) {
      for (let i = effects.length - 1; i >= 0; i -= 1) {
        const effect = effects[i];

        if (effect === undefined) {
          continue;
        }

        effect.age += deltaTime;

        const keep = effect.fn(effect.age, context);

        if (!keep) {
          effects.splice(i, 1);
        }
      }
    },

    clear() {
      effects.length = 0;
    },

    get count() {
      return effects.length;
    },
  };
}
