import React, { memo, useEffect, useState } from 'react';
import {
    RequiredModelProvider,
    useRequiredModel,
    factory,
    useModel,
    useControlledModel,
    useSelector,
    shallowEqual,
    useRequiredModelState, useLocalSelector
} from '@airma/react-state';

const counter = (count: number = 0) => {
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
  useRequiredModelState(modelFactory.counter, 10);
  const { count, isNegative } = useRequiredModel(modelFactory.counter);
  return <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>;
});

const Refresh = memo(()=>{
    const [v,setV] = useState(12);
    const { count } = useRequiredModel(modelFactory.counter,v,{refresh:true});
    return <div>{count}<button onClick={()=>setV(d=>d+1)}>refresh</button></div>
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

const SelectCount = memo(() => {
  const isNegative = useSelector(modelFactory.counter, counter => {
    return counter.isNegative;
  });
  console.log('render...');
  return (
    <div>
      select counting:
      <div>
        <span>{isNegative ? '-' : '+'}</span>
      </div>
    </div>
  );
});

const LocalSelectCount = memo(() => {
  const { count, decrease, increase, test } = useLocalSelector(
    counter,
    (instance) => ({
      ...instance,
      async test() {
        await new Promise(r => setTimeout(r, 1000));
        instance.increase();
      }
    })
  );
  return (
    <div>
      local select counting:
      <div>
        <button onClick={decrease}>-</button>
        <span>{count}</span>
        <button onClick={increase}>+</button>
        <button onClick={test}>test</button>
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
  return (
    <div>
      counter:{index}
      <RequiredModelProvider value={modelFactory}>
        <div>
          <Decrease />
          <CountValue />
          <Increase />
        </div>
        <PipeCount />
        <SelectCount />
          <Refresh/>
      </RequiredModelProvider>
      <Counting />
      <ControlledCounting />
      <LocalSelectCount />
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
