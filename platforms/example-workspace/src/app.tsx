import React, { memo, useEffect, useState } from 'react';
import {
  factory,
  useModel,
  useControlledModel,
  useSelector,
  shallowEqual,
  ModelProvider
} from '@airma/react-state';
import { client } from '@airma/restful';

const counter = (count: number) => {
  console.log(count);
  return {
    count,
    isNegative: count < 0,
    increase: () => count + 1,
    decrease: () => count - 1
  };
};

const modelFactory = {
  counter: factory(counter, 5)
};

const Increase = memo(() => {
  const increase = useSelector(modelFactory.counter, s => s.increase);
  return (
    <button type="button" onClick={increase}>
      +
    </button>
  );
});

const Decrease = memo(() => {
  const { decrease } = useModel(modelFactory.counter);
  return (
    <button type="button" onClick={decrease}>
      -
    </button>
  );
});

const CountValue = memo(() => {
  const { count, isNegative } = useModel(modelFactory.counter);
  return <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>;
});

const Refresh = memo(() => {
  const [v, setV] = useState(12);
  const { count } = useModel(modelFactory.counter);
  return (
    <div>
      {count}
      <button type="button" onClick={() => setV(d => d + 1)}>
        refresh
      </button>
    </div>
  );
});

const dm = (d: number) => ({
  count: d,
  ddecrease() {
    return d - 2;
  },
  iincrease() {
    return d + 2;
  }
});
const PipeCount = memo(() => {
  const { count, ddecrease, iincrease } = useModel(
    modelFactory.counter.pipe(dm)
  );
  return (
    <div>
      pipe counting:
      <div>
        <button type="button" onClick={ddecrease}>
          -
        </button>
        <span>{count}</span>
        <button type="button" onClick={iincrease}>
          +
        </button>
      </div>
    </div>
  );
});

const SelectCount = memo(() => {
  const isNegative = useSelector(modelFactory.counter, c => c.isNegative);
  return (
    <div>
      select counting:
      <div>
        <span>{isNegative ? '-' : '+'}</span>
      </div>
    </div>
  );
});

function Counting() {
  const { count, isNegative, increase, decrease } = useModel(counter, 0);
  return (
    <div>
      counting:
      <div>
        <button type="button" onClick={decrease}>
          -
        </button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button type="button" onClick={increase}>
          +
        </button>
      </div>
    </div>
  );
}

function ControlledCounting() {
  const [c, setC] = useState<number>(1);
  const { count, isNegative, increase, decrease } = useControlledModel(
    counter,
    c,
    setC
  );
  return (
    <div>
      controlled counting:
      <div>
        <button type="button" onClick={decrease}>
          -
        </button>
        <span style={isNegative ? { color: 'red' } : undefined}>{count}</span>
        <button type="button" onClick={increase}>
          +
        </button>
      </div>
    </div>
  );
}

function Counter({ index }: { index: number }) {
  return (
    <div>
      counter:{index}
      <ModelProvider value={modelFactory}>
        <div>
          <Decrease />
          <CountValue />
          <Increase />
        </div>
        <PipeCount />
        <SelectCount />
        <Refresh />
      </ModelProvider>
      <Counting />
      <ControlledCounting />
    </div>
  );
}

const { rest } = client(c => ({
  ...c,
  headers: { ...c.headers, yige: 'yige' }
}));

type User = {
  id: string;
  name: string;
  username: string;
  age: number;
};

export default function App() {
  useEffect(() => {
    (async function fetch() {
      const promise = rest('/api/user')
        .path('list')
        .setParams({ ids: [1, 2, 3] })
        .get<User>();
      const data = await promise;
      console.log(data);
    })();
  }, []);

  const handleClick = async () => {
    const data = await rest('/api/user')
      .setBody({ name: 'test', username: 'test', age: 11 })
      .setParams({ item: { id: 1, data: { name: 'name' } } })
      .post();
    console.log('post', data);
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        save
      </button>
      <Counter index={1} />
    </div>
  );
}
