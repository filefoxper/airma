# 引导

从技术上来说 React 状态可分为`本地状态`和`上下文状态`两种形式。

## 本地状态

本地状态是指由组件自身维护，并只能通过 props 传递给父子组件的数据。我们常使用 `React.useState` 或 `React.useReducer` 进行状态管理工作。而这两个原生 API 需要使用者对 React 数据管理有更深入的理解，否则会在开发过程中碰到一些小麻烦，我们将会在[特性](/zh/react-state/feature)篇介绍它们，这里我们还是从设计的角度分析 `useModel` 和 `useState` 各自的优劣势。

### 可组合性分析

我们以一个数据分页需求为例，分别使用 `useState` 和 `useModel` 开发一个 `customized hook`。

在开始实现前，先定义好最终需要实现的接口是个好习惯，无论使用哪种技术，这种习惯都能帮助你快速建立一个虚拟模型。

```ts
// type.ts
export interface Navigation<T> {
    // 当前页码对应的列表数据
    datasource: T[];
    // 当前页码
    page: number;
    // 每页记录限定条数
    pageSize: number;
    // 当前所有记录条数
    totalElement: number;
    // 一个修改分页信息的行为方法
    changePage(p:number, s:number):any;
}
```

#### 使用 useState 构建

让我们先使用我们最熟悉的 `useState` API 进行快速构建。

```ts
// useState.ts
import {useState, useEffect} from 'react';
import _ from 'lodash';

// 这是一个非常简单的数据分页自定义 hook，
// 使用 useState 非常方便。
// 我们需要使用者为 hook 提供一个待分页数据列表 source
export function useNavigation<T>(source:T[]):Navigation<T>{
    // 设置页码
    const [page, setPage] = useState(1);
    // 设置每页限定条数
    const [pageSize, setPageSize] = useState(10);
    // 截取当前页码对应的显示列表数据
    const datasource = _.chunk(source, pageSize)[page - 1];
    
    useEffect(()=>{
        // 当待分页数据列表有变化时，
        // 我们需要将 page 重置为 1，
        // 这类似于点击查询按钮，进行重新查询的场景
        setPage(1);
    },[source]);

    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        changePage:(p:number, s:number) => {
            // 目前比较流行的 React ui 库中，
            // 分页组件的 change 回调，通常同时回传
            // p 当前页码，s 每页限定条数。
            setPage(p);
            // 因为我们使用分布式 useState 设计，导致我们需要多次 setState,
            // 这并不是一件好事。
            setPageSize(s);
        }
    }
}
```

就如之前所谈，`setState` 并不利于测试。而过于分散的 `useState` 也把数据之间的羁绊给隔离开了，这导致我们很难统筹预测行为方法该产生哪些数据变化。

#### 使用 useModel 构建

使用模型与分布式状态管理最大的不同在于，模型需要统一维护状态，因此，将模型函数抽取出来是个不错的 idea。

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';

// 我们将所有会影响到最终结果的可变条件抽取成状态类型，
// 并称其为 changes
export type Changes<T> = {
    source: T[];
    page: number;
    pageSize: number;
};

// 统一建立模型初始状态
export function defaultState<T>(source:T[]):Changes<T> {
    return {source, page: 1, pageSize: 10};
};

// 抽取纯函数模型，
// 这非常利于单元测试和统筹预测状态这些工作。
// 可以将 changes 状态理解为模型的变量，
// 当变量改变时，重新运行模型函数，刷新实例。 
export function navigation<T>(changes: Changes<T>){
    const {source, page, pageSize} = changes;
    // 我们所需的渲染状态应该通过 changes 加工而来
    const datasource = _.chunk(source, pageSize)[page - 1];
    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        // 通过 return 一次性更新模型变量
        changePage(p:number, s:number):Changes<T>{
            return {...changes, page:p, pageSize:s};
        },
        // 因为外部变量 source 也是可变的，
        // 所以我们需要为其清晰地描述一个行为方法。
        updateSource(s:T[]):Changes<T>{
            // 根据需求，我们需要在 source 更新时将 page 设置为 1
            return {...changes, source:s, page:1}
        }
    }
}

