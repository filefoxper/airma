import React, {memo, useEffect} from 'react';
import { render } from 'react-dom';
import {
  requireModels,
  RequiredModelProvider,
  useRequiredModel,
  factory, useFactory, useModel
} from '@airma/react-state';

const counter = (count: number = 0) => {
  console.log(count);
  return {
    count,
    isNegative: count < 0,
    increase: () => count + 1,
    decrease: () => count - 1
  };
};

const modelFactory = {
  counter: factory(counter,0),
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

function Counting(){
  const {count,isNegative,increase,decrease} = useModel(modelFactory.counter);
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

function Counter({ index }: { index: number }) {
  const [fac,setFac] = useFactory(modelFactory,s => ({
    ...s,
    counter: factory(counter, 10)
  }));

  useEffect(()=>{
    setFac(s=>({counter:factory(counter,5)}));
  },[]);

  return (
    <div>
      counter:{index}
      <RequiredModelProvider value={fac}>
        <div>
          <Decrease />
          <CountValue />
          <Increase />
        </div>
      </RequiredModelProvider>
      <Counting/>
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
