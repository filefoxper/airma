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
    const {state, increase, decrease} = useModel((state:number)=>{
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
    },0);
    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{state}</span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

We defines a model function like `(state:Type)=>({state:Type,method:(...args:unknow[])=>Type})`, this function accepts a state param, and returns an object, which contains as state property, and methods for generating new state. `useModel` can transform it to be a maintainable object.

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

It is simple now, but we will add some more useful features in future. If you want to know more about this tool, please take this [document](https://github.com/filefoxper/airma/tree/master/packages/%40airma/react-state).