export function useNavigation<T>(source:T[]):Navigation<T>{
    const {
        updateSource,
        ...rest
    } = useModel(navigation, defaultState(source));

    // 这里我们使用 react-state API useRefresh 来更新数据，
    // useRefresh 相当于 useEffect(()=>updateSource(source), [source])
    useRefresh(updateSource, [source]);

    return rest;
}
```

虽然初看会觉得使用模型要比分布式 `useState` 稍微复杂一些，但事实上模型更善于处理这种复杂的状态结构。我们可以很容易地区分哪些是变量状态，哪些是渲染数据，然后根据变量状态提供一分详细的行为方法。详细的行为方法非常重要，这可以让其他维护者轻松了解模型功能。

如果上述例子没有展现出 `useModel` 的高级优势，那么，接下来让我们使用功能组合来对比 `useState` 和 `useModel`。

### 组合性

现在我们需要在已实现的分页功能上添加按字段排序功能，要求排序时，不改变页码和每页限定记录数。

为了预先确认目标，我们依然以设计返回类型开头。

```ts
// type.ts
import {Navigation} from './nav/type'

type SortNavigation<T> = Navigation<T> & {
    // 排序字段
    field: null | keyof T,
    // 顺序
    order: 'desc' | 'asc',
    // 排序行为方法
    sort(field: null|keyof T, order: 'asc'|'desc'):any
};
```

#### 使用 useState 组合

我们根据 hook 的组合特性，通过调用 useNavigation 来组成满足需求的新 hook `useSortNavigation`。

```ts
import {useState, useMemo} from 'react';
import _ from 'lodash';
import {useNavigation} from './nav/hook';

export function useSortNavigation<T>(source:T[]){
    const [order, setOrder] = useState<'desc'|'asc'>('desc');
    const [field, setField] = useState<null|keyof T>(null);
    // 排序待分页数据列表
    const sortedSource = useMemo(()=>{
        return field?_.orderBy(source, [field], [order]) : source;
    },[source, order, field]);

    // 对排序后的数据使用 useNavigation，
    // 我们发现，每次排序时，页码总是被重置为 1，
    // 这并不符合需求，我们需要对原来的 useNavigation 进行修改，
    // 以满足我们的新需求。
    const data = useNavigation(sortedSource);
    return {
        ...data,
        field,
        order,
        sort(field: null|keyof T, order: 'asc'|'desc'){
            setField(field);
            setOrder(order);
        }
    };
}
```

我们发现使用 hook 组合方式需要我们修改已经稳定的被组合 hook，以满足我们的需求。为了满足新需求，不断修改已稳定的原始方案，是不合理的。究其原因，hook 系统拥有很多非状态更新作用的 API 成员，这些 API 的使用造成的副作用不利于组合。是的，你没猜错，这里指的就是在内部的 `useEffect`，我们需要在一开始就把它分离出去，以保证状态更新逻辑是干净的，无干扰的。但要在毫无限制（底线）的状况下要想到这点很难。让我们来看看，状态逻辑更加纯净的`模型`会怎么做。

#### 使用 useModel 组合

作为拥有稳定输入输出函数的模型更利于组合。

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';
import {navigation, defaultState} from './nav/hook';
import type {Changes} from './nav/hook';

// 定义我们的新状态
interface SortChanges<T> extends Changes<T> {
    order: 'desc'|'asc',
    field: null | keyof T
}

// 生成默认的新状态
function defaultSortState<T>(source:T[]):SortChanges<T>{
    const onlyPages = defaultState(source);
    return {...onlyPages, order:'desc', field:null};
}

// 新模型
function sortNavigation<T>(changes:SortChanges<T>){
    const {order, field, source, ...rest} = changes;
    const sortedSource = field? 
            _.orderBy(source, [field], [order]) : 
            source;
    // 我们只要引用旧模型即可实现不修改原模型的组合。
    // 因为在原模型中并不能包含 useEffect 这样的副作用 API
    const nav = navigation({...changes, source:sortedSource});
    return {
        ...nav,
        order,
        field,
        // 添加排序行为
        sort(field: null|keyof T, order: 'asc'|'desc'):SortChanges<T>{
            // 当调用 sort 行为方法时，source 并不会被修改，
            // 所以外部的 useRefresh(updateSource, [source]) 不会运行，
            // page 也就不会被重置为 1。
            // 补充：
            // 如果我们的需求是排序后页码需要重置为 1 的话，
            // 只要在 return 对象中添加 page: 1 即可。
            return {...changes, field, order};
        }
    }
}

export function useSortNavigation<T>(source:T[]):Navigation<T>{
    const {
        updateSource,
        ...rest
    } = useModel(sortNavigation, defaultSortState(source));

    // 当 source 改变时，页码依然会重置为 1，
    // 这是 updateSource 行为方法做的事。
    useRefresh(updateSource, [source]);

    return rest;
} 
```

