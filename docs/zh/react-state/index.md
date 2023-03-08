[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

`@airma/react-state` 是一个基于 function 模型的 react 状态管理工具。一个 function 模型需要提供一个 state 入参，并返回一个包含修改 state 状态方法和渲染数据的任意对象。 

```ts
import React from 'react';
import {render} from 'react-dom';
import {useModel} from '@airma/react-state';

const App = ()=>{

    // 使用 useModel 创建模型实例
    // 这里的模型参数 count 就是 state 状态
    const instance = useModel((count:number)=>({
        count,
        // 所有返回字段可自定义，并都参与渲染
        isNegative: count<0,
        // 所有方法根据当前 state 和入参生成下一个 state
        increase:()=> count + 1,
        decrease:()=> count - 1
    }),0); //  设置默认 state 为 0

    const {
        // 渲染数据
        count, 
        isNegative,
        // 调用实例方法后， 
        // useModel 会使用方法返回值重新调用模型 function，
        // 并刷新当前的模型实例，从而达成重新渲染的效果
        decrease, 
        increase
    } = instance;

    return (
        <div>
            <div>计数器</div>
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

上例中，我们创建了一个计数器模型 function。并使用 useModel API 实例化了该模型，通过直接调用模型实例的方法，我们可以修改 count 状态数据。

## 介绍

`useModel` 维护状态的原理其实并不难。

1. 首先我们需要提供一个可接收 state 状态参数，并返回一个包含修改 state 状态方法和渲染数据对象的 `function` 作为模型。
2. `useModel` 会使用默认 state 作为模型参数对模型进行初始化运行，并产生一个`模型实例`。
3. 调用`模型实例`中的方法，可以返回一个新的 state。
4. `useModel` 会使用新的 state 作为参数，重新调用模型，从而达到刷新`模型实例`的效果。

### 为何不设计 setState API？

使用 `setState` API 会使模型变得非常灵活，但同时也变得非常复杂，特别是当你需要在没有`@airma/react-state` 的环境中复用模型逻辑时，将会觉得异常困难。

让我们使用单元测试来观察 `setState` 和 `return` 修改状态的区别：

```ts
// 使用 setState 修改状态的模型
const counter = (count:number, setState:(d:number)=>void)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            setState(count+1);
        },
        decrease(){
            setState(count-1);
        }
    }
}

// 使用 setState 模型的单元测试
import {act} from 'xxx-react-test-lib';
import {useModel} from '@airma/fake-react-state';

const instance = useModel(counter,0);
const method = act(()=>instance.increase()));
......
expect(instance.count).toBe(1);
// 我们需要在单元测试中使用相关的库，这其实是件挺麻烦的事情。
```

vs 

```ts
// 使用 return 修改状态的模型
const counter = (count:number)=>{
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

// 使用 return 模型的单元测试
const instance = counter(0);
// 不需要依赖第三方库就可以执行的简单测试
const nextInstance = counter(instance.increase());
expect(nextInstance.count).toBe(1);
```

从上例中我们可以很容易发现使用 return 修改状态模型对环境的适应性更强。

假设现在有一个较为复杂的判断逻辑，让我们再次誓言两者的区别：

```ts
// 使用 setState 修改状态的模型
const counter = (count:number, setState:(d:number)=>void)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            setState(count+1);
        },
        decrease(){
            if (count<=10) {
                setState(count-5);
                return;
            }
            if ...
            if (count<=5) {
                setState(count-2);
                // 忘记 return 从而导致 bug 
            }
            setState(count-1);
        }
    }
}
```

vs

```ts
// 使用 return 修改状态的模型
const counter = (count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            if (count<=10) {
                return count-5;
            }
            if ...
            if (count<=5) {
                return count-2;
                // 必须通过 return 修改数据，不容易产生问题 
            }
            return count-1;
        }
    }
}
```

通过对比上例，我们可以观察到，`return` 状态值有助于我们避免复杂情况下的 bug。

以上这些问题是导致 `@airma/react-state` 采取类 `reducer` 生产下一状态值，而非设置状态值的主要原因。

### 为什么不直接使用 useState？

之前我们谈到 `@airma/react-state` 是针对 reducer 系统的改进产物，所以你可以认为它就是优化版的 `useReducer`。而根据上述关于不使用 setState 的原因，我们可以大致了解一小部分 useState 的弊端，但事实上 useState 更大的问题是容易让使用者写出容易产生闭包旧数据问题的代价，以及逻辑关联状态容易设计得过于分散等问题，具体看参考特性章节中的相关内容。

如果你觉得 `@airma/react-state` 就是你的菜了，请参考并[安装](/zh/react-state/install.md)它吧。如果你想继续了解更多，请进入[概念](/zh/react-state/concepts.md)章节继续我们的旅程。