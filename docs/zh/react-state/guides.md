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

As we can see, the model function is more good at telling the often changes, and we can compute other useful data from the often changes. 

A model can be reused more easier.

If we want to make another useNavigation with a sort feature, what we can do? Compare the `useState` and `useModel` examples.

type.ts

```ts
import {Navigation} from './nav/type'

type SortNavigation<T> = Navigation<T> & {
    field: null | keyof T,
    order: 'desc' | 'asc',
    sort(field: null|keyof T, order: 'asc'|'desc'):any
};
```

useState.ts

```ts
import {useState, useMemo} from 'react';
import _ from 'lodash';
import {useNavigation} from './nav/hook';

export function useSortNavigation<T>(source:T[]){
    const [order, setOrder] = useState<'desc'|'asc'>('desc');
    const [field, setField] = useState<null|keyof T>(null);
    // every time when the order changes,
    // the source is recomputed,
    // it can lead the setPage(1) happens in 
    // `useNavigation -> useEffect`
    const sortedSource = useMemo(()=>{
        return field?_.orderBy(source, [field], [order]) : source;
    },[source, order, field]);

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

If we compose a customized hook like this, it may lead bugs, for we don't want `setPage(1)` happens when sort action works out. So, we have to copy and modify the `useNavigation` hook to support it.

What about `useModel`?

useModel.ts

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';
import {navigation, defaultState} from './nav/hook';
import type {Changes} from './nav/hook';

type SortChanges<T> = Changes<T> & {
    order: 'desc'|'asc',
    field: null | keyof T
}

function defaultSortState<T>(source:T[]):SortChanges<T>{
    const onlyPages = defaultState(source);
    return {...onlyPages, order:'desc', field:null};
}

function sortNavigation<T>(changes:SortChanges<T>){
    const {order, field, source, ...rest} = changes;
    const sortedSource = field? 
            _.orderBy(source, [field], [order]) : 
            source;
    // reuse navigation
    const nav = navigation({...rest, source:sortedSource});
    return {
        ...nav,
        order,
        field,
        sort(field: null|keyof T, order: 'asc'|'desc'):SortChanges<T>{
            return {...changes, field, order};
        }
    }
}

export function useSortNavigation<T>(source:T[]):Navigation<T>{
    const {
        updateSource,
        ...rest
    } = useModel(sortNavigation, defaultSortState(source));

    // if the source is not changed, 
    // the sort action can not lead `setPage to 1` happening.
    useRefresh(updateSource, [source]);

    return rest;
} 
```

Yes, we copied part of the codes from `useNavigation`, but reuse the main logic about how to navigate pages, and compose the sort feature with it.

#### Controlled Model

There are more reusages that a `model` can do better than `useState`, for example, sometimes we want to reuse an uncontrolled model logic into a controlled component.

model.ts

```ts
// this is a selection model
export function selection<T>(selected:T[]){
    return {
        selected,
        toggle(toggled:T){
            // toggled is a immediate param,
            // it makes selected change.
            // so, the often changes here is selected.
            if(selected.includes(toggled)){
                return selected.filter((d)=>d!==toggled);
            }
            return selected.concat(toggled);
        }
    }
} 
```

uncontrolled state usage:

```ts
import {useModel} from '@airma/react-state';
import {selection} from './model';

export function useSelection<T>(){
    const {selected, toggle} = useModel(selection,[]);
    return [selected, toggle];
}
```

controlled state usage:

```ts
import {useControlledModel} from '@airma/react-state';
import {selection} from './model';

export function useControlledSelection<T>(
    state:T[],
    setState:(toggled:T[])=>any
){
    // useControlledModel links state and setState outside.
    // When the method is called, and generate a next state,
    // the next state is sent out through setState.
    // When the state changes, the instance refreshes.
    const {selected, toggle} = useControlledModel(
        selection,
        state,
        setState
    );
    return [selected, toggle];
}

export function useComposite(){
    const [selected, setSelected] = useState([]);
    return useControlledSelection(selected, setSelected);
}
```

API `useControlledModel` can link `state` and `setState` outside, it has no state inside. When the out `state` changes, it refreshes instance. When the instance method is called, the result of method is sent out through the out `setState`. 

