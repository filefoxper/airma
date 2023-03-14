# 引导

从技术上来说 React 状态可分为`本地状态`和`上下文状态`两种形式。

## 本地状态

本地状态是指由组件自身维护，并只能通过 props 传递给父子组件的数据。我们常使用 `React.useState` 或 `React.useReducer` 进行状态管理工作。而这两个原生 API 需要使用者对 React 数据管理有更深入的理解，否则会在开发过程中碰到一些小麻烦，我们将会在[特性](/zh/react-state/feature)篇介绍它们，这里我们还是从设计的角度分析 `useModel` 和 `useState` 各自的优劣势。

### 可组合性分析

我们以一个数据分页需求为例，分别使用 `useState` 和 `useModel` 开发一个 `customized hook`。

在开始实现前，先定义好最终需要实现的接口会是个好习惯，无论使用哪种技术，这种习惯都能帮助你快速建立一个虚拟图形。

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
// 我们需要使用者给我们提供需要被操作的所有数据列表 source
export function useNavigation<T>(source:T[]):Navigation<T>{
    // 设置页码状态
    const [page, setPage] = useState(1);
    // 设置每页限定记录条数状态
    const [pageSize, setPageSize] = useState(10);
    // 使用各种状态条件截取当前页码对应的渲染列表数据
    const datasource = _.chunk(source, pageSize)[page - 1];
    
    useEffect(()=>{
        // 当使用者提供的所有数据列表有变化时，
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
            // 因为我们的分布式 useState 设计，导致我们需要多次 setState,
            // 这并非一件好事。
            setPageSize(s);
        }
    }
}
```

就如之前所谈，`setState` 并不利于测试。而过于分布的 `useState` 虽然易于使用，但也把数据之间的羁绊给隔离开了，这不利于我们统筹预测数据状态最后该有的样子。

#### 使用 useModel 构建

使用模型与分布式状态管理最大的不同点在于，模型需要统一维护状态，因此，将模型函数抽取出来是个不错的 idea。

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';

// 我们将所有会影响到最终结果的输入条件抽取成状态类型，
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
// 当变量改变时，即重新运行模型，刷新实例。 
export function navigation<T>(changes: Changes<T>){
    const {source, page, pageSize} = changes;
    // 我们所需的渲染状态都应该由 changes 加工而来
    const datasource = _.chunk(source, pageSize)[page - 1];
    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        // 通过 return 一次性更新所有模型变量
        changePage(p:number, s:number):Changes<T>{
            return {source, page:p, pageSize:s};
        },
        // 因为外部变量 source 也是可变的，
        // 所以我们需要为其清晰地描述一个行为方法。
        updateSource(s:T[]):Changes<T>{
            // 根据需求，我们需要在 source 更新时将 page 设置为 1
            return {source:s, page:1, pageSize}
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

虽然初看模型用法会比分布式 `useState` 稍微复杂一些，但事实上模型更善于处理这种复杂的状态结构，我们可以容易地分析出哪些是变量状态，哪些是渲染数据，并提供一分详细且清晰的行为方法。详细的行为方法其实非常重要，这可以让其他维护者轻松了解这套模型能做什么。

或许以上例子并不能明显的说明 `useModel` 的优势，那么，接下来，我们来分析关于 `useState` 和 `useModel` 的组合性对比。

### 组合性

以上例需求为基础，现在我们需要在已实现的分页功能上添加字段排序功能，要求排序时，不改变页码和每页限定记录条数。

同样，我们可以先设计需求返回类型以预先确认目标。

```ts
// type.ts
import {Navigation} from './nav/type'

type SortNavigation<T> = Navigation<T> & {
    field: null | keyof T,
    order: 'desc' | 'asc',
    sort(field: null|keyof T, order: 'asc'|'desc'):any
};
```

#### 使用 useState 组合

我们可以根据 customized hook 优良的组合特性，通过调用原 useNavigation 的方式来实现满足当前需求的 `useSortNavigation`。

```ts
import {useState, useMemo} from 'react';
import _ from 'lodash';
import {useNavigation} from './nav/hook';