因为组合涉及类型问题，我们需要对原模型的 Changes 做出修改，以支持更加公共化的组合需求。

```ts
// 我们使用类型继承的方式进行了改造
function navigation<T, C extends Changes<T>>(changes: C)
```

另外，在使用 `useModel` 组合的过程中，我们厚颜无耻的复制了一份原始的 hook 逻辑，并做出了修改，但这些一次性不影响原逻辑的小当量修改又有什么关系呢？

### 受控模型

受控模型的`受控`概念来源于 react 受控组件。当我们构建 react 子组件时，往往需要使用来自父组件传递 props 中的 `value` 和 `onChange` 做简单的输入输出接驳工作，这时，我们希望直接使用 `value` 作渲染，使用 `onChange` 作对外的状态提交，我们不需要再维护一份 `state` 状态进行复杂的监听同步。

在实际应用中，有很多模型逻辑是可以在受控与非受控之间互用的，但很可惜，通常我们接触到的工具都不具备这方面的能力。`@airma/react-state` 给出了以模型为单位的解决方案 `useControlledModel`。

下例是一个多选模型，该模型通过 toggle 反状态行为修改 selected 数组中的选中值。

```ts
// 这是一个支持反选的多选模型
// selected 状态为当前选中数组
export function selection<T>(selected:T[]){
    return {
        selected,
        toggle(toggled:T){
            // 对 toggled 对象进行反选操作。
            // 如 selected 中包含该值，则把它移出选中数组
            if(selected.includes(toggled)){
                return selected.filter((d)=>d!==toggled);
            }
            // 反之，则加入选中数组
            return selected.concat(toggled);
        }
    }
} 
```

非受控行为：

```ts
import {useModel} from '@airma/react-state';
import {selection} from './model';

export function useSelection<T>(){
    // useModel 维护了一个本地私有状态
    const {selected, toggle} = useModel(selection,[]);
    return [selected, toggle];
}
```

受控行为：

```ts
import {useControlledModel} from '@airma/react-state';
import {selection} from './model';

export function useControlledSelection<T>(
    value:T[],
    onChange:(selected:T[])=>any
){
    // 当我们需要在一个受控组件中使用该模型时，
    // 只要把 useModel 替换成 useControlledModel，
    // 并接入 value, onChange 即可。
    const {selected, toggle} = useControlledModel(
        selection,
        value,
        onChange
    );
    return [selected, toggle];
}

export function useComposite(){
    const [selected, setSelected] = useState([]);
    return useControlledSelection(selected, setSelected);
}
```

API `useControlledModel` 可以把 `useModel` 使用的非受控模型接入一个受控环境。

## 上下文状态

