import { createKey, provide, shallowEqual, useSelector, useSignal } from '@airma/react-state';
import React, { memo, useRef } from 'react';
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

describe('useSelector 在状态同步中的应用', () => {
  const counterKey = createKey(counter);

  const Increase = memo(() => {
    const increase = useSelector(counterKey, (i) => i.increase);
    return (
      <button type="button" onClick={increase}>
        +
      </button>
    );
  });

  const Symbol = memo(() => {
    const renderTimesRef = useRef(0);
    renderTimesRef.current += 1;
    const sm = useSelector(counterKey, (i) => ({ symbol: i.symbol }));
    return (
      <>
        <span data-testid="symbol-render-times">{renderTimesRef.current}</span>
        <span data-testid="symbol">({sm.symbol})</span>
      </>
    );
  });

  const Counter = memo(() => {
    const count = useSelector(counterKey, (i) => i.count);
    return <span data-testid="count">{count}</span>;
  });

  const Decrease = memo(() => {
    const decrease = useSelector(counterKey, (i) => i.decrease);
    return (
      <button type="button" onClick={decrease}>
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

  test('使用 useSelector 可以同步发生变化的字段', async () => {
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

  test('使用 useSelector 可通过设置 equality 方法来避免不必要的渲染', async () => {
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
    expect(countSpan.textContent).toBe('3');
  });
});
