import React, { memo, useEffect, useState } from 'react';
import {
  RequiredModelProvider,
  useRequiredModel,
  factory,
  useFactory,
  useModel,
  useControlledModel
} from '@airma/react-state';

const counter = (count: number = 0) => {
  console.log('count:', count);
  return {
    count,
    isNegative: count < 0,
    increase: () => count + 1,
    decrease: () => count - 1
  };
};

const modelFactory = {
  counter: factory(counter, 0)
};

const Increase = memo(() => {
  const { increase } = useRequiredModel(modelFactory.counter);
  return <button onClick={increase}>+</button>;
});

const Decrease = memo(() => {
  const { decrease } = useRequiredModel(modelFactory.counter);
  return <button onClick={decrease}>-</button>;
});

const CountValue = memo(() => {
  const { count, isNegative } = useRequiredModel(modelFactory.counter);
  return <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>;
});
const dm = (d: number = 0) => ({
  count: d,
  ddecrease() {
    return d - 2;
  },
  iincrease() {
    return d + 2;
  }
});
const PipeCount = memo(() => {
  const { count, ddecrease, iincrease } = useRequiredModel(
    modelFactory.counter.pipe(dm)
  );
  return (
    <div>
      pipe counting:
      <div>
        <button onClick={ddecrease}>-</button>
        <span>{count}</span>
        <button onClick={iincrease}>+</button>
      </div>
    </div>
  );
});

function Counting() {
  const { count, isNegative, increase, decrease } = useModel(
    modelFactory.counter
  );
  return (
    <div>
      counting:
      <div>
        <button onClick={decrease}>-</button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
}

function ControlledCounting() {
  const [c, setC] = useState<number | undefined>(1);
  const { count, isNegative, increase, decrease } = useControlledModel(
    modelFactory.counter,
    c,
    setC
  );
  return (
    <div>
      controlled counting:
      <div>
        <button onClick={decrease}>-</button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
}

function Counter({ index }: { index: number }) {
  const [fac] = useFactory(modelFactory, s => ({
    ...s,
    counter: factory(counter, 10)
  }));

  return (
    <div>
      counter:{index}
      <RequiredModelProvider value={fac}>
        <div>
          <Decrease />
          <CountValue />
          <Increase />
        </div>
        <PipeCount />
      </RequiredModelProvider>
      <Counting />
      <ControlledCounting />
    </div>
  );
}

export default function App() {
  return (
    <div>
      <Counter index={1} />
    </div>
  );
}