## 上下文状态

Sometimes, we need `React.useContext` to manage a scope state, for we don't want to pass states and action methods through a deep props flow one by one. 

There are two ways to build scope state. 

1. Use an outside store to build a global scope state management.
2. Create store inside a parent component.

The outside global store is terrible. It makes components difficult to be reused. So, `@airma/react-state` choose the way about creating store inside a parent component. 

There are 4 important APIs to work the scope states.

1. `createStoreKey`, it wraps a model, and generate a new model as a key to store.
2. `StoreProvider`, it is a Context.Provider, which provides a scope store for child usages.
3. `useModel`, if we have provide a factory model for `useModel`, it uses this factory as a key to link a matched store state.
4. `useSelector`, it is a child usage like `useModel`, but can select data or methods from instance, and only when the selected result change can make it rerender. This API is often used to reduce the render frequency of component.

Let's take a page query example to see how to use it.

#### Example

type.ts

```ts
// we will use {username?:string} as a request param
// to fetch users from a remote server.
export type Query = {
    username?: string;
};

export type User = {
    id: number;
    username: string;
    name: string;
}
```

service.ts

```ts
// this is a fake package
import rest from '@airma/fake-rest';

export function fetchSource(query:Query):Promise<User[]>{
    // this is a service to fetch users with query object.
    return rest('/api/user').setRequestParams(query).get<User[]>();
}
```

model.ts

```ts
import {createStoreKey} from '@airma/react-state';
import _ from 'lodash';
import type {Query, User} from './type';

/**
 * we split the whole query function to two models,
 * the `searchModel` is designed for manage the query conditions,
 * the `sourceModel` is designed for manage datasource for table,
 * and page infos for pagination.
 **/

type SearchChanges = {
    // this query is for display and modify
    displayQuery:Query;
    // this query is from displayQuery,
    // when we submit or reset, it changes,
    // and we can use it as a request param to fetch users
    validQuery:Query;
};

type SourceChanges = {
    // users from request
    source: User[];
    // current page number;
    page: number;
    // current page size;
    pageSize: number;
};

const defaultSearch = (): SearchChanges => ({
    validQuery: {},
    displayQuery: {}
});

function searchModel(changes: SearchChanges){
    return {
        ...changes,
        changeUsername(username:string): SearchChanges{
            // change username to displayQuery,
            // it will be used to a Input
            const {displayQuery} = changes;
            return {
                ...changes, 
                displayQuery: {...displayQuery, username}
            };
        },
        submit(): SearchChanges{
            // when we click submit button,
            // the displayQuery should be replace the validQuery,
            // we will use validQuery for fetching users later.
            const {displayQuery} = changes;
            return {...changes, validQuery: {...displayQuery}};
        },
        reset(): SearchChanges{
            return defaultSearch();
        }
    }
}

const defaultSource = (): SourceChanges => ({
    source: [],
    page: 1,
    pageSize: 10
});

// to manage the fetched users
function sourceModel(changes: SourceChanges){
    const {source, page, pageSize} = changes;
    const datasource = _.chunk(source, pageSize)[page - 1] || [];
    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        changePage(p: number, s: number): SourceChanges{
            return {source, page: p, pageSize: s};
        },
        updateSource(s: User[]){
            return {source:s, page:1, pageSize};
        }
    }
}

// storeKeys,
// we will use `useModel(queryModels.search)`
// to link searchModel state from a matched Provider store
const queryModels = {
    search: createStoreKey(searchModel, defaultSearch()),
    source: createStoreKey(sourceModel, defaultSource())
}

export {
    // the storeKeys are the keys to link 
    // store states.
    // before use these keys, 
    // we will provide them to `StoreProvider`
    // for generating a scope store.
    queryModels
}
```

We creates storeKeys, and provide them to `StoreProvider` for generating a scope store. After that, we will use them as keys to link states from store by using `useModel` or `useSelector`.

layout.tsx

```ts
import React, {memo, useEffect} from 'react';
import {
    StoreProvider,
    useSelector, 
    useRefresh,
    useModel
} from '@airma/react-state';
import {useQuery} from '@airma/react-query';
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



