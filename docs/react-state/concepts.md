# Concepts

There are some concepts for understanding the working principles.

1. [model](/react-state/concepts?id=model)
2. [key](/react-state/concepts?id=key)

## Model

`Model` is a function returns an object for render and do actions. The only parameter for `model` function is `state`, every action method should return a new `state`.

A model looks like:

```ts
const model = <T>(state:T) =>({
    // data for render from state
    data1: state.data1,
    data2: state,
    ......,
    // action method for calling from instance 
    method1():T{
        return nextState;
    },
    method2():T{
        return nextState;
    },
    ......
});
```

Examples:

1. count model:

```ts
// state is a number, it can be any param name.
// model is a function accepts state and returns an instance object.
const counter = (count:number)=>{
    return {
        // count value
        count,
        // is count a negative number
        isNegative: count<0,
        // Action method to increase count.
        // The action method should return a new state, and be a directly property of this instance.
        increase(){
            return count+1;
        },
        // Action method to decrease count
        decrease(){
            return count-1;
        }
    }
}
```

2. toggle model:

```ts
// The instance can be an array.
const toggler = (visible:boolean):ToggleInstance =>[
    visible, 
    ()=>!visible
] as const;
```

### How does it work?

API `useModel` contains a store, it calls model function with a initialize state, and generates a initialized instance. Call method from instance can generate and dispatch a new state to store, then the store recalls model with this new state to generate a new instance.

Step 1:

```ts
import {useModel} from '@airma/react-state';

// initialize instance with default state 0.
const {count, increase} = useModel(counter, 0);

function callIncrease(){
    increase(); 
    // call action method from instance, generates a new state 1, and dispatch it to store.
}
......
```

Step 2:

```
local store:
1. recalls `counter` with new state to generate a new instance;
2. notify this new instance and state to `useModel` API.
```

Step 3:

```ts
import {useModel} from '@airma/react-state';

// Accept new state and instance from store, and use `React.useState` to update all.
const {count, increase} = useModel(counter, 0);

function callIncrease(){
    increase();
}
......
```

## Key

Key is a model wrapper for creating store. It is also a unique identifier for syncing state changes from store. Every store contains a unique key, no matter if the created store is a dynamic one or a static one.

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generating store
const counterKey = createKey((count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
// give the key a default state
}, 0);

const Increase = memo(()=>{
    // use key to link store in Provider
    const increase = useSelector(counterKey, i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use key to link store in Provider
    const {count} = useModel(counterKey);
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    // use key to link store in Provider
    const decrease = useSelector(counterKey, i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// use `provide` to generate store inside Provider
const Component = provide(counterKey)(function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

The API [createKey](/react-state/api?id=createkey) can wrap a model function to be a unique `key` with or without a default state. The example above shows how to initialize default state with `key`. There is also a way for initializing default state in render time.

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generating store
const counterKey = createKey((count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
});

const Increase = memo(()=>{
    const increase = useSelector(counterKey, i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = useModel(counterKey);
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = useSelector(counterKey, i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
const Component = provide(counterKey)(function Comp() {
    // initialize a default state in render time.
    useModel(counterKey, 0);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

To next [section](/react-state/guides).