React 上下文状态是指利用 `React.Context` 技术，在 `Context.Provider` 范围内使用 `useContext` 获取父组件状态的方式。

目前很多状态管理工具都只提供了全局上下文状态管理模式，将 store 库维护在一个全局常量中。经过大量实践，我们发现全局上下文状态并不利于组织和复用组件。如：一个可复用复杂组件为了解决深层子组件获取顶层状态问题，使用了全局 store 来维护私有上下文状态，当我们需要在同一页面的不同区域多次复用该组件时，我们发现这些组件实例的上下文状态是始终同步的，很难对它们进行上下文作用域隔离。

`@airma/react-state` 提供了一套将上下文状态库维护在 `Provider` 组件实例中的思路。使用者向 `Provider` 提供全局的键，由 `Provider` 按键生成存放状态库（事实上 [StoreProvider](/zh/react-state/api?id=storeprovider) API 组件实例中存放的是使用键[模型](/zh/react-state/concepts?id=模型)生成的[链接](/zh/react-state/concepts?id=链接)）。

这种做法，相当于把上下文状态的作用域重新交给了使用者，而非大一统提供了一个全局库。通过控制 `Provider` 的位置，我们可以很容易拿捏上下文状态的作用范围。

### 键

 [createKey](/zh/react-state/api?id=createkey) API 可以把模型包装成`键`。`键`也是模型，`键`模型是`被包装模型`的复刻，它的入参返回类型与`被包装模型`保持一致，但却拥有生成及连接`库`的能力。

 ```ts
 // global/model.ts

 import { 
    createKey 
} from '@airma/react-state';
 import type { User, Config } from './type';

// 当前登陆用户信息模型
 const currentUserModel = (user: User | null)=>{
    return {
        user,
        login(currentUser: User){
            return currentUSer;
        },
        logout(){
            return null;
        }
    }
 }

 // 系统配置信息模型
 const systemConfigModel = (config: Config = {})=>{
    return {
        config,
        updateConfig(key: string, value: string){
            return {...config, [key]: value};
        }
    }
 }

// 使用 createKey 生成 `键`模型，
// 通过 传入第二个参数默认状态 进行预初始化工作
export const currentUserKey = createKey(
    // 被包装模型
    currentUserModel,
    // 默认值
    null
);

// 使用 createKey 生成 `键`模型
export const systemConfigKey = createKey(
    // 被包装模型。
    // 因为模型函数使用了 es6 默认值，
    // 故可以忽略这里的 `默认值` 参数。
    systemConfigModel
);

// `键` 相当于钥匙，
// 我们把多个 `键` 组成对象，就相当于生成了一个钥匙串，
// storeKeys 就是我们的全局配置钥匙串。
export const storeKeys = {
    loginUser: currentUserKey,
    systemConfig: systemConfigKey
};
 ```

`键`有两个重要作用：

1. 提供给 `StoreProvider` 组件，用于生成上下文链接`库` (store)。
2. 提供给 `useModel` 和 `useSelector` 用作打开`库`链接的钥匙。

```ts
import React from 'react';
import {render} from 'react-dom';
import {
    StoreProvider,
    useModel,
    useSelector
} from '@airma/react-state';
import {
    currentUserKey, 
    storeKeys
} from '@/global/model';
import type {User, Config} from '@/global/type';

const Login = ()=>{
    // 使用 `键` currentUserKey 匹配 store，
    // 选取 store 链接中模型实例的行为方法。
    // 调用行为方法刷新库中实例对象，
    // 库链接通知其他同 `键` 使用者同步实例与状态。
    const handleLogin = useSelector(
        currentUserKey, 
        i=>i.login
    );
    return ......;
}

const Header = ()=>{
    // `键` currentUserKey 的其他使用者，
    // 可同步库中匹配的链接实例与状态
    const {
        user, 
        logout
    } = useModel(currentUserKey);
    return ......;
}

const Body = ()=>{
    const {
        config, 
        updateConfig
    } = useModel(storeKeys.systemConfig);
    return ......;
}

const App = ()=>{
    // `键` currentUserKey 的其他使用者，
    // 可同步库中匹配链接的实例状态。
    //
    // 这里我们通过钥匙串访问 `键` currentUserKey，
    // storeKeys.loginUser
    const currentUser = useSelector(
        storeKeys.loginUser,
        ({user})=>user
    );
    return !currentUser? (
        <Login/>
    ) : (
        <div>
          <Header/>
          <Body/>
        </div>
    );
};

render(
    // 使用钥匙串对象创建 库
    <StoreProvider keys={storeKeys}>
      <App/>
    </StoreProvider>
);
```

