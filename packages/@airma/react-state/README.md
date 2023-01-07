[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square


# @airma/react-state

`@airma/react-state` is a simple state management tool for react app. You can visit the [document](https://filefoxper.github.io/airma/#/react-state/index) for details.

It works like that:

```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

function App(){
    const {count, increase, decrease} = useModel((state:number)=>{
        const baseState = state >= 0? state : 0;
        return {
            count: baseState,
            increase(){
                return baseState + 1;
            },
            decrease(){
                return baseState - 1;
            }
        };
    },0);
    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{count}</span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

API `useModel` can generate an `instance` object by calling a `model` function with its default parameter. Call `instance` method can generate a new parameter, and then make `instance` to refresh itself by recalling the newest `model` and parameter again. 

It looks like `useReducer`, but more free for usage, you can forget `dispatch` now.

To make a state change sharable, you need to create a `factory`, and use it on a `ModelProvider`, then use `useModel` or `useSelector` to link it.

```tsx
import React,{memo} from 'react';
import {render} from 'react-dom'
import {
  ModelProvider,
  useModel,
  useSelector,
  factory
} from '@airma/react-state';

const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

// Use API `factory` to build a model factory.
// It can be used as a `function` key for state link.
// A factory is not a store, it only carries a default state.
const couterFactory =  factory(counter);

const Increase = memo(()=>{
  // use API `useSelector` to fetch the `increase` method.
  // The method from instance is persistent,
  // so, the none props memo component will not rerender.
  const increase = useSelector(couterFactory, c=>c.increase);
  return (
    <button onClick={increase}>+</button>
  );
});

const Decrease = memo(()=>{
  // same as the usage in `Increase`
  const decrease = useSelector(couterFactory, c=>c.decrease);
  return (
    <button onClick={decrease}>-</button>
  );
});

const CountValue = memo(()=>{
  // use API `useModel` with a factory can link the store state.
  const {count,isNegative} = useModel(couterFactory);
  return (
    <span style={isNegative?{color:'red'}:undefined}>{count}</span>
  );
});

function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
        {/* ModelProvider can hold factories, */}
        {/* and create a instance store in it, */}
        {/* then we can use factory as key to fetch instance */}
        <ModelProvider value={couterFactory}>
          <div>
            <Decrease/>
            <CountValue/>
            <Increase/>
          </div>
        </ModelProvider>
      </div>
    );
}

render(<Counter index={1}/>, document.getElementById('root'));
```

As you can see, when click the button in Decrease/Increase component, the CountValue changes.

You can reuse your model in a controlled customized hook or component by `useControlledModel`.

```ts
import React,{memo} from 'react';
import {
  useModel,
  useControlledModel
} from '@airma/react-state';

const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

const useControlledCounter = (
  value:number, 
  onChange:(v:number)=>void
)=>{
  return useControlledModel(counter, value, onChange);
};

const App = memo(()=>{
  const [state, setState] = useState(0);
  // use outside `state <-> setState`
  const {
    count, 
    isNegative,
    increase,
    decrease,
  } = useControlledCounter(state, setState);
  ......
});

```

Make a tuple instance model:

```ts
import {useModel} from '@airma/react-state';

const toggleModel = (visible:boolean):[boolean, ()=>boolean]=>[
  visible,
  ()=>!visible
];

......

const [visible, toggle] = useModel(toggleModel, false);
```

If you want to know more about `@airma/react-state`, take the [document detail](https://filefoxper.github.io/airma/#/react-state/index) now.

## Browser Support 

We support the browsers:

```
chrome: '>=58',
edge: '>=16',
firefox: '=>57',
safari: '>=11'
```

If you want to support less version browsers, you'd better have your own polyfills.

## End

We hope you can enjoy this tool, and help us to enhance it in future.

