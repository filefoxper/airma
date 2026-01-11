import { act, renderHook } from '@testing-library/react-hooks';
import { createKey, provide, useControlledModel, useModel } from '@airma/react-state';
import React, { memo, useRef, useState } from 'react';
import { act as reactAct, render } from '@testing-library/react';

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

describe('useModel 的用法', () => {
  test('通过 useModel 可直接获取当前模型实例', () => {
    const { result } = renderHook(() => useModel(counter, 0));
    act(() => {
      result.current.increase();
    });
    expect(result.current.count).toBe(1);
  });

  test('通过 useModel 获取的实例，在行为发生时，必然更新当前组件或hook', () => {
    const { result } = renderHook(() => {
      const renderTimeRef = useRef(0);
      renderTimeRef.current += 1;
      const instance = useModel(counter, 1);
      const { symbol, increase } = instance;
      return { symbol, renderTime: renderTimeRef.current, increase };
    });
    act(() => {
      result.current.increase();
    });
    act(() => {
      result.current.increase();
    });
    expect(result.current.renderTime).toBe(3);
  });
});

describe('useModel 在状态同步中的应用', () => {
  const counterKey = createKey(counter);

  const Increase = memo(() => {
    const instance = useModel(counterKey);
    return (
      <button type="button" onClick={instance.increase}>
        +
      </button>
    );
  });

  const Symbol = memo(() => {
    const renderTimesRef = useRef(0);
    renderTimesRef.current += 1;
    const instance = useModel(counterKey);
    return (
      <>
        <span data-testid="symbol-render-times">{renderTimesRef.current}</span>
        <span data-testid="symbol">({instance.symbol})</span>
      </>
    );
  });

  const Counter = memo(() => {
    const instance = useModel(counterKey);
    return <span data-testid="count">{instance.count}</span>;
  });

  const Decrease = memo(() => {
    const instance = useModel(counterKey);
    return (
      <button type="button" onClick={instance.decrease}>
        -
      </button>
    );
  });

  const App = provide(counterKey).to(
    memo(() => {
      const renderTimesRef = useRef(0);
      renderTimesRef.current += 1;
      useModel(counterKey, 0);
      return (
        <div>
          <Increase />
          <Symbol />
          <Counter />
          <Decrease />
          <span data-testid="app-render-times">{renderTimesRef.current}</span>
        </div>
      );
    }),
  );

  test('使用 useModel 可以进行渲染过程中的初始化操作，并按库状态的更新渲染使用组件', async () => {
    const { findByText, findByTestId } = render(<App />);
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    const renderTimesSpan = await findByTestId('app-render-times');
    expect(renderTimesSpan.textContent).toBe('2');
  });

  test('使用 useModel 可以同步发生变化的字段', async () => {
    const { findByText, findByTestId } = render(<App />);
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    const countSpan = await findByTestId('count');
    expect(countSpan.textContent).toBe('2');
  });
});

describe('useControlledModel 可用于非受控状态管理', () => {
  test('useControlledModel 可用于非受控状态管理，实例行为可直接更新控制方状态', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const instance = useControlledModel(counter, value, setValue);
      return { instance, value };
    });
    act(() => {
      result.current.instance.increase();
    });
    expect(result.current.value).toBe(1);
  });

  test('useControlledModel 可用于非受控状态管理，控制方可拒绝更新特殊状态', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const instance = useControlledModel(counter, value, (v) => (v < 0 ? undefined : setValue(v)));
      return { instance, value };
    });
    act(() => {
      result.current.instance.decrease();
    });
    expect(result.current.value).toBe(0);
  });

  test('useControlledModel 可用于非受控状态管理，控制方可拒绝更新特殊状态，实例状态必然与控制方状态保持一致', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const instance = useControlledModel(counter, value, (v) => (v < 0 ? undefined : setValue(v)));
      return { instance, value };
    });
    act(() => {
      result.current.instance.decrease();
    });
    expect(result.current.instance.count).toBe(0);
  });

  test('useControlledModel 可用于非受控状态管理，控制方的状态决定了实例状态', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const instance = useControlledModel(counter, value, setValue);
      return { instance, value, setValue };
    });
    act(() => {
      result.current.setValue(2);
    });
    expect(result.current.instance.count).toBe(2);
  });
});