export function useSortNavigation<T>(source:T[]){
    const [order, setOrder] = useState<'desc'|'asc'>('desc');
    const [field, setField] = useState<null|keyof T>(null);
    // 我们首先需要计算出整体列表排序后的列表数据
    const sortedSource = useMemo(()=>{
        return field?_.orderBy(source, [field], [order]) : source;
    },[source, order, field]);

    // 对排序后的数据使用之前的 useNavigation，
    // 这时我们发现，每次排序时，页码总是被重置为 1，
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

我们发现通过 customized hook 的组合方式并不能在不修改被组合的原始 hook 的情况下完美实现我们的需求，为此我们需要回过头来修改原始 hook。那如果之后还有更多的需求呢？每次组合都要去修改更多的原始 hook 吗？这显然不现实。我们之所以不能很好的按需组合 customized hook 是因为，这是个多出口（`useState`）的回调 API，它不像纯函数一样有稳定的输入和输出，过于依赖外部 API 的存在。这也是为什么在涉及多种行为的模型中 `useReducer` 比 `useState` 拥有更好组合特性的原因。而作为 `reducer` 衍生方案的 `model` 对这类组合方案也是非常在行的。

#### 使用 useModel 组合

作为拥有稳定输入输出函数的模型更利于组合。

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';
import {navigation, defaultState} from './nav/hook';
import type {Changes} from './nav/hook';

// 定义我们的新状态
type SortChanges<T> = Changes<T> & {
    order: 'desc'|'asc',
    field: null | keyof T
}

// 生成默认的新状态
function defaultSortState<T>(source:T[]):SortChanges<T>{
    const onlyPages = defaultState(source);
    return {...onlyPages, order:'desc', field:null};
}

function sortNavigation<T>(changes:SortChanges<T>){
    const {order, field, source, ...rest} = changes;
    const sortedSource = field? 
            _.orderBy(source, [field], [order]) : 
            source;
    // 我们只要引用旧模型即可实现不修改原模型的组合。
    // 因为在原模型中并不能包含 useEffect 这样的副作用 API
    const nav = navigation({...rest, source:sortedSource});
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

是的，在使用 `useModel` 组合的过程中，我们厚颜无耻的复制了一份 customized hook 进行修改，但这种小当量的修改又有什么关系呢？

### 受控模型

受控模型的`受控`概念来源于 react 受控组件。当我们构建 react 子组件时，往往需要使用来自父组件传递的 props 中的 `value` 和 `onChange` 做简单的输入输出工作，这时，我们希望直接使用 `value` 作渲染，使用 `onChange` 作对外的状态提交，而不是自己维护一份 `state` 状态。

在实际应用中，有很多模型逻辑是可以在受控与非受控直接通用的，但很可惜，通常我们的模型都会维护一个私有状态，这大大增加了我们将模型运用于受控的场景。`@airma/react-state` 给出了以模型为单位的解决方案 `useControlledModel`。

以下例子描述的是一个多选模型，该模型通过 toggle 反选行为修改 selected 数组中的选中值。

```ts
// 这是一个支持反选的多选功能模型
// selected 状态为当前选中值组成的数组
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
    // 我们只要将 useModel 替换成 useControlledModel，
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

API `useControlledModel` 可用于将原先用于 `useModel` 的非受控模型接入一个受控环境，并通过 value, onChange 进行控制。

## 上下文状态

React 上下文状态是指利用 `React.Context` 技术，在 `Context.Provider` 范围内任意深度的子组件可以通过 `useContext` 获取父组件维护状态的状态管理方式。

目前很多状态管理工具都只提供了全局上下文状态管理模式，store 数据维护在一个全局常量中，经过反复使用，我们发现全局上下文状态并不利于组织和复用我们的组件。如：我们为一个复杂组件设计了一个独立的全局 store 来维护上下文状态，当我们需要在同一页面的不同区域多次使用该组件的实例时，我们发现这些实例的上下文状态是始终同步的，很难对它们进行上下文作用域隔离。

`@airma/react-state` 提供了一套将上下文状态维护在 `Provider` 实例中的思路，我们可以建立一套全局的上下文状态键，并通过键去链接这些维护在 `Provider` 中的上下文状态。

这种做法，相当于把上下文状态的作用域重新交给了使用者，而非大一统无脑的提供一个全局上下文作用域。通过控制 `Provider` 的位置，我们可以很容易拿捏上下文状态的作用范围。

回到上例，在一个页面中，被多次使用的组件 `ReactElement` 实例是不同的，所以，内部 `Provider` 组件的 `ReactElement` 实例也是不同的，而上下文状态库 `store` 是建立并维护在 `Provider` 实例内部的，所以即便使用了相同的全局键，不同实例中获取的上下文状态依然是隔离的，不同步的。这就避免了上述的全局上下文的大一统问题。

通过使用以下 API，我们可以快速建立起一套上下文状态管理使用作用域：

1. `createStoreKey`，用于把一个模型函数包装成一个全局键，可以理解为创建一把钥匙：`const key = createStoreKey(model, defaultState?)`。
2. `StoreProvider`，提供上下文状态作用域的 `Provider`，它使用全局键在实例内部维护一个状态库（store） ：`<StoreProvider value={key} />...</StoreProvider>`。
3. `useModel`，使用全局键的 `useModel` 会根据键连接到最近与之匹配的 `StoreProvider`，并与该 Provider 实例内部的 store 进行状态同步：`const instance = useModel(key)`。
4. `useSelector`，与 `useModel` 类似，同样需要通过全局键来链接最近与之匹配的 `StoreProvider`，并同步状态数据。不同的是 `useSelector` 还需要使用者提供 `select` 数据选取回调函数，以选取当前组件需要的那部分数据。当上下文状态变更时，如 `select` 函数返回值没有变更，则不触发渲染。这有利于提升组件运行效率，降低组件渲染频率：`useSelector(key, (instance)=>instance.xxx)`。

让我们以一个查询页面为例来看看，如何使用 `@airma/react-state` 的上下文状态管理机制。

### 例子

老规矩，先定义模型所需的类型。

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
    // 查询获得的所有 User 列表数据
    source: User[];
    // 当前选中的页码
    page: number;
    // 当前每页限制条数
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
import {createStoreKey} from '@airma/react-state';
import _ from 'lodash';
import type {Query, User, State} from './type';

const defaultState = (): State => ({
    validQuery: {},
    displayQuery: {},
    source: [],
    page: 1,
    pageSize: 10
});

function model(state: State){
    const {source, page, pageSize, displayQuery} = state;
    const total = source.length;
    const datasource = _.chunk(source, 10)[page - 1];
    return {
        displayQuery,
        page,
        pageSize,
        datasource,
        total,
        changeDisplayQuery(displayQuery: Query): State{
            return {
                ...state, 
                displayQuery
            };
        },
        submit(): State{
            const {displayQuery} = state;
            return {...state, validQuery: {...displayQuery}};
        },
        updateSource(users: User[]): State{
            return {...state, source: users, page: 1};
        },
        changePage(p: number, s: number): State{
            return {...state, page:p, pageSize: s};
        }
    }
}

export const modelKey = createStoreKey(model, defaultState());
```

我们使用 `createStoreKey` 创建了一个全局键，之后将用于 `StoreProvider` 创建上下文状态库，并在子组件中链接该状态库，进而达到数据同步的效果。

现在开始创建查询页面。

```ts
import React, {memo, useEffect} from 'react';
import {
    StoreProvider,
    useSelector, 
    useRefresh,
    useModel
} from '@airma/react-state';
import {useQuery} from '@airma/react-effect';
import {Input, Button, Table, Pagination} from 'antd';
import {queryModels} from './model';
import {fetchSource} from './service';
import type {Query, User} from './type';

const Search = memo(()=>{
    // link searchModel state in store, 
    // and create or refresh instance.
    const {
        displayQuery,
        changeUsername,
        submit,
        reset
    } = useModel(queryModels.search);

    const handleChangeUsername = (e)=>{
        changeUsername(e.target.value);
    };

    return (
        <div>
            <Input 
                value={displayQuery.username} 
                onChange={handleChangeUsername}
            />
            <Button type="primary" onClick={submit}>submit</Button>
            <Button onClick={reset}>reset</Button>
        </div>
    );
});

const Source = memo(()=>{
    // link searchModel state in store,
    // and select the `validQuery` from created instance,
    // when the `validQuery` changes it renders.
    const validQuery = useSelector(
        queryModels.search, 
        (i)=>i.validQuery
    );
    // link sourceModel state in store to create or refresh instance.
    const {
        datasource,
        page,
        pageSize,
        totalElement,
        changePage,
        updateSource
    } = useModel(queryModels.source);

    // useQuery for fetching data
    const [{isFetching, data: source}] = useQuery(fetchSource, {
        variables: [validQuery],
        defaultData: []
    });

    // when the source(users) changes,
    // the `updateSource` method from `queryModels.source` instance
    // catches the change, 
    // and submit a next state to store to refresh all same key links.
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
    // before use storeKeys to link store states,
    // we need to provide them to `StoreProvider` for store creation.
    return (
        <StoreProvider value={queryModels}>
            <Search/>
            <Source/>
        </StoreProvider>
    );
}
```

The `@airma/react-state` scope state usage steps are:

1. Create store key by API `createStoreKey`.
2. Provide store keys to a parent `StoreProvider`.
3. Use `useModel` or `useSelector` in the children of `StoreProvider` to link store for usage.

Sometimes, we want to initialize a default state to store in render time, we can use `useModel(storeKey, defaultState)` to do that. If the store key is matched, and the store state is not changed by action method operations, the default state can be initialized into store once.

```ts
import React, {memo} from 'react';
import {
    ModelProvider,
    useModel
} from '@airma/react-state';
import {queryModels} from './model';

const defaultSearch = {
    validQuery:{username: 'username'},
    displayQuery:{username: 'username'}
}

const Search = memo(()=>{
    // we can use default parameter for initializing in render time
    useModel(queryModels.search, defaultSearch);

    ......

});

......

export default function Page(){
    return (
        <ModelProvider value={queryModels}>
            <Search/>
            <Source/>
        </ModelProvider>
    );
}
```

#### AutoLink

If the store key can not match a store in parent `StoreProvider`s, the `useModel` API throws an error to tell that the key can not matched a store. That often happens when we want to reuse component or customized hook with scope state to a out Provider component. In that case, we can set a `autoLink` optional config to tell `useModel` use a local state instead, if there is no match store in parent.

```ts
import React, {memo} from 'react';
import {
    StoreProvider,
    useModel
} from '@airma/react-state';
import {queryModels} from './model';

const defaultSearch = {
    validQuery:{username: 'username'},
    displayQuery:{username: 'username'}
}

const Search = memo(()=>{
    // `autoLink` option makes `useModel` to
    // create a local state with `defaultSearch`,
    // if no store matched with `queryModels.search`. 
    // Be careful, if the `autoLink` is opening,
    // the initializing about default state for store state
    // is auto disabled. 
    useModel(queryModels.search, defaultSearch, {autoLink:true});

    ......

});

......

export default function Page(){
    return (
        <div>
            {/* no matched store has been hound, */} 
            {/* useModel creates a private state instead */}
            <Search/>
            <StoreProvider value={queryModels}>
                <Search/>
                <Source/>
            </StoreProvider>
        </div>
    );
}
```

Set `autoLink` option to `useModel` can create a private state when there is no matched store for store key. But, it also disables the default state initializing for the opposite case.

#### Pipe

The store key has a `pipe` method, you can use it to link the matched store state with another model.

```ts
import React, {memo} from 'react';
import {StoreProvider, createStoreKey, useModel} from '@airma/react-state';

const counter = (count:number = 0)=> ({
    count,
    increase:()=>count + 1,
    decrease:()=>count - 1
});

const countStoreKey = createStoreKey(counter);

const Counter = memo(()=>{
    const {count, increase, decrease} = useModel(countStoreKey);

    return ......
});

const Cleaner = memo(()=>{
    // use `pipe` method can change a model, and links it to
    // the matched store state.
    // when we click `clean` button,
    // the count in `Counter` component changes to 0.
    const {clear} = useModel(countStoreKey.pipe((c:number)=>{
        clear():number{
            return 0;
        }
    }));

    return <button onClick={clear}>clean</button>
});

export default function Page(){
    return (
        <div>
            <StoreProvider value={countStoreKey}>
                <Counter/>
                <Cleaner/>
            </StoreProvider>
        </div>
    );
}
```

If you want to learn more about scope state, you can take the next [section](/react-state/feature.md) about features of `@airma/react-state`.



