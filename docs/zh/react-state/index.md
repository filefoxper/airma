[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

`@airma/react-state` 是一款融合了**面向对象**与**函数式编程**两种不同风格的 react 状态管理工具。其工作原理接近 redux，却采用了更自然的**方法调用**方式来分发行为事件（dispatch action）。

## 使用方式

```ts
import {useModel} from '@airma/react-state';

const instance = useModel(
    // 模型
    (count:number)=>({
    // 渲染数据
    count,
    isNegative: count<0,
    // 行为方法，用来生成行为发生后所处的状态
    increase:()=> count + 1,
    decrease:()=> count - 1
}),0); // 默认状态 0

const {
    count, 
    isNegative,
    // 调用行为方法，触发状态更新
    decrease, 
    increase
} = instance; // 模型实例
```

以类 reducer 的函数为核心可创建了一个状态管理对象。该函数被称作[模型](/zh/react-state/concepts?id=模型)（model），创建的对象为**模型实例**。调用模型实例上的行为方法可触发状态更新。

[model](/zh/react-state/api?id=model) 声明式 API 提供了一种更加便捷的使用方案，同时明确了函数作为模型的作用。

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

并不是所有使用了 Context 技术的库都是动态库。所谓的动态库是指在组件首次**实例化** (Component->Element) 过程中，建立在组件实例内部的库，库组件的子组件可以通过 Context 技术同步库中的状态。因此，一个提供了动态库的组件，其不同实例所持有的库是互相独立，互不干扰的，且库对象会随着组件实例的销毁而销毁。

@airma/react-state 提供了**模型键**的方案解决了上述需求。

```ts
import {memo} from 'react';
import {model, storeCreation} from '@airma/react-state';

const countingKey = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createKey(0);
// model(modelFn).createKey(defaultState) 可创建模型键，
// 并预设通过该键建立动态库持有的默认状态。
......
const Increase = memo(()=>{
    // countingKey 模型键可用于同步库状态 
    const increase = countingKey.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // countingKey 模型键可用于同步库状态 
    const {count} = countingKey.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingKey.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// storeCreation(...keys).for(Component) 高阶组件，可将自定义组件提升为一个持有动态库及相关 Provider 的组件
const Component = storeCreation(countingKey).for(function Comp() {
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

注意，通过 **model(modelFn)createKey** 创建的**键**并非传统意义上的[模型键](/zh/react-state/concepts?id=键)，而是模型键的包装，含有与键相关的常用 API。

storeCreation 的实际作用是创建了一个可通过模型键盘建立动态库的 Provider 组件。因此，以上代码等同于：

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
// 直接使用 Provider 组件也可以达到预期效果
const Component = function Comp() {
    return (
        <Provider keys={countingKey}>
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

与动态库不同，静态库是一个外部常量，库状态维护在组件外部，所有连接该库的任意组件的实例获取到的状态是完全同步的，且不需要 Context 技术干预。静态库不会销毁。

@airma/react-state 提供了**模型库**的方案解决了上述需求。

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createStore(0);
// 使用 createStore 可建立一个静态库，并提供默认状态
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

### render 运行时设置默认状态

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: state,
        increase:()=>state + 1,
        decrease:()=>state - 1
    };
}).createStore();
// 使用 createStore 可建立一个无默认状态的静态库
// 注意 createKey 也允许建立无默认状态键，也可以在 render 时设置默认状态
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
    // 在 render 运行时初始化库存模型实例的默认状态。
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

相较 redux、zustand 等静态库而言，`@airma/react-state` 在 render 运行时初始化默认状态会更简单。

根据 `useModel` 的固有特性，无论是否使用其返回的实例对象，只要该实例发生变更必然造成组件的重渲染。为了避免不必要的渲染，自 `v18.4.0` 开始，`@airma/react-state` 推出了 [useSignal](/zh/react-state/api?id=usesignal) API 来解决该问题。

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
    // API useSignal 返回一个 signal 回调函数，用于获取最新的模型实例对象。
    // 当且仅当获取自该模型实例的字段值发生改变时才会触发组件的再渲染。
    // 因为 `increase` 字段值是行为方法，根据行为方法恒定不变的特性，该组件不会产生再渲染。
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

除了性能提升, useSignal 还提供了针对实例变更渲染副作用和监听的入口方法，可参考引导中的[高性能渲染](/zh/react-state/guides?id=高性能渲染)部分了解更多相关信息。

## 介绍

作为一款融合了**面向对象**与**函数式编程**两种不同风格的 react 状态管理工具，`@airma/react-state` 提供了**组件级**、**动态库级**、**静态库级** 三种不同层次的状态管理方案，让状态管理变得更方便，更灵活；而[模型](/zh/react-state/concepts?id=模型)函数中渲染数据与状态数据分离的设计模式，允许使用者按需设置私有状态，让模型实例更安全，更规范，更易于维护。

### 模型是如何工作的？

在 `@airma/react-state` 中，[模型](/zh/react-state/concepts?id=模型)是指一个通过使用状态参数返回实例对象的函数。 当调用实例对象提供的行为方法时，可产生一个新状态，根据新状态再次调用模型，可产生一个新实例，进而实现渲染组件的功能。

其工作原理就是一次多阶状态更新的过程，行为方法提供第一层模型状态的更新，模型状态的更新引发实例（可以把实例也理解成状态）的更新。

### 为什么要支持动态库管理模式？

动态库有很多全局静态库不具备的先天优势。

1. 动态库的持有组件实例（Element）化后可产生模型相同，但互不干扰的动态库。
2. 动态库可随其持有组件实例（Element）销毁。

动态库依靠 Provider 组件生成可维护的本地库，这个过程是在 Provider 元素化（React.createElement(Provider, keys)）的过程中进行的，故每个元素必然对应不同的本地库，且这些库中的状态数据互不干扰；当 Provider 元素销毁（unmount）时，可以自动销毁这些本地库的状态。

```ts
import {model, storeCreation} from '@airma/react-state';

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
    // 通过键链接访问本地动态库的实例字段
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

// 通过 storeCreation 提升动态库组件
const User = storeCreation(userKey).for(({value}:{value: UserState})=>{
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
            /** 每个 User 的本地库互不干扰 **/
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

动态库就是[键](/zh/react-state/concepts?id=键)在组件初始化过程中创建的库，理解基础概念键，有助于更好地理解动态库。

#### 如何跨 Provider 订阅共享状态？

与原始 React.Context.Provider 系统不同的是，不同层级的 [Provider](/zh/react-state/api?id=provider) 组件元素可形成一颗至近及远，至下而上的库查找树。因此不存在类似 React.Context.Provider 被同类型 Context.Provider 阻拦的问题。

#### 共享状态变更是否会引起整个 Provider 组件重新渲染？

`@airma/react-state` 是通过库的 subscribe 函数订阅状态变更，并通过 useState 进行状态同步的。在 `useModel` 或 `useSelector` 接收到订阅数据变更后会进行 setState 处理来渲染当前使用组件。因此，除了使用库的组件及子组件，其他组件不会随库状态变更进行再渲染。

### 为什么不支持异步状态管理？

异步状态管理往往涉及闭包旧数据问题，因此，采用更专业的异步状态管理工具是非常必要的，这里推荐 [@airma/react-effect](/zh/react-effect/index)。如果希望自行控制异步操作，可使用 useSelector API 组合使用。

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

下一节[概念](/zh/react-state/concepts)