* API `useSelector` 可通过`键`查找库中对应的`链接`，并使用 selector 回调函数，从`链接`实例中选取当前组件需要的数据或行为方法。当有同`键`使用者触发了实例刷新，useSelector 会根据 selector 筛选函数返回对象值是否发生改变来决定是否需要渲染当前组件。通过使用这个 API，我们可以降低使用组件的渲染频率，从而达到优化组件性能的目的。
* API `useModel` 也可通过`键`查找到库中对应`链接`。与 `useSelector` 不同，`useModel` 始终返回匹配到的完整的`链接`实例对象，并响应每次实例刷新。

### 库

[StoreProvider](/zh/react-state/api?id=storeprovider)组件根据我们提供的`键`模型或`键`模型串（可以是单个`键`模型函数，也可以是由多个`键`组成的 object或数组）生成一个内部的`链接`集合。这个集合被称为`库`。

为 `useModel` 或 `useSelector` 提供正确的`键`模型，可以快速匹配`库`中的链接，并建立同步机制。

或许大家已经注意到，当 `useModel` 联合 `键` 进行上下文同步操作时是不需要`默认状态值`的，因为`默认状态值`已经在创建`键`的时候填写了：`createKey(model, defaultState)`，那如何在组件运行时进行重新初始化操作呢？接下来我们来看一看，`useModel` 如何使用`键`进行运行时初始化操作。

### 初始化

为上下文中的库`链接`进行初始化的方式有两种：

1. 通过 `createKey` API 进行预初始化（`createKey(model, defaultState)`），初始化的实际运行会在 `StoreProvider` 创建库的过程中执行。。
2. 通过 `useModel` API 在 function 组件中进行运行时初始化。

通过 `createKey` API 进行预初始化，只能为`库`中`链接`提供一个写死的常量默认状态，这没什么好说的，这里我们重点介绍使用 `useModel` 在组件中进行运行时初始化。

```ts
import React from 'react';
import { 
    createKey,
    StoreProvider,
    useModel 
} from '@airma/react-state';

// 直接使用默认值初始化
const counterModel = (count: number = 0)=>({
    count,
    isNegative: count < 0,
    increase: ()=>count + 1,
    decrease: ()=>count - 1
});

// 创 `键` 初始化
const counterKey = createKey(counterModel, 0);

const Decrease = ()=>{
    // 运行初始化状态值 2，
    // 因为该组件的加载顺序在 Counter 父组件的 useModel 之后，
    // 而 Counter 组件中的 useModel 将库实例状态初始化成了 1，
    // 所以运行时默认状态已经存在，2 被忽略，
    // 最终库链接中的状态为 1。
    const {decrease} = useModel(counterKey, 2);
    return (
        <button onClick={decrease}>-</button>
    );
}

const Increase = ()=>{
    // 不进行运行时初始化
    const {increase} = useModel(counterKey);
    return (
        <button onClick={increase}>+</button>
    )
}

const Counter = ()=>{
    // 运行时初始化状态 1
    const {count} = useModel(counterKey, 1);
    return (
        <div>
          <Decrease />
          <span>{count}</span>
          <Increase />
        </div>
    );
}

const App = ()=>{
    return (
        <StoreProvider keys={counterKey}>
          <Counter />
        </StoreProvider>
    )
}
```

