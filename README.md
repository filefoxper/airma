[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma

This target of @airma is provide a more simple model function to replace react API `useReducer`:

1. [@airma/core](https://github.com/filefoxper/airma/tree/master/packages/%40airma/core)
2. [@airma/react-state](https://github.com/filefoxper/airma/tree/master/packages/%40airma/react-state)


## install

```
npm install @airma/react-state
```

## @airma/react-state

You can use this lib for simplifying `useReducer` in react. `useReducer` is more structured than `useState`, it can be used as a model function, but it has some troubles like `dispatch actions`. So, we provide a more simple `useReducer` named `useModel` from `@airma/react-state`.

Think about use a model like that:

```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

function App(){
    const {count, increase, decrease} = useModel((state:number)=>{
        const count = state >= 0? state : 0;
        return {
            count,
            increase(){
                return count + 1;
            },
            decrease(){
                return count - 1;
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

We defines a model function like `(state:Type)=>({...properties,method:(...args:unknow[])=>Type})`, this function accepts a state param, and returns an object, which contains any properties for describing states, and methods for generating new state param. `useModel` can transform it to be a maintainable object.

You can compose or reuse your model function easy, and make something more useful for you.


```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

function count(state:number){
    const baseState = state >= 0? state : 0;
    return {
        state: baseState,
        increase(){
            return baseState + 1;
        },
        decrease(){
            return baseState - 1;
        }
    }; 
}

function App(){
    const {state, add, decrease} = useModel((state:number)=>{
        const model = count(state);
        return {
            ...model,
            add(addition:number){
                return model.state + addition;
            }
        };
    },0);
    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{state}</span>
            <button onClick={()=>add(1)}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

If you want to reuse your model function in a controlled component to process the out controlled state, like link to a `{value, onChange}` props, you can try `useControlledModel`.

```tsx
import React, {memo, useState} from 'react';
import {render} from 'react-dom'
import {useModel, useControlledModel} from '@airma/react-state';

function count(state:number){
    const baseState = state >= 0? state : 0;
    return {
        state: baseState,
        increase(){
            return baseState + 1;
        },
        decrease(){
            return baseState - 1;
        }
    }; 
}

const Counter = memo(()=>{
    const {state,increase,decrease} = useModel(count,0);

    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{state}</span>
            <button onClick={increase}>+</button>
        </div>
    );
});

// reuse to a controlled component.
const ControlledCounter = memo(({
    value, 
    onChange
}:{
    value:number, 
    onChange:(v:number)=>void
})=>{
    const {
        state,
        increase,
        decrease
    } = useControlledModel(count,value,onChange);

    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{state}</span>
            <button onClick={increase}>+</button>
        </div>
    );
});

function App(){
    const [value, setValue] = useState(0);
    return (
        <div>
            <Counter/>
            <div>{value}</div>
            <ControlledCounter value={value} onChange={setValue}/>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

It is simple now, but we will add some more useful features in future. If you want to know more about this tool, please take this [document](https://github.com/filefoxper/airma/tree/master/packages/%40airma/react-state).

## Support

1. It is a typescript project, so you can use it with typescript.
2. react-refresh, we have support react-refresh plugin, you can modify a model function and check the differences easily.
3. react-strictMode, you can use `<React.StrictMode><App/></React.StrictMode>` to check if your model function has some bad effects.
