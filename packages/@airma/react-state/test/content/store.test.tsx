import { act, renderHook } from '@testing-library/react-hooks';
import { createStore, useModel } from '@airma/react-state';
import { createSessionStore, provide, useQuery, useResponse, useSession } from '@airma/react-effect';
import React, { memo, useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';

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

  test('静态库 store 可初始化多次，初始化状态以最后一次为准', () => {
    const counterStore = createStore(counter);
    const { result } = renderHook(() => {
      const instance1 = useModel(counterStore, 0);
      const instance2 = useModel(counterStore, 1);
      return { instance1, instance2 };
    });
    expect(result.current.instance2.count).toBe(1);
  });

  test('当 store 订阅发生时，初始化效应结束，不能继续进行初始化', async () => {
    const counterStore = createStore(counter);

    const Child = () => {
      const { count } = useModel(counterStore, 0);
      return <span data-testid="count">{count}</span>;
    };
    const App = provide().to(
      memo(() => {
        const { count,increase } = useModel(counterStore, 0);
        useModel(counterStore, 1);
        useEffect(()=>{increase()},[]);
        return <div>{count>1 ? <Child /> : null}</div>;
      })
    );

    const {findByTestId} = render(<App />);
    await waitFor(async () => {
      const span = await findByTestId('count');
      expect(span.innerHTML).toBe('2');
    });
  });
});
