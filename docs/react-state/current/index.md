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

## Code first

Create a model function:

```js
export function counting(state:number){
    return {
        // render data
        count: state,
        // action method
        increase:()=>state + 1,
        // action method
        decrease:()=>state - 1,
        // action method
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
const {count, increase, decrease, add} = useModel(counting, 0); // set defaultState `0`
// call method `increase/decrease/add` can change `count` and make component rerender
......
```

The model function should return an object or array as a instance. Call method of this instance can change state, and the new state should be this calling return. Use API [model](api?id=model) to wrap the model function can get a model usage API.

### Local state management

```ts
import {model} from '@airma/react-state';

// Use `model` API to create a ModelUsage for this model.
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

// Use `ModelUsage.useModel` API to build a state-management.
const {count, increase, decrease, add} = counting.useModel(0);
......
```

This is just a local state management. It also can be used as a top store state management.

### Static store state management

Using `model(xxx).createStore(defaultState?)` can create a store. If this store is created outside of react component, it is static, every component can use it directly.

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
}).createStore(0); 
// Use `model(xxx).createStore()` can create a static store.
......
const Increase = memo(()=>{
    // use store.useSelector can subscribe state changes from store,
    // when the selected result is changed, it rerender component. 
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
// The static store should be used directly.
// It needs no `Provider` help.
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

API [useSelector](api?id=useselector) rerenders component according to the selected result change. So, this API is helpful to reduce render frequency.  

### Initialize store in render time

Sometimes, we need to initialize store state in render time.

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
// Without default state.
// Initialize default state later in render time.
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
    // Initialize default state in render time.
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

The useModel API always rerenders component when state change happens. So, it is not a good idea to use this API only for initializing store state.

### Higher performance usage

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
......
const Increase = memo(()=>{
    // API `useSignal` returns a signal function,
    // which can be called to get the newest instance from store.
    // Only the render usage fields of this instance change makes component rerender.
    // The action method `increase` from instance is changeless, so it won't cause this component rerender.
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
    // API `useSignal` can initialize store state in render time too.
    // The difference with `useModel` is that `useSignal` only rerenders component when the render usage fields of instance changes.
    // So, makes the signal with zero field usage can stop it rerender this component.
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

 API [useSignal](api?id=usesignal) is even better than API **useSelector**, it generates a signal callback. Call the signal callback can get a newest instance. The instance compares its render time using properties with the store instance properties, when these properties changes, it make **useSignal** rerenders component.

The static store is easy for usage, every element created by different or same components shares a same state change from the same store. But sometimes, we need elements created by same component carry similar but different stores. The static store is not easy to satisfy this case, and use dynamic store instead is a better and easier way.

### Dynamic store state management

```ts
import {memo} from 'react';
import {model} from '@airma/react-state';

// Use model(xxx).createKey() to generate a model key,
// A model key is a wrapper for generating dynamic store,
// and also a validating identifier for subscribing right store.
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
......
const Increase = memo(()=>{
    // use key.useSelector can subscribe state changes from store,
    // when the selected result is changed, it rerender component. 
    const increase = countingKey.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use key.useModel can sync state changes from store.
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingKey.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
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

Dynamic store state management creates store in component, that makes every element of this component has a different store with each other, and these stores should always be destroyed when the creator element unmounts.

We suggest more dynamic store usage, not static store.

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
    // Use produce method to create a new object from instance,
    // and simulate async actions.
}).produce((getInstance)=>{
    // getInstance is a function to get current instance object.
    const instance = getInstance();
    // returns a selected instance
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
    // The produced instance methods are persist too.
    const signal = countingKey.useSignal();
    return <button onClick={signal().increaseBySetting}>+</button>;
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

The **produce** method can create a simulate instance to replace the original one.

## Introduce

Consider `@airma/react-state` as a enhanced redux. It uses model function to replace reducer function and makes dispatching action to be calling method; it provides 3 kinds of state-management: Local state, Dynamic store state, Static store state, then the usage can be more reasonable; it allows providing parts of state from model instance, that makes state more flexible. 

### How dose a model work?

1. Store creator calls model function with state to generate an instance for the new store.
2. Calling method of store instance dispatches a new state generated by this method to store.
3. The store recalls model function with this new state to refresh its instance, and notify its subscribers.

### Why support dynamic store?

Dynamic store binds with component element. This feature is very helpful in react usage.

 1. The store needs to be destroyed when the component unmounts.
 2. When the store owner component generates some different elements, no body want they sync state changes with each other.
 
 #### How to subscribe a grand parent provider store?

 The store provider system in `@airma/react-state` is designed with a tree structure. The nearest **provider** finds store one-by-one from itself to its root parent **provider**, and links the nearest matched **provider** store to the subscriber **useModel/useSignal/useSelector**.

 #### Does the state change of store leads a whole provider component rerender?

 No, only the hooks subscribing this store may rerender their owners. Every store change is notified to its subscriber like **useModel** or **useSelector**, and then the subscriber rerenders its owner by **useState**. 

 ### Why not async action methods

 Async action often makes stale data and [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) problems. So, a special tool to resolve this problem is necessary; another package [@airma/react-effect](/react-effect/index) is designed for it.

 And from **18.6.0**, you can use **model(xxx).produce** to compose action methods for simulating an asynchronous action.

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

Go to [Concepts](concepts).