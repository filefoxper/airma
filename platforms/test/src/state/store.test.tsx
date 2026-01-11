import { act, renderHook } from '@testing-library/react-hooks';
import { createStore, useModel } from '@airma/react-state';

const counter = function counter(count: number) {
  const symbol = (function computeSymbol() {
    if (count === 0) {
      return '~';
    }
    if (count < 0) {
      return '负数';
    }
    return '正数';
  })();
  return {
    count: Math.abs(count),
    symbol,
    increase: () => count + 1,
    decrease: () => count - 1,
  };
};

describe('store 静态库的用法', () => {
  test('静态库 store 不需要 provide 可直接订阅使用', () => {
    const counterStore = createStore(counter);
    const { result } = renderHook(() => {
      return useModel(counterStore, 0);
    });
    expect(result.current.count).toBe(0);
  });

  test('静态库 store 的行为可以更新静态库中的状态和实例', () => {
    const counterStore = createStore(counter);
    const { result } = renderHook(() => {
      return useModel(counterStore, 0);
    });
    act(() => {
      result.current.increase();
    });
    expect(result.current.count).toBe(1);
  });

  test('所有静态库 store 的订阅点，状态是同步的', () => {
    const counterStore = createStore(counter);
    const { result } = renderHook(() => {
      const instance1 = useModel(counterStore, 0);
      const instance2 = useModel(counterStore, 0);
      return { instance1, instance2 };
    });
    act(() => {
      result.current.instance1.increase();
    });
    expect(result.current.instance2.count).toBe(1);
  });
});
