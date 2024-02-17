[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

`@airma/react-state` 是一款基于模型对象的类 redux 状态管理工具，通过调用行为方法进行事件分发，改变模型状态。

## 使用方式

```ts
import {useModel} from '@airma/react-state';

const instance = useModel((count:number)=>({
    // 渲染数据
    count,
    isNegative: count<0,
    // 行为方法，用于生成行为后的状态
    increase:()=> count + 1,
    decrease:()=> count - 1
}),0); // 默认状态 0

const {
    count, 
    isNegative,
    // 调用行为方法触发状态变更与重渲染
    decrease, 
    increase
} = instance;
```

上例通过使用类 `reducer` 的 `function` 创建了一个计数状态管理器。在 `@airma/react-state` 中，这个类 `reducer function` 被称为[模型](/zh/react-state/concepts?id=模型) `model`。

使用 [model](/zh/react-state/api?id=model) API，可以简化使用步骤，让相关的 hooks 使用更加清晰明了。

### 本地状态管理

```ts
import {model} from '@airma/react-state';

// model API 通过包装模型函数，返回一个与源模型接口相同的新模型，
// 并在新模型上提供了一套完整的模型操作常用 API 集合。
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
// 我们可以直接通过 get 的形式使用 useModel
const {count, increase, decrease, add} = counting.useModel(0);
......
```

`model` API 的基本功能即优化 `React.useReducer`，方便本地状态管理。同时它也支持了使用 `React.Context` 共享状态管理模式和全局共享状态管理模式。

### React.Context 共享状态管理

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

### 全局共享状态管理

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

### render 运行时初始化默认状态

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
}).createStore();
// Give default state later in component render.
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

const Component = countingStore.provideTo(function Comp({defaultCount}:{defaultCount:number}) {
    // initialize default state in render.
    countingStore.useModel(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

## 介绍

### 模型是如何工作的？

### 为什么要支持 React.Context 共享状态模式？

#### 如何跨 Provider 订阅共享状态？

#### 共享状态变更是否会引起整个 Provider 组件重新渲染？

### 为什么不支持异步状态管理？

## 安装与浏览器支持

### 安装命令

### 浏览器支持

