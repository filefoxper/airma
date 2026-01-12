import { createKey, model, provide, useSignal } from '@airma/react-state';
import { act, renderHook } from '@testing-library/react-hooks';
import React, { memo, useRef } from 'react';
import { render, act as reactAct } from '@testing-library/react';

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

describe('useSignal 的用法', () => {
  test('通过 useSignal 产生的 signal 回调，可获取最新的实例', () => {
    const { result } = renderHook(() => useSignal(counter, 0));
    const signal = result.current;
    act(() => {
      signal().increase();
    });
    expect(signal().count).toBe(1);
  });

  test('useSignal 可使用 model 化模型', () => {
    const { result } = renderHook(() => useSignal(model(counter), 0));
    const signal = result.current;
    act(() => {
      signal().increase();
    });
    expect(signal().count).toBe(1);
  });

  test('当且仅当 useSignal 的 signal 回调产生的实例在 render 过程中被获取的字段发生变化，才会触发当前组件或hook重新渲染', () => {
    const { result } = renderHook(() => {
      const renderTimeRef = useRef(0);
      renderTimeRef.current += 1;
      const signal = useSignal(counter, 1);
      const { symbol, increase } = signal();
      return { symbol, renderTime: renderTimeRef.current, increase };
    });
    act(() => {
      result.current.increase();
    });
    act(() => {
      result.current.increase();
    });
    expect(result.current.renderTime).toBe(1);
  });

  test('signal.useWatch 可监听行为方法的调用，且不受组件是否重新渲染的影响', () => {
    const { result } = renderHook(() => {
      const renderTimesRef = useRef(0);
      renderTimesRef.current += 1;
      const actionCalledTimesRef = useRef(0);
      const signal = useSignal(counter, 0);
      signal
        .useWatch(() => {
          actionCalledTimesRef.current += 1;
        })
        .onActions((i) => [i.increase]);
      const { increase } = signal();
      return { renderTimes: renderTimesRef.current, actionCalledTimesRef, increase };
    });
    act(() => {
      result.current.increase();
    });
    act(() => {
      result.current.increase();
    });
    const { renderTimes, actionCalledTimesRef } = result.current;
    expect({ renderTimes, actionCalledTimes: actionCalledTimesRef.current }).toEqual({
      renderTimes: 1,
      actionCalledTimes: 2,
    });
  });

  test('signal.useEffect 也可监听行为方法的调用，但它会影响组件的渲染次数，可能增加不必要的渲染', () => {
    const { result } = renderHook(() => {
      const renderTimesRef = useRef(0);
      renderTimesRef.current += 1;
      const actionCalledTimesRef = useRef(0);
      const signal = useSignal(counter, 0);
      signal
        .useEffect(() => {
          actionCalledTimesRef.current += 1;
        })
        .onActions((i) => [i.increase]);
      const { increase } = signal();
      return { renderTimes: renderTimesRef.current, actionCalledTimesRef, increase };
    });
    act(() => {
      result.current.increase();
    });
    act(() => {
      result.current.increase();
    });
    const { renderTimes, actionCalledTimesRef } = result.current;
    expect({ renderTimes, actionCalledTimes: actionCalledTimesRef.current }).toEqual({
      renderTimes: 3,
      actionCalledTimes: 3,
    });
  });
});

describe('useSignal 在状态同步中的应用', () => {
  const counterKey = createKey(counter);

  const Increase = memo(() => {
    const signal = useSignal(counterKey);
    return (
      <button type="button" onClick={signal().increase}>
        +
      </button>
    );
  });

  const Symbol = memo(() => {
    const renderTimesRef = useRef(0);
    renderTimesRef.current += 1;
    const signal = useSignal(counterKey);
    return (
      <>
        <span data-testid="symbol-render-times">{renderTimesRef.current}</span>
        <span data-testid="symbol">({signal().symbol})</span>
      </>
    );
  });

  const Counter = memo(() => {
    const signal = useSignal(counterKey);
    return <span data-testid="count">{signal().count}</span>;
  });

  const Decrease = memo(() => {
    const signal = useSignal(counterKey);
    return (
      <button type="button" onClick={signal().decrease}>
        -
      </button>
    );
  });

  const App = provide(counterKey).to(
    memo(() => {
      const renderTimesRef = useRef(0);
      renderTimesRef.current += 1;
      useSignal(counterKey, 0);
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

  test('使用 useSignal 进行初始化操作可以避免不必要的渲染', async () => {
    const { findByText, findByTestId } = render(<App />);
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    const renderTimesSpan = await findByTestId('app-render-times');
    expect(renderTimesSpan.textContent).toBe('1');
  });

  test('使用 useSignal 可以同步发生变化的字段', async () => {
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

  test('使用 useSignal 只同步组件中发生变化且在渲染中被使用的字段', async () => {
    const { findByText, findByTestId } = render(<App />);
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    await reactAct(async () => {
      const increase = await findByText('+');
      increase.click();
    });
    const countSpan = await findByTestId('symbol-render-times');
    expect(countSpan.textContent).toBe('2');
  });
});
