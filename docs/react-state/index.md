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
        // action method, define parameters freely,
        // return next state.
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

```ts
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

The basic usage about `model` is just enhancing `React.useReducer` to manage a local state, it also supports store usage with or without `React.Context` to manage a global state. 

### React.Context state management

```ts
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

Using `model(xxx).createStore(defaultState?).asGlobal()` can build a global store.

### Global state management

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
}).createStore(0).asGlobal(); 
// mark store to be global;
// Use `...createStore(0).static()` can create a global store too.
......
const Increase = memo(()=>{
    const increase = counting.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = counting.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = counting.useSelector(i => i.decrease);
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

### Initialize a dynamic state for store in render

Sometimes, provides a static state for initializing store is not a easy work. Use `useModel` API to initialize a dynamic state for store in render is a better solution in that case.

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
// The store declare method `static` is same with `asGlobal`.
// Give default state later in component render.
......
const Increase = memo(()=>{
    const increase = counting.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});

const Count = memo(()=>{
    const {count} = counting.useModel();
    return <span>{count}</span>;
});

const Decrease = memo(()=>{
    const decrease = counting.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});

const Component = function Comp({defaultCount}:{defaultCount:number}) {
    // Initialize default state in render.
    // API `useModel` always rerender component when state changes, even there is no state dependency.
    // From `@airma/react-state@18.4.0`, a higher performance optional API `useSignal` is provided for resolving this problem.
    counting.useModel(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

### Higher performance usage

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
// Give default state later in component render.
......
const Increase = memo(()=>{
    // API `useSignal` returns a signal function,
    // which can be called to get the newest instance from store.
    // Only the required parts of this instance change makes component rerender.
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
    // The difference with `useModel` is that `useSignal` only rerenders component when the required parts of instance change.
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

The `useSignal` API is much better than API `useSelector`, it computes out when to rerender component by the fields getting from instance automatically. And by using the `signal` function, it always provides a newest instance in usage point, so it can avoid stale data and zombie-children problems more effectively.

## Introduce

Consider `@airma/react-state` as a enhanced redux. It uses `model function` to replace `reducer function` and makes `dispatching action` been `calling method`; it provides 3 kinds of state-management: `Local state`, `React.Context state`, `Global state`, then the usage can be more reasonable; it allows providing parts of state from model instance, that makes state more flexible. 

### How dose a model work?

A model function should always return an object with action methods and render data. The `useModel` calls model function with a default state parameter, and generates an instance for model returning object. Calls method from the instance can generate a new state, then `useModel` uses this new state to recall model function, and generate a new instance for render.

### Why support context store?

In `@airma/react-state`, store is dynamic, every `provider` copies a working instance for a context usage.

 That means: 
 
 1. The store data can be destroyed with its `provider` component unmount.
 2. Components with same store provider can be used together in one parent component without state change effect to each other.
 
 #### How to subscribe a grand parent provider store?

 The store provider system in `@airma/react-state` is designed with a tree structure. The nearest `provider` finds store one-by-one from itself to its root parent `provider`, and links the nearest matched `provider` store to the subscriber `useModel/useSelector`.

 #### Does the state change of store leads a whole provider component rerender?

 No, only the hooks subscribing this `store` may rerender their owners. Every store change is notified to its subscriber like `useModel` and `useSelector`, and then the subscriber rerenders its owner by `useState`. 

 ### Why not async action methods

 Async action often makes stale data and [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) problems. So, a special tool to resolve this problem is necessary; another package [@airma/react-effect](/react-effect/index) is designed for it.

 ## Install and support

The package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:

### Install command

```
npm i @airma/react-state
```

### Browser support

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

Go to [Concepts](/react-state/concepts).