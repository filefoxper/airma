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

[model](/zh/react-state/api?id=model) 声明式 API，可更清晰地表现出函数将被作为模型的意图。

### 本地状态管理

```ts
import {model} from '@airma/react-state';

// 通过 model API 声明模型，可获取模型相关的常用 API集合。
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
// 通过 model(xxx).useModel 的方式使用 useModel API。
const {count, increase, decrease, add} = counting.useModel(0);
......
```

除了类似 React.useReducer 的本地状态管理方案，API 还提供了采用 React.Context 动态技术和全局静态技术的**库状态管理**方式。

### React.Context 动态库

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
// model(modelFn).createStore(defaultState) 可创建动态库，
// 并预设库的默认状态。
......
const Increase = memo(()=>{
    // countingStore.useSelector 可重组库模型实例的字段。
    // 若库存状态更新前后，重组结果发生变化，则触发当前组件渲染。
    // 注意，模型实例对象中的行为方法是恒定不变的。
    // 当前组件选取的 increase 是一个行为方法，
    // 所以无论库状态如何更新，useSelector 都不会触发当前组件再渲染。 
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // countingStore.useModel 会随库存状态的变更重渲染当前组件。
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// 使用动态库的 provideTo 方法，可建立一个 Provider 级的本地状态库，并为子组件提供访问该本地库的环境。
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

注意，通过 createStore 创建的**动态库**并非传统意义上的库，而是包装成库形态的[键](/zh/react-state/concepts?id=键)，键是 Provider 组件用于创建**本地库**的模型，只有本地库才具备存储维护状态的能力。动态库的 provideTo 方法可为参数组件提供一个具备本地库环境的 Provider 组件外包装，这时在参数组件内部使用动态库提供的 useModel/useSelector 就可以连接上当前 Provider 外包组件的本地库了。

### 全局静态库

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
// 使用动态库的 asGlobal 方法，可创建一个全局静态库。
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
// 全局静态库是真正意义上的库，不需要 provideTo
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

与 React.Context 动态库不同，全局静态库是真正意义的库，其本身维护了实例和状态，在使用上会更加简单，不需要使用 Provider 外包装组件。

当然，如其他静态库状态管理工具一样，选用静态库来管理组件状态虽然简单，却会遇到一些特定的麻烦，具体可参考 [为什么要支持 React.Context 库管理模式](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？) 中的内容。

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
// 可创建一个无默认状态的动态库
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

相较 redux、zustand 等静态库而言，`@airma/react-state` 可在 render 运行时初始化默认状态是其特有的能力，该能力在动态库管理过程中非常实用。

## 介绍

作为一款融合了**面向对象**与**函数式编程**两种不同风格的 react 状态管理工具，`@airma/react-state` 提供了**组件级**、**React.Context 动态库级**、**全局静态库级** 三种不同层次的状态管理方案，让状态管理变得更加方便灵活；而[模型](/zh/react-state/concepts?id=模型)函数中渲染数据与状态数据分离的设计模式，允许使用者按需设置私有状态，让模型实例更安全，更规范，更易维护使用。

### 模型是如何工作的？

在 `@airma/react-state` 中，[模型](/zh/react-state/concepts?id=模型)是指一个返回实例对象的函数。 [useModel](/zh/react-state/api?id=usemodel) API 通过调用该函数可得到一个模型实例对象。调用实例对象上的行为方法可产生一个新状态，系统会使用新状态作为参数再次调用模型函数，从而实现刷新实例对象，渲染组件的功能。

### 为什么要支持 React.Context 库管理模式？

React.Context 动态库有很多全局静态库不具备的先天优势，如：相同的动态库可通过不同的 Provider 生成不同的本地库、本地库存的状态随 Provider 组件的销毁而销毁，相当于一个天然的状态销毁重置能力。

静态库做不到场景：

1. 对使用了库的组件，动态创建或删除其对应的元素（React.Element），且要求每个元素的库状态数据互不干扰。
2. 组件元素（React.Element）销毁时重置库状态，如页面的部分刷新功能。

动态库依靠 Provider 组件生成可维护的本地库，这个过程是在 Provider 元素化（React.createElement(Provider, keys)）的过程中进行的，故每个元素必然对应不同的本地库，且这些库中的状态数据或不干扰；当 Provider 元素销毁（unmount）时，自然就可以自动销毁本地库状态了。

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
    // 通过动态库链接访问本地库的实例字段
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

动态库其实是[键](/zh/react-state/concepts?id=键)的库状表现形式，理解基础概念键，有助于更好地理解动态库。

#### 如何跨 Provider 订阅共享状态？

与原始 React.Context.Provider 系统不同的是，不同层级的 [Provider](/zh/react-state/api?id=provider) 组件元素可形成一颗支持至近及远，至下往上遍历查找连接的 **Provider 树**。因此不存在类似 React.Context.Provider 被同类型 Context.Provider 阻拦的问题。

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