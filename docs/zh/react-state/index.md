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
    } = instance;

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

The example above is using `useModel` to create a `count model instance`. By calling method `increase`/`decrease` from this instance, we can increase or decrease the `count` from `model instance`.

上例通过建立一个计数器模型创建了一个计数器组件。

## Introduction

The principle for instance creating and refreshing is simple.

1. Provides a `model function` which returns an object with refresh methods and data for display.
2. API `useModel` creates a `instance` from `model function` and default parameter (state).
3. Calls `instance` method to generate a `next parameter` for `model function`.
4. API `useModel` refreshes `instance` by recalling `model function` with the `next parameter` again automatically.

### Why not setState?

Provide a `setState` API can make model more flexible. But it takes troubles too, when you want to test or reuse your model, you have to do more works.

Test examples between `setState` and `return`: 

```ts
// setState
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

// test
import {act} from 'xxx-react-test-lib';
import {useModel} from '@airma/fake-react-state';

const instance = useModel(counter,0);
const method = act(()=>instance.increase()));
......
expect(instance.count).toBe(1);
// this is a little boring
```

vs 

```ts
// return
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

// test
const instance = counter(0);
const nextInstance = counter(instance.increase());
expect(nextInstance.count).toBe(1);
```

Use `method return` to refresh instance makes model a pure function, you can test or reuse it more easier.

Reuse examples between `setState` and `return`:

```ts
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

const MyComp = (props)=>{
    const {count, onChange} = props;
    const instance = useMemo(()=>{
        return counter(count, onChange);
    },[count, onChange]);

    const handlePositiveDecrease = ()=>{
        // We have to modify counter model to make sure,
        // that the instance.count always >=0
    }

    ......
}
```

vs

```ts
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

const MyComp = (props)=>{
    const {count, onChange} = props;
    const instance = useMemo(()=>{
        return counter(count);
    },[count]);

    const handlePositiveDecrease = ()=>{
        // a composite way to make sure,
        // that the instance.count always >=0
        const result = instance.decrease();
        if(result<0){
            return;
        }
        onChange(result);
    }

    ......
}
```

So, you can know that `@airma/react-state` is a tool which manages state by method returning just like `redux` or `useReducer`.

If you are interested with this tool please take next section about [installing and browser supports](/react-state/install.md) or go to [concepts](/react-state/concepts.md) directly.