import React, { memo, useState } from 'react';
import {
    requireModels,
    useRequiredModel,
    RequiredModelProvider, useRefreshModel, useRefresh
} from '@airma/react-state';

const re = (state: number = 0) => {
  const count = state >= 0 ? state : 0;
  return {
    count,
    isNegative: count < 0,
    increase() {
      return count + 1;
    },
    decrease() {
      return count - 1;
    },
    update(next: number,desc:string) {
      return next;
    }
  };
};

const factory = requireModels(hold => hold(re));

const factory2 = requireModels(hold => hold(re));

const ReactStateEx = memo(() => {
  const [value, setValue] = useState(0);
  const { count, isNegative, increase, decrease } = useRequiredModel(
    factory,
    value
  );

  return (
    <div>
      <div>react state ex 1</div>
      <div>{value}</div>
      <div>
        <button onClick={() => setValue(v => v + 1)}>rest</button>
      </div>
      <div>
        <button onClick={decrease}>-</button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
});

const Link1 = memo(() => {
  const [value, setValue] = useState(0);
  const { count, isNegative, increase, decrease,update } = useRequiredModel(
    factory2,
    value
  );

  useRefresh(update,[value,'1']);

  return (
    <div>
      <div>react state ex 2</div>
      <div>{value}</div>
      <div>
        <button onClick={() => setValue(v => v + 1)}>rest</button>
      </div>
      <div>
        <button onClick={decrease}>-</button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
});

const Link2 = memo(() => {
    const [value, setValue] = useState(0);
    const { count, isNegative, increase, decrease,update } = useRequiredModel(
        factory2,
        value
    );

    useRefresh(update,[value,'1']);

    return (
        <div>
            <div>react state ex 2</div>
            <div>{value}</div>
            <div>
                <button onClick={() => setValue(v => v + 1)}>rest</button>
            </div>
            <div>
                <button onClick={decrease}>-</button>
                <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
                <button onClick={increase}>+</button>
            </div>
        </div>
    );
});

export default function App() {
  return (
    <RequiredModelProvider value={factory}>
        App
        <RequiredModelProvider value={factory2}>
            <Link1 />
            <Link2 />
        </RequiredModelProvider>

        <ReactStateEx />
    </RequiredModelProvider>
  );
}
