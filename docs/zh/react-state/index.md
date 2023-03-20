[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

`@airma/react-state` 是一款基于 object 模型的类 redux 状态管理工具，它抛弃了传统 reducer 系统的 dispatch 事件分发机制，采取了类似面向对象的方法调用机制来维护模型状态值。

```tsx
import React from 'react';
import {render} from 'react-dom';
import {useModel} from '@airma/react-state';

const App = ()=>{

    // 使用 useModel 创建一个模型实例对象。
    // 函数模型入参 count 为模型状态。
    const instance = useModel((count:number)=>({
        count,
        isNegative: count<0,
        // 用于修改状态的模型实例方法原型。
        // 方法调用返回值即为状态更迭值。
        increase:()=> count + 1,
        decrease:()=> count - 1
    }),0); // 默认状态 0

    const {
        count, 
        isNegative,
        // 通过调用来自实例的方法来实现状态更迭和实例刷新
        decrease, 
        increase
    } = instance; // 实例对象

    return (
        <div>
            <div>计数器模型</div>
            <button onClick={decrease}>-</button>
            <span style={isNegative?{color:'red'}:undefined}>
                {count}
            </span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

上例通过建立一个计数器模型创建了一个计数器组件。我们为 `useModel` API 提供了一个 function 函数模型，该模型返回了一个带有行为方法（修改 state 方法）和渲染数据的对象。我们通过调用来自 `useModel` 返回对象实例上的方法即可渲染新的实例数据。

如：调用 `increase` 方法，`useModel`会自动使用方法返回值 `count+1` 作为最新参数再次调用模型函数，更新实例对象，这时 `instance.count` 比调用前的值大 `1` 。

## 介绍

更新实例对象的原则如下：

1. 为 `useModel` 提供模型函数和初始状态值，`useModel` 通过调用模型函数得到初始实例对象。
2. 调用来自初始实例对象的方法，`useModel` 将使用方法调用返回值最为新的参数，重新调用模型函数，并得到新的实例对象。
3. `useModel` 使用该实例对象渲染当前组件。

### 为什么不使用 setState 修改状态？

这个理由其实和 `useReducer` 不提供内部的 `setState` 是一样的。

首先，`setState` 容易破坏数据逻辑之间的羁绊。容易把一份完整的数据拆散成一个个的小单元进行独立处理，从而遗漏了数据之间的互相制约。比如，我们有一个分页查询逻辑，在我们调用提交行为方法时需要引起 query 数据的变化，同时将页码设置为第一页。

```ts
// 这是个虚假时空的分页查询模型函数
const model = (state, setState)=>{
    return {
        ...state,
        submit(query: Query){
            setState({query});
            // ...... 其他逻辑处理
            // 因为中间步骤的众多逻辑处理很容易让人遗漏掉以下代码
            // setState({page: 1});
        }
    }
};
```

我们可以看到，在一个复杂逻辑处理的行为方法中，必要的状态改变很容易被遗漏。又因为 `setState` 过于分散，导致查找问题的复杂度大大增加。我们再来看看通过当前 `return` 值作为修改状态点的做法。

```ts
// 这是个分页查询的模型函数
const model = (state)=>{
    return {
        ...state,
        submit(query: Query){
            // ...... 其他逻辑处理
            // 即便中间逻辑再多，我们也可以通过预测事先定义好返回对象，
            // 这样就不容易产生不必要的数据遗漏了
            return {...state, query, page: 1};
            // 即使产生了遗漏现象，我们也能通过 return 关键词快速定位问题
            // return {...state, query};
        }
    }
};
```

上述提到的可预测性，是类 reducer 工具的另一个好处，我们往往可以在处理复杂逻辑之前，预判该行为最终产生的改变，并预先使用 return 将它的大致样子返回回来，再慢慢实现中间步骤。这有助于我们使用逻辑推导能力来助力我们的开发，更有利于我们使用现有的测试驱动开发的能力，让我们的代码更加健壮。如：

```ts
// model.ts
export const counter = (count:number)=>({
        count,
        isNegative: count<0,
        // 用于修改状态的模型实例方法原型。
        // 方法调用返回值即为状态更迭值。
        increase:()=> count + 1,
        decrease:()=> count - 1
    });
```

单元测试：

```ts
// test case
// 如此简单，且脱离 react 以及 @airma/react-state 库制约的单元测试
// 想必各位饱受单元测试之苦的用客们都会喜欢吧
import { counter } from './model';

describe('test counter', ()=>{

    test('increase should make count to be 1, isNegative false',()=>{
        const next = counter(0).increase();
        const {count, isNegative} = counter(next);
        expect(count).toBe(1);
        expect(isNegative).toBe(false);
    });

});
```

上述代码使用了最简单的逻辑进行单元测试。我们很容易给出我们的预测值进行测试助力，这些能力都是使用 setState 所不能的。

如果你觉得该工具的价值已经满足了你的期许，请继续下一章节的内容[安装与支持](/zh/react-state/install.md)，赶紧装起来再说吧。如果，你觉得依然没有找到你所期望的价值，请直接进入[概念](/zh/react-state/concepts.md)篇进行更加深入的了解。