# Concepts

There are some concepts for understanding the working principles.

1. [model](/react-state/concepts?id=model)
2. [key](/react-state/concepts?id=key)

## Model

`Model` is a function returns an object for render and do actions. The only parameter for `model` function is its `state`, every action method should return a new `state`.

A model looks like:

```ts
const model = <T>(param:T) =>({
    // data for render
    data1: param.data1,
    data2: ......,
    ......,
    // action method for calling from instance 
    method1():T{
        return nextParam;
    },
    method2():T{
        return nextParam;
    },
    ......
});
```

Examples:

1. count model:

```ts
const counter = (count:number)=>{
    return {
        // count value
        count,
        // is count a negative number
        isNegative: count<0,
        // method to increase count
        increase(){
            return count+1;
        },
        // method to decrease count
        decrease(){
            return count-1;
        }
    }
}
```

2. toggle model:

```ts
// You can define a tuple array as return instance too.
const toggler = (visible:boolean):ToggleInstance =>[
    visible, 
    ()=>!visible
] as const;
```

### How does it work?

API `useModel` and `useSelector` provides an instance object by calling `model` with its state. When action method from the instance object is called, a new state is generated. Then the state management core of `@airma/react-state` recalls model with this new state, and refreshes instance for rerender.

Step 1:

```ts
import {useModel} from '@airma/react-state';

const {count, increase} = useModel(counter, 0);

function callIncrease(){
    // state: 0
    increase(); 
    // state: 0
    // generate next state 1;
    // send next state to state-management core;
}
......
```

Step 2:

```
state-management core:
1. recalls `counter` with next state 1;
2. notify `useModel` with new state and new instance.
```

Step 3:

```ts
import {useModel} from '@airma/react-state';

// accept new state and instance from core;
// use useState to update all.
const {count, increase} = useModel(counter, 0);

function callIncrease(){
    increase();
}
......
```

## Key

In `@airma/react-state`, sharing state changes among different components need to use store, and store is created by `key`. Every `key` is unique, it can be used to link store.

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generate store
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
// give the key a static default state
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

The API [createKey](/react-state/api?id=createkey) can wrap a model function to be a unique `key` with or without a default state. The example above shows how to initialize static state with `key`. There is also way for [initilizing dynamic state in render time](/react-state/index?id=initialize-a-dynamic-state-for-store-in-render).

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generate store
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
// give the key a static default state
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
    // initialize a dynamic state in render time.
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