通过上例分析，我们知道，对 `StoreProvider 库链接` 进行运行时初始化，`链接`状态值是由 `useModel` 的运行顺序决定的。越先运行的 `useModel` 初始化优先级越高。

如果最先运行的 `useModel` 没有初始化，后续的 `useModel` 做了运行时初始化的工作，会发生状态冲突错误吗？

```ts
import React from 'react';
import { 
    createKey,
    StoreProvider,
    useModel 
} from '@airma/react-state';

// 直接使用默认值初始化
const counterModel = (count: number = 0)=>({
    count,
    isNegative: count < 0,
    increase: ()=>count + 1,
    decrease: ()=>count - 1
});

// 创 `键` 初始化
const counterKey = createKey(counterModel, 0);

const Decrease = ()=>{
    // 运行时初始化状态 2，
    // 因为之前没有发生运行时初始化，
    // 所以，初始化后 count 为 2，
    // 初始化成功。
    const {decrease} = useModel(counterKey, 2);
    return (
        <button onClick={decrease}>-</button>
    );
}

const Increase = ()=>{
    // 不进行运行时初始化
    const {increase} = useModel(counterKey);
    return (
        <button onClick={increase}>+</button>
    )
}

const Counter = ()=>{
    // 不进行运行时初始化，
    // 初始默认状态为 0，
    // 由于 Decrease 组件将 count 初始化成 2，
    // 故，此处的 useModel 会触发组件重新渲染将 count 更新为 2
    const {count} = useModel(counterKey);
    return (
        <div>
          <Decrease />
          <span>{count}</span>
          <Increase />
        </div>
    );
}

const App = ()=>{
    return (
        <StoreProvider keys={counterKey}>
          <Counter />
        </StoreProvider>
    )
}
```

也就是说运行时初始化会触发初始化点之前的 `useModel` 进行重渲染更新。我们建议如果需要对`上下文链接状态`使用运行时初始化，请把初始化 `useModel` 放在最先运行区域。

### 实战

我们以一个用户列表查询为例（假分页查询），进行实战演示。为了提高演练的真实性，我们在示例中引用了 [@airma/restful](/restful/index.md) 与 [@airma/react-effect](/zh/react-effect/index.md) 工具库。

老规矩，万事开头皆类型，先为查询功能定义类型。

```ts
// type.ts

// 查询条件
export type Query = {
    username?: string;
};

// 每条数据基本类型
export type User = {
    id: number;
    username: string;
    name: string;
}

// 模型状态
// 即可操作状态数据
export type State = {
    // 页面输入显示的查询条件
    displayQuery: Query;
    // 最近提交的查询条件
    validQuery: Query;
    // 查询获得的 User 列表数据
    source: User[];
    // 当前选中页码
    page: number;
    // 每页限制条数
    pageSize: number;
}
```

定义请求文件。

```ts
// service.ts

// @airma/restful 是一个真实存在的异步请求库 
import { client } from '@airma/restful';
import { Query, User } from './type';

const { rest } = client;

export function fetchSource(query: Query): Promise<User[]>{
    // 获取 User 列表信息的请求
    return rest('/api/user').setParams(query).get<User[]>();
}
```

定义查询页面依赖的本地模型.

