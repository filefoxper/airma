# 概念

在具体介绍 `@airma/react-state` 详细功能之前，有些概念是需要了解的，在后续的文章中我们将使用这些概念名进行讲解。

1. [模型](/zh/react-state/concepts?id=模型)
2. [state](/zh/react-state/concepts?id=state)
3. [实例原型](/zh/react-state/concepts?id=实例原型)
4. [原型](/zh/react-state/concepts?id=原型)
5. [更新](/zh/react-state/concepts?id=更新)

## 模型

模型定义为一个以 state 状态为入参的函数，该函数需要返回一个自定义 object （`实例原型`）。我们需要对自定义 object 添加与 state 相关的`渲染属性`及用于生产新 state 的`行为方法`。对 `@airma/react-state` 来说，模型是核心组件，是万物之源。

以下为模型的样例伪代码:

```ts
// model 是个模型函数
// 以 param 入参为 state
const model = <T>(param:T) =>({
    // data1, data2 ... 为渲染数据
    data1: any,
    data2: any,
    ......,
    // method1, method2 ... 为行为方法，
    // 行为方法需要返回一个与 state 同类型数据，
    // 用于生成新的 state 状态
    method1(...params:any[]):T{
        return nextParam1;
    },
    method2():T{
        return nextParam2;
    },
    ......
});
```

例子:

1. 计数器模型:

```ts
// 状态 count 为模型需要维护的常变状态数据，即该模型的 state
const counter = (count:number)=>{
    return {
        // 使用 count 直接渲染 
        count,
        // isNegative 为 count 是否为负数的渲染状态
        isNegative: count<0,
        // increase 是一个生成当前 count+1 的行为方法 
        increase(){
            return count+1;
        },
        // decrease 是一个生成当前 count-1 的行为方法
        decrease(){
            return count-1;
        }
    }
}
```

2. boolean 切换模型:

```ts
type ToggleInstance = [boolean, ()=>boolean];

// 我们可以返回一个元组类型的对象作为模型的实例原型
const toggler = (visible:boolean):ToggleInstance =>[
    visible, 
    ()=>!visible
];
```

## State

在 `@airma/react-state` 中，state 为模型函数的入参，通常我们在使用 `useModel` API时，需要为我们的模型提供一个默认 state 状态参数用于`模型实例`的初始化。在我们使用`模型实例`方法时，方法返回值将会被作为下一个 state，用于再次调用模型，并更新`模型实例`。

## 实例原型

实例原型是指模型返回的 object，它是一个模版处理器。它将用于生成`实例`（代理），通过调用`实例`（代理）上的方法才能引起 state 的更迭，以及`实例`的整体更新。

例子:

计数器模型:

```ts
const counter = (count:number)=>{
    // 实例原型
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

// instance 为实例
const instance = useModel(counter, 0);
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
