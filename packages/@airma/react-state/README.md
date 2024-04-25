[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square


# @airma/react-state

Simple `reducer-like` state-management with method action dispatch mode for react components.

## Documents

* [En](https://filefoxper.github.io/airma/#/react-state/index)
* [中文](https://filefoxper.github.io/airma/#/zh/react-state/index)

## Code first

Create `reducer-like` function:

```js
export function counting(state:number){
    return {
        // reproduced state for render
        count: `mount: ${state}`,
        // action method
        increase:()=>count + 1,
        // action method
        decrease:()=>count - 1,
        // action method, define parameters freely.
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}
```

Use `reducer-like` function:

```tsx
import {counting} from './model';
import {useModel} from '@airma/react-state';

......
// give it an initialState can make it fly.
const {count, increase, decrease, add} = useModel(counting, 0); // initialState `0`
// call method `increase\decrease\add` can change `count` and make component rerender
......
```

The `reducer-like` function has a simple name `model`. Use API `model` can make it more simple.

### Local state management

```tsx
import {model} from '@airma/react-state';

// api model returns a wrap function for your model function.
// it keeps a same type of parameters and return data with the wrapped function.
const counting = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
});
......
// you can get useModel from the model wrapped function.
const {count, increase, decrease, add} = counting.useModel(0);
......
```

Though, the basic function about `model` is enhancing `React.useReducer` to manage a local state, it also supports store usage with or without `React.Context` to manage a global state. 

### React.Context state management

```tsx
import {memo} from 'react';
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}).createStore(0);
......
const Increase = memo(()=>{
    // use store.useSelector can share state changes from store,
    // when the selected result is changed it rerender component. 
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use store.useModel can share state changes from store.
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// provide store to component for a React.Context usage.
const Component = countingStore.provideTo(function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
......
```

Using `model(xxx).createStore().asGlobal()` can build a global store.

### Global state management

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}).createStore(0).asGlobal();
// `createStore(0).static()` is same with `createStore(0).asGlobal()`.
......
const Increase = memo(()=>{
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// use global store without provider.
const Component = function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

The `useSelector` API is helpful for reducing render frequency, only when the selected result is changed, it make its owner component rerender. 

### A high performance usage about useSignal

In `@airma/react-state@18.4.0`, a more simple and higher performance API `useSignal` is provided.

```ts
import {model} from '@airma/react-state';

const counting = model(function countingModel(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}).createStore().static();
// Give initialized state later in component render time.
......
const Increase = memo(()=>{
    // API `useSignal` returns a signal function,
    // which can be called to get the newest instance from store.
    // Only the render usage fields of this instance change makes component rerender.
    // Here, only the action method `increase` from instance is required, and as the action method is stable with no change, that makes component never rerender.
    const signal = counting.useSignal();
    return <button onClick={signal().increase}>+</button>;
});

const Count = memo(()=>{
    const signal = counting.useSignal();
    return <span>{signal().count}</span>;
});

const Decrease = memo(()=>{
    const signal = counting.useSignal();
    return <button onClick={signal().decrease}>-</button>;
});

const Component = function Comp({defaultCount}:{defaultCount:number}) {
    // API `useSignal` can initialize store state in render too.
    // The difference with `useModel` is that `useSignal` only rerenders component when the render usage fields of instance changes.
    counting.useSignal(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

The `useSignal` API is even better than API `useSelector`, it computes out when to rerender component by the fields getting from instance automatically. And by using the `signal` function, it always provides a newest instance in usage point, so it can avoid stale data and zombie-children problems more effectively.


## Why support context store?

In `@airma/react-state`, store is dynamic, every `provider` copies a working instance for a context usage.

 That means: 
 
 1. The store data can be destroyed with its `provider` component unmount.
 2. Components with same store provider can be used together in one parent component without state change effect to each other.
 
 ### How to subscribe a grand parent provider store?

 The store provider system in `@airma/react-state` is designed with a tree structure. The nearest `provider` finds store one-by-one from itself to its root parent `provider`, and links the nearest matched `provider` store to the subscriber `useModel/useSelector`.

 ### Does the state change of store leads a whole provider component rerender?

 No, only the hooks subscribing this `store` may rerender their owners. Every store change is notified to its subscriber like `useModel` and `useSelector`, and then the subscriber rerenders its owner by `useState`. 

 ## Why not async action methods

 Async action often makes the problem about stale data and [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children). So, a special tool to resolve this problem is necessary, you can try [@airma/react-effect](https://filefoxper.github.io/airma/#/react-effect/index) with it.

There are more examples, concepts and APIs in the [documents](https://filefoxper.github.io/airma/#/react-state/index) of `@airma/react-state`.

## Browser Support 

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

