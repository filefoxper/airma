[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square


# @airma/react-state

Simple model state-management with method action dispatch mode for react components.

## Documents

* [En](https://filefoxper.github.io/airma/#/react-state/index)
* [中文](https://filefoxper.github.io/airma/#/zh/react-state/index)

## Code first

Create model function:

```js
export function counting(state:number){
    return {
        // reproduced state for render
        count: state,
        // action method
        increase:()=>state + 1,
        // action method
        decrease:()=>state - 1,
        // action method, define parameters freely.
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}
```

Use model function:

```tsx
import {counting} from './model';
import {useModel} from '@airma/react-state';

......
// give it an initialState can make it fly.
const {count, increase, decrease, add} = useModel(counting, 0); // initialState `0`
// call method `increase\decrease\add` can change `count` and make component rerender
......
```

The model function returns an instance to manage the actions and state. Use API **model** can make it more simple.

### Local state management

```tsx
import {model} from '@airma/react-state';

// api model returns a wrap function for your model function.
// it keeps a same type of parameters and return data with the wrapped function.
const counting = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
});
......
// you can get useModel from the model wrapped function.
const {count, increase, decrease, add} = counting.useModel(0);
......
```

This is just a local state management. It also can be used as a top store state management.

### Dynamic store state management

API **createKey** can create a model wrapper for generating a dynamic store. It is also a key to subscribe this store.

```tsx
import {memo} from 'react';
import {model, provide} from '@airma/react-state';

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createKey(0);
// Create a key. 
// The key can be used to create a store.
// The key can be used to subscribe state changes from store.
......
const Increase = memo(()=>{
    // use countingKey.useSelector can subscribe state changes from store,
    // when the selected result is changed it rerender component. 
    const increase = countingKey.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use countingKey.useModel can subscribe state changes from store.
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingKey.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// A Hoc usage to create and provide a dynamic store to its children components.
// It is same with using `Provider` Component to wrap the customized component.
const Component = provide(countingKey).to(function Comp() {
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
A dynamic store should be created in a component, and be subscribed in the children components by using **React.Context**.

A static store should be created in a global scope, and be subscribed in any component without provider.

Using **model(xxx).createStore()** can build a static store.

### Static store state management

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore(0);
// create a global store
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

The **useSelector** API is helpful for reducing render frequency, only when the selected result is changed, it make its owner component rerender. 

### A high performance usage about useSignal

API **useSignal** is designed to be a simple and high performance usage to replace **useSelector** in some cases.

```ts
import {model} from '@airma/react-state';

const counting = model(function countingModel(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore();
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

 API **useSignal** is even better than API **useSelector**, it generates a signal callback. Call the signal callback can get a newest instance. The instance compares its render time using properties with the store instance properties, when these properties changes, it make **useSignal** rerenders component.

### Simulate asynchronous action

```ts
import {memo} from 'react';
import {model} from '@airma/react-state';

const fetchSettingStep = ():Promise<number> =>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(2);
        }, 300)
    });
}

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
    // produce instance to be an asynchronous action simulate instance.
}).produce((getInstance)=>{
    // getInstance is a function to get current instance object.
    const instance = getInstance();
    // returns a produced instance
    return {
        ...instance,
        // compose an async action
        async increaseBySetting(){
            const step = await fetchSettingStep();
            // use getInstance again to get the newest instance.
            return getInstance().add(step);
        },
        async decreaseBySetting(){
            const step = await fetchSettingStep();
            return getInstance().add(-step);
        }
    }
}).createKey(0);

......
const Increase = memo(()=>{
    // The produced instance is changed by action works, and its methods are persist.
    const signal = countingKey.useSignal();
    const {increaseBySetting} = signal();
    return <button onClick={increaseBySetting}>+</button>;
});
const Count = memo(()=>{
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const signal = countingKey.useSignal();
    const {decreaseBySetting} = signal();
    return <button onClick={decreaseBySetting}>-</button>;
});
// The HOC API `provide` can create store from keys in a `Provider` component.
const Component = provide(countingKey).to(function Comp() {
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

The produced instance is not a true instance. It has persist methods, and these methods are normal methods, they can only change state by calling methods from getInstance().

## Why support context store?

The context store is a dynamic store, it has some better features than a static store.
 
 1. The store data can be destroyed with its owner component unmount.
 2. Components with same store factory creates different stores.
 
 ### How to subscribe a grand parent provider store?

 The store provider system in `@airma/react-state` is designed with a tree structure. The nearest **provider** finds store one-by-one from itself to its root parent **provider**, and links the nearest matched **provider** store to the subscriber **useModel/useSignal/useSelector**.

 ### Does the state change of store leads a whole provider component rerender?

 No, only the hooks subscribing this `store` may rerender their owners. Every store change is notified to its subscriber like **useModel** or **useSelector**, and then the subscriber rerenders its owner by **useState**. 

 ## Why not support async action methods

 Async action often makes stale data problem and [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) problem. So, a special tool to resolve this problem is necessary, you can try [@airma/react-effect](https://filefoxper.github.io/airma/#/react-effect/index) with it.

 And from **18.6.0**, you can use **model(xxx).produce** to compose action methods for simulating an asynchronous actions.

There are more examples, concepts and APIs in the [documents](https://filefoxper.github.io/airma/#/react-state/index) of `@airma/react-state`.

## Browser Support 

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

