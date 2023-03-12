# Concepts

There are a few concepts you should know, for we will use these concepts as shortcut descriptions.

1. [model](/react-state/concepts?id=model)
2. [state](/react-state/concepts?id=state)
3. [proto instance](/react-state/concepts?id=proto-instance)
4. [instance](/react-state/concepts?id=instance)
5. [refresh](/react-state/concepts?id=refresh)

## Model

A `model` is a function which returns an object to provide display data and action methods. You can use it with different APIs provided by `@airma/react-state`. 

A model looks like:

```ts
const model = <T>(param:T) =>({
    // data for displaying
    data1: any,
    data2: any,
    ......,
    // action method for calling from instance 
    method1():T{
        return nextParam1;
    },
    method2():T{
        return nextParam2;
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
type ToggleInstance = [boolean, ()=>boolean];

// You can use tuple array as a proto instance too.
const toggler = (visible:boolean):ToggleInstance =>[
    visible, 
    ()=>!visible
];
```

## State

In `@airma/react-state`, state is the parameter for model, you can provide a default state by `useModel(model, state)` API. Every method from instance should returns a next state, `useModel` uses these next state to refresh instance.

## Proto instance

The object returned by `model` contains states and methods. It is a masterplate for generating a operable `instance`, we call it a `proto instance`.

Examples:

count model:

```ts
const counter = (count:number)=>{
    // proto instance
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
}
```

## Instance

The `proto instance` is always mapped to be an interface object by `useModel` API. Call methods from this interface object can lead a `model` refresh. We call this object a `instance`.

### Stable instance

Examples:

```ts
import {useModel} from '@airma/react-state';

const counter = (count:number)=>{
    // proto instance
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
}

// stable instance from proto instance
const instance = useModel(counter, 0);

useEffect(()=>{
    setTimeout(()=>{
        // You might have called instance.increase to make count 1, 
        // but, the scope closure fixed count always be 0.
        console.log(instance.count);
    },1000);
},[]);
```

The properties of `instance` are stable in a render time, no matter where and when you get them, they are fixed by the render scope closure. If you want to get a newest property value from `instance` in a side effect function runtime, you need to use `realtime instance`.

### Realtime instance

Examples:

```ts
import {useModel, useRealtimeInstance} from '@airma/react-state';

const counter = (count:number)=>{
    // proto instance
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
}

// stable instance from proto instance
const instance = useModel(counter, 0);

// realtime instance from stable
const realtimeInstanceFromStable = useRealtimeInstance(instance);

// realtime instance from proto instance
const realtimeInstance = useModel(counter, 0, {realtimeInstance:true});

useEffect(()=>{
    setTimeout(()=>{
        // You might have called instance.increase to make count 1, 
        // but, the scope closure fixed count always be 0.
        console.log(instance.count);
        // A realtime instance make sure you can get a newest value.
        console.log(realtimeInstanceFromStable.count);
        // A realtime instance make sure you can get a newest value.
        console.log(realtimeInstance.count);
    },1000);
},[]);
```

The only different with `stable instance` is that `realtime instance` can not fit `React.Strict` mode so well, but it has a realtime property getter. So, we call both of them `instance`.

## Refresh

When we call a method from `instance`, it returns a next `state` as a new parameter for `model`, then `useModel` API recalls the `model` with this new `state` to refresh `instance`. We call these procedures `refresh`.

Examples:

```ts
const counter = (count:number)=>{
    // proto instance
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
}

// instance from proto instance
const {count, increase} = useModel(counter, 0);
......
const clickEventHandler = ()=>{
    increase(); // refresh
};
```

The process of refresh:

```
increase() -> 1 (next state)

// auto: run `counter(1);`
// auto: update result of `counter(1)` to instance
```

Let's go to next [section](/react-state/guides.md) to see how to manage the local state.
