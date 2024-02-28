[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

`@airma/react-state` 是一款基于模型对象，类似于 redux 的状态管理工具，通过调用行为方法进行事件分发，改变模型状态。

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

`model` API 优化了 `React.useReducer` 的使用方式，更便于管理复杂行为状态。除了与 `React.useReducer` 一样出色的本地状态管理功能，`model` API 还支持 `React.Context` 共享状态管理模式和全局共享状态管理模式。

### React.Context 动态库管理

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
// model(modelFn).createStore(defaultState) 可创建一个 动态库 store，
// 并预设库存模型实例的默认状态 defaultState。
......
const Increase = memo(()=>{
    // store.useSelector 可用于重选库模型实例的有用字段,
    // 当选出的字段值发生改变，即可触发组件再渲染。
    // 当前组件重选出一个模型实例方法，
    // 模型实例方法是稳定不变的，所以该组件不会发生再渲染。
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // store.useModel 可直接共享来自库的状态变更。
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// 通过 store 的 provideTo 高阶组件方式，可为子组件提供一个 `React.Context` 库共享环境，即 Provider 外包装组件。
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

注意，`store` 动态库并不负责维护模型实例状态，它并不是传统意义上的静态库。模型实例状态是维护在由 `provideTo` 生成的 [Provider](/zh/react-state/api?id=provider) 组件元素（Element）中的。每个由 `Provider` 组件生成的 React 元素内存放着各自`不同`的库存模型实例，每个 `Provider` 组件元素的库存实例随当前元素的销毁而销毁。关于库存实例的跨域查找，及支持 React.Context 共享模式的原由可参考 [为什么要支持 React.Context 共享状态模式](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？) 中的内容。

### 全局静态库管理

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
// 通过简单调用 store 对象的 asGlobal 方法，可创建一个全局共享库。
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
// 全局共享库不需要 provideTo 即可全局使用
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

相比 `React.Context` 状态共享模式，全局状态共享在使用上会更加简单，但也会遇到各种其他全局状态共享库共同的问题，可参考 [为什么要支持 React.Context 共享状态模式](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？) 中的内容。

### render 运行时设置默认状态

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
// 可创建一个无默认状态库
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
    // 在 render 运行时初始化库存模型实例的默认状态。
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

相对其他状态共享库静态初始化默认状态的方式，`@airma/react-state` 可在 render 运行时初始化库存实例默认状态的能力显得特别实用。

## 介绍

作为一款 `redux` 升级版状态管理工具，`@airma/react-state` 提供了 `本地状态管理`、`React.Context 局部共享状态管理`、`全局共享状态管理` 三种方式，让状态管理变得更灵活，更便捷；而模型实例可保护部分状态的私有化，从而优化了使用渲染数据接口，方便后续维护。

### 模型是如何工作的？

在 `@airma/react-state` 中，[模型](/zh/react-state/concepts?id=模型) 是指一个返回实例对象的函数。 [useModel](/zh/react-state/api?id=usemodel) API 通过调用该函数可得到一个模型实例对象。调用实例对象方法可产生一个新状态值，系统会使用该值作为参数再次调用模型函数，从而刷新实例对象，并造成再度渲染。

### 为什么要支持 React.Context 库管理模式？

`React.Context` 区块化状态共享有很多全局共享不具备的优点，如限定状态共享的范围、共享库的生成和销毁可随 `Context.Provider` 组件元素的加载和卸载动态进行。

场景：

1. 构建一个内部层次较深的复杂组件，该组件在使用场景中允许同时产生多个 react 元素（Element）实例，且元素状态互不影响。
2. 组件元素（Element）销毁时重置库状态，这可以避免很多不必要的问题。

通过使用 `model(modelFn).createStore(defaultState)` 可创建一个`动态库 store` 。`store.provideTo(Component)` 产生一个使用 [Provider](/zh/react-state/api?id=provider) 包囊 Component 的高阶组件。该高阶组件负责将动态库 store 映射成 Provider 组件内部的`本地库`，并提供可通过动态库 store 访问本地库的 React.Context 内部环境。

```ts
import {model} from '@airma/react-state';

type User = {
    id: number;
    name: string;
    editable: boolean;
}

const userModifyStore = model(function userModify(state: User){
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
}).createStore();

const NameInput = ()=>{
    // 通过动态库链接访问本地库
    const name = userModifyStore.useSelector(i=>i.name);
    const changeName = userModifyStore.useSelector(i=>{
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

// 通过动态库 userModifyStore 生成本地库
const User = userModifyStore.provideTo(({value}:{value: User})=>{
    // 通过动态库初始化本地库默认状态
    userModifyStore.useModel(value);
    return (
        <div>
            <NameInput />
            ......
        </div>
    );
});

const UserList = ({users}:{users:User[]})=>{
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

动态库其实是[键](/zh/react-state/concepts?id=键)的库状表现形式，理解基础概念键，有助于更好的理解动态库。

#### 如何跨 Provider 订阅共享状态？

`@airma/react-state` 的 `Provider` 组件群可形成一个树状结构的动态库查找系统。库的查找是至近及远，至下往上遍历 Provider 库的过程。所以即便有其他非当前使用库提供者（Provider）的拦截，也一样可以顺利通过 API useModel、useSelector 查找到最近的库。

#### 共享状态变更是否会引起整个 Provider 组件重新渲染？

`@airma/react-state` 是通过订阅状态变更的方式，进行状态同步的。在 `useModel` 或 `useSelector` 接收到订阅数据变更后会进行 setState 处理来渲染当前使用组件。因此，除了使用库的组件及子组件，其他组件不会随库状态变更进行再渲染。

### 为什么不支持异步状态管理？

异步状态管理往往涉及闭包旧数据问题，因此，采用更专业的异步状态管理工具是非常必要的，这里推荐 [@airma/react-effect](/zh/react-effect/index)。

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