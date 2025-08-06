import { createKey, createStore, provide, useModel, useSignal } from '@airma/react-state';
import React, { memo } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { act as reactAct, render } from '@testing-library/react';
import type { ReactNode } from 'react';

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

const toggler = function toggler(value: boolean) {
  return [value, () => !value] as const;
};

describe('provide 的用法', () => {
  test('provide 可接受多个模型键作为参数建立动态库', () => {
    const counterKey = createKey(counter);
    const togglerKey = createKey(toggler);
    const wrapper = provide(counterKey, togglerKey).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const { count } = useModel(counterKey, 0);
        const [mark] = useModel(togglerKey, false);
        return { count, mark };
      },
      { wrapper },
    );
    expect(result.current).toEqual({
      count: 0,
      mark: false,
    });
  });

  test('provide 可接受的模型键可以做预先初始化处理', () => {
    const counterKey = createKey(counter, 0);
    const togglerKey = createKey(toggler, false);
    const wrapper = provide(counterKey, togglerKey).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const { count } = useModel(counterKey);
        const [mark] = useModel(togglerKey);
        return { count, mark };
      },
      { wrapper },
    );
    expect(result.current).toEqual({
      count: 0,
      mark: false,
    });
  });

  test('provide 也可以接受通过数组形式包装的模型键集合', () => {
    const counterKey = createKey(counter, 0);
    const togglerKey = createKey(toggler, false);
    const wrapper = provide([counterKey, togglerKey]).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const { count } = useModel(counterKey);
        const [mark] = useModel(togglerKey);
        return { count, mark };
      },
      { wrapper },
    );
    expect(result.current).toEqual({
      count: 0,
      mark: false,
    });
  });

  test('provide 也可以接受通过对象形式包装的模型键集合', () => {
    const counterKey = createKey(counter, 0);
    const togglerKey = createKey(toggler, false);
    const keys = { counter: counterKey, toggler: togglerKey };
    const wrapper = provide(keys).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const { count } = useModel(keys.counter);
        const [mark] = useModel(keys.toggler);
        return { count, mark };
      },
      { wrapper },
    );
    expect(result.current).toEqual({
      count: 0,
      mark: false,
    });
  });
});

describe('provide 中动态库的查找方式', () => {
  test('在多层 provide 动态库 Context 范围内，以树形结构自使用点向高层根部节点查找，找到为止', () => {
    const counterKey = createKey(counter, 0);
    const togglerKey = createKey(toggler, false);
    const ToggleWrapper = provide(togglerKey).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const wrapper = provide(counterKey).to(ToggleWrapper);
    const { result } = renderHook(
      () => {
        return useModel(counterKey);
      },
      { wrapper },
    );
    expect(result.current.count).toBe(0);
  });

  test('模型相同的不同键互不影响', () => {
    const counterKey = createKey(counter, 0);
    const counterKey1 = createKey(counter, 0);
    const wrapper = provide(counterKey, counterKey1).to(({ children }: { children?: ReactNode }) => <>{children}</>);
    const { result } = renderHook(
      () => {
        const instance = useModel(counterKey);
        const compare = useModel(counterKey1);
        return { instance, compare };
      },
      { wrapper },
    );
    act(() => {
      result.current.instance.increase();
    });
    expect(result.current.compare.count).not.toBe(result.current.instance.count);
  });

  test('相同模型键在不同动态库持有组件内互不干扰', async () => {
    const counterKey = createKey(counter);

    const Increase = memo(({ id }: { id: number }) => {
      const signal = useSignal(counterKey);
      return (
        <button type="button" data-testid={`increase_${id}`} onClick={signal().increase}>
          +
        </button>
      );
    });

    const Counter = memo(({ id }: { id: number }) => {
      const signal = useSignal(counterKey);
      return <span data-testid={`count_${id}`}>{signal().count}</span>;
    });

    const Decrease = memo(({ id }: { id: number }) => {
      const signal = useSignal(counterKey);
      return (
        <button type="button" data-testid={`decrease_${id}`} onClick={signal().decrease}>
          -
        </button>
      );
    });

    const App = provide(counterKey).to(
      memo(({ id }: { id: number }) => {
        useSignal(counterKey, 0);
        return (
          <div>
            <Increase id={id} />
            <Counter id={id} />
            <Decrease id={id} />
          </div>
        );
      }),
    );

    const { findByTestId } = render(
      <>
        <App id={1} />
        <App id={2} />
      </>,
    );
    await reactAct(async () => {
      const increase = await findByTestId('increase_1');
      increase.click();
    });
    const count1Span = await findByTestId('count_1');
    const count2Span = await findByTestId('count_2');
    expect(count1Span.textContent).not.toBe(count2Span.textContent);
  });
});

describe('provide 中使用 store 代替模型键', () => {
  const countStore = createStore(counter, 0);
  const wrapper = provide(countStore).to(({ children }: { children?: ReactNode }) => <>{children}</>);

  test('provide 会使用参数中 store 的键来建立动态库', () => {
    const { result } = renderHook(
      () => {
        return useModel(countStore);
      },
      { wrapper },
    );
    act(() => {
      result.current.increase();
    });
    expect(result.current.count).toBe(1);
  });

  test('可以使用 store.key 的键来订阅动态库', () => {
    const { result } = renderHook(
      () => {
        return useModel(countStore.key);
      },
      { wrapper },
    );
    act(() => {
      result.current.increase();
    });
    expect(result.current.count).toBe(1);
  });

  test('store 在 provide 中建立的动态库变更不会影响 store', () => {
    const { result } = renderHook(
      () => {
        return useModel(countStore.key);
      },
      { wrapper },
    );
    act(() => {
      result.current.increase();
    });
    expect(result.current.count).not.toBe(countStore.getInstance().count);
  });
});
