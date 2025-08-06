[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

**@airma/react-state** 是一款融合了**面向对象**与**函数式编程**两种不同风格的 react 状态管理工具。其工作原理接近 redux，却采用了更自然的**方法调用**方式来分发行为事件（dispatch action）。

## 使用方式

```ts
import React from 'react';
import {useModel} from '@airma/react-state';

const App = ()=>{
    const instance = useModel(
        // 模型
        (count:number)=>({
        // 渲染数据
        count,
        isNegative: count<0,
        // 行为方法，用来生成行为发生后所处的状态
        increase:()=> count + 1,
        decrease:()=> count - 1
    }), 0); // 初始状态 0

    const {
        count, 
        isNegative,
        // 调用行为方法，触发状态更新
        decrease, 
        increase
    } = instance; // 模型实例
}
```

以类似 reducer 的函数为核心可创建了一个状态管理对象。该函数被称作[模型](concepts?id=模型)（model），函数返回的对象为**模型实例**。调用模型实例上的行为方法可触发状态更新。

[model](api?id=model) 声明式 API 提供了一种更加便捷的使用方案，同时明确了函数作为模型的作用。

### 本地状态管理

```ts
import {model} from '@airma/react-state';

// 通过 model API 声明模型，可获取模型相关的常用 API。
const counting = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
});
......
// 通过 model(xxx).useModel 的方式使用 useModel API。
const {count, increase, decrease} = counting.useModel(0);
......
```

除了类似 React.useReducer/React.useState 的本地状态管理方案，API 还提供了基于 React.Context 的**动态库**和基于外部常量的**静态库**状态管理方式。

### 动态库

并不是所有使用了 Context 技术的库都是动态库。所谓的动态库是指在组件首次**元素化** (Component->Element) 过程中，建立在组件元素 (Element) 内部的库，库组件的子组件可以通过 Context 技术同步库中的状态。因此，同一动态库组件生成的不同元素 (Element) ，持有不同的库，它们互相独立，互不干扰的，且随组件元素 (Element) 创建或销毁。

由于动态库更符合react状态组件元素化的思想，动态库往往比静态库更加灵活，但一个高性能的动态库创建过程往往是具有一些复杂度的，如 zustand 推荐使用 useRef/useState 的建库过程。@airma/react-state 设计了一种通过**模型键**来生成并订阅动态库的新方案。

```ts
import {memo} from 'react';
import {model, provide} from '@airma/react-state';

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createKey(0);
// model(modelFn).createKey(initialState) 可创建模型键，
// 并预设相应动态库的初始化状态。
......
const Increase = memo(()=>{
    // countingKey 模型键可用于订阅动态库状态 
    const increase = countingKey.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // countingKey 模型键可用于订阅动态库状态 
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingKey.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// provide(...keys).to(Component) 高阶组件，可将自定义组件提升为一个在元素化过程中生成并持有动态库的 Provider 包装组件
const Component = provide(countingKey).to(function Comp() {
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

注意，通过 **model(modelFn).createKey** 创建的**键**并非传统意义上的[模型键](concepts?id=键)，而是模型键的包装，它含有与键相关的常用 API。

provide 的实际作用是创建了一个可在元素化（React.createElement）过程中创建动态库的 Provider 包装组件。因此，以上代码等同于：

```ts
import {memo} from 'react';
import {model, Provider} from '@airma/react-state';

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createKey(0);
......
const Increase = memo(()=>{
    const increase = countingKey.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingKey.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// 直接使用 Provider 组件也可以达到在组件内创建动态库的效果
const Component = function Comp() {
    return (
        <Provider value={countingKey}>
            <div>
                <Increase/>
                <Count/>
                <Decrease/>
            </div>
        </Provider>
    );
};
```

### 静态库

与动态库不同，静态库通常是一个组件外部常量，库状态维护在组件外部。它可以在没有 React.Context 技术支持的情况下订阅使用，静态库的状态在组件产生的不同元素中是完全同步的。

@airma/react-state 也提供了**模型库**作为静态库状态管理的方案。

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createStore(0);
// 使用 createStore 可建立一个静态库，并提供初始化状态
......
const Increase = memo(()=>{
    // useSelector API 可选取需要的字段，
    // 当且仅当被选取值发生变化，组件才再次渲染。
    // `increase` 作为行为方法是恒定不变的，
    // 因此该组件不会再次渲染
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
// 静态库不需要 Context 系统干预，因此无需高阶组件的提升，也不需要 Provider 指定访问范围
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

与 React.Context 动态库不同，静态库在使用上会更加简单，不需要使用 Provider 外包装组件，也不需要高阶组件做建库提升。

### render 运行时初始化

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createStore();
// 使用 createStore 可建立一个无状态的库
// 注意 createKey 也允许建立无状态键，也可以在 render 时初始化相应动态库
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

const Component = function Comp({defaultCount}:{defaultCount:number}) {
    // 在 render 运行时初始化静态库。
    // 注意，无论是否使用 useModel 返回的实例对象，当实例对象变更时，必然会触发当前组件渲染。
    countingStore.useModel(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

**@airma/react-state** 允许在 render 运行时初始化库状态。

根据 **useModel** 的固有特性，无论是否使用其返回的模型实例对象，只要该模型实例发生了变更必然会导致组件重渲染。API [useSignal](api?id=usesignal)  作为 useModel 的后发高性能平替，非常适于订阅动态库和静态库，它可以动态分析每次库状态变更时，订阅组件所使用的实例属性值是否发生变更，并据此决定是否重渲染当前订阅组件。

### useSignal 高性能渲染 API

```ts
import {model} from '@airma/react-state';

const counting = model(function countingModel(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
    };
}).createStore();

......
const Increase = memo(()=>{
    // API useSignal 返回一个 signal 回调函数，用于获取最新的库存实例对象。
    // 当且仅当获取自该实例的字段值发生改变时才会触发组件的再渲染。
    // 因为 `increase` 字段值是行为方法，根据行为方法恒定不变的特性，该组件不会因为 counting.useSignal() 进行再渲染。
    const signal = counting.useSignal();
    return <button onClick={signal().increase}>+</button>;
});

const Count = memo(()=>{
    const signal = counting.useSignal();
    return <span>{signal().count}</span>;
});

const Decrease = memo(()=>{
    const signal = counting.useSignal();
    return <button onClick={signal().decrease}>-</button>;
});

const Component = function Comp({defaultCount}:{defaultCount:number}) {
    // 在不调用 useSignal 返回的 signal 函数时，只做初始化工作，不会造成该处组件的再渲染，从而提升渲染性能。
    counting.useSignal(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

除了性能提升, useSignal 还提供了针对实例行为副作用的处理方法，可参考引导中的[高性能渲染](guides?id=高性能渲染)部分了解更多相关信息。

## 介绍

作为一款融合了**面向对象**与**函数式编程**两种不同风格的 react 状态管理工具，**@airma/react-state** 提供了**组件本地库**、**动态库**、**静态库** 三种不同的库状态管理方案，让状态管理变得更方便，更灵活；而[模型](concepts?id=模型)函数中渲染数据与状态数据分离的设计模式，允许使用者按需设置私有状态，让模型实例更安全，更规范，更易于维护。

### 模型是如何工作的？

在 **@airma/react-state** 中，[模型](concepts?id=模型)是指一个通过以状态为参数，以返回对象为实例的函数。 当调用实例对象（来自库）方法时，会产生一个新状态，该状态会被行为方法包装成一个 action，并通过 MiddleWare 的筛选，最后分发至库。库会使用新状态和模型生成一个新实例，并通知订阅者同步新实例（组件重渲染）。

其工作原理就是一次多阶状态更新的过程，行为方法提供第一层模型状态的更新，模型状态的更新引发实例（可以把实例也理解成状态）的更新。

### 为什么要支持动态库管理模式？

动态库有很多全局静态库不具备的先天优势。

1. 持有动态库的组件在元素化（React.createElement）后可为每个元素生成模型相同，状态和实例均不相同，且互不干扰的动态库。
2. 动态库由创建组件元素（Element）生成或销毁。

动态库依靠 Provider 组件生成寄生于元素内部的库，这个过程是在 Provider 元素化（React.createElement(Provider, keys)）过程中进行的，故每个元素必然持有不同的库，这些库的状态和实例互不干扰；当 Provider 元素销毁（unmount）时，可以自动销毁这些动态库。

```ts
import {model, provide} from '@airma/react-state';

type UserState  = {
    id: number;
    name: string;
    editable: boolean;
}

const userKey = model(function userModify(state: UserState){
    return {
        ...state,
        changeName:(name: string)=>({...state, name}),
        startEdit(){
            return {...state, editable: true};
        },
        endEdit(){
            return {...state, editable: false};
        }
    };
}).createKey();

const NameInput = ()=>{
    // 通过键链订阅由该键生成的库，并获取库实例字段
    const name = userKey.useSelector(i=>i.name);
    const changeName = userKey.useSelector(i=>{
        return i.changeName;
    });
    return (
        <input 
            type="text" 
            value={name} 
            onChange={changeName}
        />
    )
}

// 通过 provide 提升动态库维护组件
const User = provide(userKey).to(({value}:{value: UserState})=>{
    // 在render过程中初始化动态库的默认状态
    userKey.useSignal(value);
    return (
        <div>
            <NameInput />
            ......
        </div>
    );
});

const UserList = ({users}:{users:UserState[]})=>{
    return (
        <>
        {
            /** 每个 User 组件元素的库互不干扰 **/
            users.map((user)=>(
                <User 
                    value={user} 
                    key={user.id.toString()} 
                />
            ))
        }
        </>
    );
}
```

动态库就是模型[键](concepts?id=键)在组件元素化过程中创建的库，理解基础概念键，有助于更好地理解动态库。

#### 如何跨 Provider 订阅共享状态？

与原始 React.Context.Provider 系统不同的是，不同层级的 [Provider](api?id=provider) 组件元素可形成一颗至近及远，至下及上的库查找树。因此不存在类似 React.Context.Provider 被同类型 Context.Provider 阻拦的问题。

#### 共享状态变更是否会引起整个 Provider 组件重新渲染？

`@airma/react-state` 是通过库的 subscribe 函数订阅状态变更，并通过 useState 进行状态同步的。在 `useModel` 或 `useSelector` 接收到订阅数据变更后会通过 setState 来渲染当前组件。因此，除了使用库的组件及子组件，其他组件不会随库状态变更进行再渲染。

### 为什么不支持模型的异步状态管理？

异步状态管理往往涉及闭包旧数据问题，因此，采用更专业的异步状态管理工具是非常必要的，这里推荐 [@airma/react-effect](/zh/react-effect/index)。如果希望自行控制异步操作，可使用 model(xxx).produce API 自行组合。

通过 model(xxx).produce API 可通过调用实例对象加工出模拟异步状态模拟实例。

```ts
import {memo} from 'react';
import {model} from '@airma/react-state';

const fetchSettingStep = ():Promise<number> =>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(2);
        }, 300)
    });
}

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
    // 通过调用实例对象加工模拟实例对象
}).produce((getInstance)=>{
    // getInstance 函数可用来获取最新库存实例
    const instance = getInstance();
    // 返回支持异步状态管理的模拟实例对象
    return {
        ...instance,
        // 组装异步行为函数
        async increaseBySetting(){
            const step = await fetchSettingStep();
            // 使用 getInstance 函数获取最新库存实例
            return getInstance().add(step);
        },
        async decreaseBySetting(){
            const step = await fetchSettingStep();
            return getInstance().add(-step);
        }
    }
}).createKey(0);

......
const Increase = memo(()=>{
    // 在使用 model(xxx).produce 产生模拟实例后，
    // useSignal/useModel/useSelector 均只能返回模拟实例对象
    const signal = countingKey.useSignal();
    const {increaseBySetting} = signal();
    return <button onClick={increaseBySetting}>+</button>;
});
const Count = memo(()=>{
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const {decreaseBySetting} = countingKey.useModel();
    return <button onClick={decreaseBySetting}>-</button>;
});

const Component = provide(countingKey).to(function Comp() {
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

## 安装与支持

当前工具的可运行包维护在[npm](https://www.npmjs.com/get-npm)官方服务器。可运行如下命令获取最新的稳定版本。

### 安装命令

```
npm i @airma/react-state
```

### 浏览器支持

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

下一节[概念](concepts)