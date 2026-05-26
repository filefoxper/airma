import { model, provide } from '@airma/react-state';
import { act, renderHook } from '@testing-library/react-hooks';
import React, { useState } from 'react';
import type { ReactNode } from 'react';

const counter = model(function counter(count: number) {
  return {
    count,
    increase: () => count + 1,
    decrease: () => count - 1,
  };
});

describe('model 的基础用法', () => {
  test('model 建立的模型可直接使用 useModel', () => {
    const { result } = renderHook(() => counter.useModel(0));
    act(() => {
      result.current.decrease();
    });
    expect(result.current.count).toBe(-1);
  });

  test('model 建立的模型可直接使用 useControlledModel', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const instance = counter.useControlledModel(value, setValue);
      return { instance, value };
    });
    act(() => {
      result.current.instance.increase();
    });
    expect(result.current.value).toBe(1);
  });

  test('model 建立的模型可直接使用 useSignal', () => {
    const { result } = renderHook(() => counter.useSignal(0));
    const signal = result.current;
    act(() => {
      signal().decrease();
    });
    expect(signal().count).toBe(-1);
  });

  test('model 建立的模型可直接建立带有API的静态库 store', () => {
    const store = counter.createStore();
    const { result } = renderHook(() => {
      const signal = store.useSignal(0);
      const instance = store.useModel();
      const count = store.useSelector((i) => i.count);
      return { signal, instance, count };
    });
    act(() => {
      result.current.signal().increase();
    });
    expect([
      result.current.signal().count,
      result.current.instance.count,
      result.current.count,
      store.instance().count,
    ]).toEqual([1, 1, 1, 1]);
  });

  test('model 建立的模型可直接建立带有API的模型键，并通过 provide 建立动态库', () => {
    const key = counter.createKey();
    const wrapper = provide(key).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const signal = key.useSignal(0);
        const instance = key.useModel();
        const count = key.useSelector((i) => i.count);
        return { signal, instance, count };
      },
      { wrapper },
    );
    act(() => {
      result.current.signal().increase();
    });
    expect([result.current.signal().count, result.current.instance.count, result.current.count]).toEqual([1, 1, 1]);
  });

  test('model 建立的模型可直接建立带有API的静态库 store 也可以提供给 provide，当模型键用', () => {
    const store = counter.createStore(0);
    const wrapper = provide(store).to(({ children }: { children?: ReactNode }) => <>{children}</>);

    const { result } = renderHook(
      () => {
        const signal = store.useSignal();
        const instance = store.useModel();
        const count = store.useSelector((i) => i.count);
        return { signal, instance, count };
      },
      { wrapper },
    );
    act(() => {
      result.current.signal().increase();
    });
    expect([
      result.current.signal().count,
      result.current.instance.count,
      result.current.count,
      store.instance().count,
    ]).toEqual([1, 1, 1, 0]);
  });
});
