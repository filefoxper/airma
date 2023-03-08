# 概念

在具体介绍 `@airma/react-state` 详细功能之前，有些概念是需要了解的，在后续的文章中我们将使用这些概念名进行讲解。

1. [模型](/zh/react-state/concepts?id=模型)
2. [state](/zh/react-state/concepts?id=state)
3. [实例原型](/zh/react-state/concepts?id=实例原型)
4. [原型](/zh/react-state/concepts?id=原型)
5. [更新](/zh/react-state/concepts?id=更新)

## 模型

A `model` is a function which returns an object to provide display data and action methods. You can use it with different APIs provided by `@airma/react-state`. 

A model looks like:

```ts
const model = <T>(param:T) =>({
    // data for displaying
    data1: any,
    data2: any,
    ......,
    // action method for calling from instance 
    method1(...params:any[]):T{
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

## 实例原型

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

## 实例

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

## 更新

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