```ts
import {createKey} from '@airma/react-state';
import _ from 'lodash';
import type {Query, User, State} from './type';

// 默认值生产方法
const defaultState = (): State => ({
    validQuery: {},
    displayQuery: {},
    source: [],
    page: 1,
    pageSize: 10
});

// 查询页模型
function model(state: State){
    const {source, page, pageSize, displayQuery, validQuery} = state;
    const total = source.length;
    // 对可变状态进行处理，得到当前页展示数据
    const datasource = _.chunk(source, pageSize)[page - 1];
    return {
        displayQuery,
        validQuery,
        page,
        pageSize,
        // 当前页面展示数据
        datasource,
        // 原始数据的总条数
        total,
        // 修改未提交的查询条件
        changeDisplayQuery(displayQuery: Query): State{
            return {
                ...state, 
                displayQuery
            };
        },
        // 提交查询条件
        submit(): State{
            const {displayQuery} = state;
            // 将`未提交查询条件`提交为`最新提交查询条件`，
            // 为什么需要浅克隆？
            // 因为我们希望每次调用 submit 都能触发查询。
            return {...state, validQuery: {...displayQuery}};
        },
        // 更新查询返回结果
        updateSource(users: User[]): State{
            // 因为查询结果来自异步请求，而我们使用的是假分页数据，
            // 所以相当于点击“查询”按钮进行查询返回的结果，
            // 这时，我们需要将当前页码更新为第 1 页
            return {...state, source: users, page: 1};
        },
        // 翻页行为方法
        changePage(p: number, s: number): State{
            return {...state, page:p, pageSize: s};
        }
    }
}

// 创建“键”
export const modelKey = createKey(model, defaultState());
```

我们使用 `createKey` 创建了一个全局`键`，之后用于在 `StoreProvider` 中创建上下文链接库，并在子组件中通过`键`来访问库链接，从而达到实例状态同步的效果。

现在开始构建查询页面。

```ts
// layout.tsx

import React, {memo, useEffect} from 'react';
import {
    StoreProvider,
    useSelector, 
    useRefresh,
    useModel
} from '@airma/react-state';
import {useQuery} from '@airma/react-effect';
import {Input, Button, Table, Pagination} from 'antd';
import {modelKey} from './model';
import {fetchSource} from './service';
import type {Query, User} from './type';

const Condition = memo(()=>{
    // 连接 <StoreProvider keys={modelKey}>
    const {
        displayQuery,
        changeDisplayQuery,
        // 提交查询条件
        submit
    } = useModel(modelKey);

    const handleChangeUsername = (e)=>{
        changeDisplayQuery({username: e.target.value});
    };

    return (
        <div>
            <Input 
                value={displayQuery.username} 
                onChange={handleChangeUsername}
                placeholder="请输入用户名"
            />
            <Button 
              style={{marginLeft:8}} 
              type="primary" 
              onClick={submit}
            >
              查询
            </Button>
        </div>
    );
});

const SourceContent = memo(()=>{
    // 匹配并同步状态与实例
    const {
        validQuery,
        datasource,
        page,
        pageSize,
        total,
        changePage,
        updateSource
    } = useModel(modelKey);

    // 用于查询数据
    const [{isFetching, data: source}] = useQuery(fetchSource, {
        variables: [validQuery],
        // 设置默认查询返回值，以避免 undefined 结果类型
        defaultData: []
    });

    // 使用 useRefresh，通过监听 source 变化，
    // 执行 updateSource(source) 为模型实例更新数据源
    useRefresh(updateSource, [source]);

    return (
        <div>
            <Table
                dataSource={datasource}
                loading={isFetching}
                bordered
                pagination={false}
            >
                <Table.Column title="username" dataIndex="username">
                <Table.Column title="name" dataIndex="name">
            </Table>
            <Pagination 
                current={page} 
                pageSize={pageSize} 
                total={totalElement}
                onChange={changePage}
            />
        </div>
    );
});

export default function Page(){
    // 使用 modelKey 建立链接库
    return (
        <StoreProvider keys={modelKey}>
            <Condition />
            <SourceContent />
        </StoreProvider>
    );
}
```

至此，你已经能使用`@airma/react-state`模型系统进行开发了，如果希望更深入了解该工具，可继续参考[特性](/zh/react-state/feature?id=特性)篇的说明。当然你也可以直接绕过特性，进入 [API](/zh/react-state/api?id=api) 篇做最后参考。