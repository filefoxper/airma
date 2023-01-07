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

The `proto instance` can be transformed to be a `Proxy` object by `useModel` API. Call the methods from this `Proxy` object can lead a `model` refresh. We call the `Proxy` object `instance`.

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

// instance from proto instance
const instance = useModel(counter, 0);
```

## Refresh

When we call a method from `instance`, it returns a next `state` for `model`, then `useModel` API recalls the `model` with this new `state` to refresh `instance`. We call these procedures `refresh`.

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

// instance from proto instance
const {count, increase} = useModel(counter, 0);
......
increase(); // refresh
```

The process of refresh:

```
increase() -> 1 (next state)

// auto: run `counter(1);`
// auto: update result of `counter(1)` to instance
```

Let's go to next [section](/react-state/guides.md) to see how to manage the local state.
