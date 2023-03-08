# Guides

There are two different state types in react:

1. local state
2. scope state

## Local state

We often use `React.useState` or `React.useReducer` to manage local states. There are some troubles if you can not handle them well, we will talk about these troubles in the [feature](/react-state/feature.md) section.

Now, let's compare the examples about how to make a page navigation between use `useState` and `useModel`.

#### Easy composite

type.ts

```ts
export type Navigation<T> = {
    // the current records for display
    datasource: T[];
    // current page
    page: number;
    // page size
    pageSize: number;
    // total records number
    totalElement: number;
    // an action method for change page and page size.
    changePage(p:number, s:number):any;
}
```

useState.ts

```ts
import {useState, useEffect} from 'react';
import _ from 'lodash';

// simple enough, but too much `useState`
export function useNavigation<T>(source:T[]):Navigation<T>{
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const datasource = _.chunk(source, pageSize)[page - 1];
    
    useEffect(()=>{
        setPage(1);
    },[source]);

    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        changePage:(p:number, s:number) => {
            // too much `setState`,
            // you have to split the changes to  
            // different state sources. 
            setPage(p);
            setPageSize(s);
        }
    }
}
```

As we have talked, that `setState` is not good for test, and too much `setState` split one change to mutiple changes.

useModel.ts

```ts
import {useModel, useRefresh} from '@airma/react-state';
import _ from 'lodash';

export type Changes<T> = {
    source: T[];
    page: number;
    pageSize: number;
};

export function defaultState<T>(source:T[]):Changes<T> {
    return {source, page: 1, pageSize: 10};
};

// a pure function model.
// it is easy for test.
// it is more easier for reusage.
export function navigation<T>(changes: Changes<T>){
    // we designed the often change data as state,
    // and compute other data from state.
    const {source, page, pageSize} = changes;
    const datasource = _.chunk(source, pageSize)[page - 1];
    return {
        datasource,
        page,
        pageSize,
        totalElement: source.length,
        // update all the changes
        changePage(p:number, s:number):Changes<T>{
            return {source, page:p, pageSize:s};
        },
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

    // useRefresh API watches the dependencies change,
    // and use these dependencies as params to call the method.
    useRefresh(updateSource, [source]);

    return rest;
}
```

As we can see, the model function is more good at telling the often changes, and we can compute others from the often changes. 

A model can be reused more easier.

If we want to make another useNavigation with field sort function, what we can do? Compare the `useState` and `useModel` examples.

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
    // the source are recomputed,
    // it can lead the setPage(1) happens in `useNavigation`
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

Yes, we copied part of the codes from `useNavigation`, but reuse the main logic about how to navigate pages, and compose the sort function with it.

#### Controlled Model

There are more reusage that `model` can do better than `useState`, for example, sometimes we want to reuse the uncontrolled model logic into a controlled component.

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

## Scope state

Sometimes, we need `React.useContext` to manage a scope state, for we don't want to pass states and actions through a deep props flow one by one. 

There are two ways to build scope state. 

1. Use an outside store to build a global scope state management.
2. Create store inside a parent component.

The outside global store is terrible. It makes components difficult to be reused. So, `@airma/react-state` choose the way about creating store inside a parent component. 

There are 4 important APIs to work the scope states.

1. `factory`, it wraps a model, and generate a new model as a key to store.
2. `ModelProvider`, it is a Context.Provider, which provides a scope store for child usages.
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
import {factory} from '@airma/react-state';
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

// factory collections,
// we will use `useModel(queryModels.search)`
// to link searchModel state from a matched Provider store
const queryModels = {
    search: factory(searchModel, defaultSearch()),
    source: factory(sourceModel, defaultSource())
}

export {
    // the factory collections are the keys to link 
    // store states.
    // before use these keys, 
    // we will provide them to `ModelProvider`
    // for generating a scope store.
    queryModels
}
```

We creates factories, and provide them to `ModelProvider` for generating a scope store. After that, we will use them as keys to link states from store by using `useModel` or `useSelector`.

layout.tsx

```ts
import React, {memo, useEffect} from 'react';
import {
    ModelProvider,
    useSelector, 
    useRefresh,
    useModel
} from '@airma/react-state';
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

// simulate a useQuery, 
// which fetches users when validQuery changes.
// It returns a `fetching` status and current `users`.
const useQuery = (validQuery:Query)=>{
    const {
        fetching, 
        source,
        startFetch,
        updateSource,
        finishFetch
    } = useModel((changes:{fetching:boolean, source:User[]})=>{
        const changeFetching = (start:boolean)=>{
            return {...changes,fetching:start};
        }
        return {
            ...changes,
            startFetch(){
                return changeFetching(true);
            },
            updateSource(s:User[]){
                return {...changes,source:s};
            },
            finishFetch(){
                return changeFetching(false);
            }
        }
    },{fetching:false, source:[]});

    useEffect(()=>{
        (async function fetching(){
            startFetch();
            try{
                const source = await fetchSource(validQuery);
                updateSource(source);
            }finally{
                finishFetch();
            }
        })();
    },[validQuery]);

    return {fetching, source};
}

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

    const {fetching, source} = useQuery(validQuery);

    // when the source(users) changes,
    // the `updateSource` method from `queryModels.source` instance
    // catches the change, 
    // and submit a next state to store to refresh all same key links.
    useRefresh(updateSource, [source]);

    return (
        <div>
            <Table
                dataSource={datasource}
                loading={fetching}
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
    // before use factory collections to link store states,
    // we need to provide it to a `ModelProvider` for store creating.
    return (
        <ModelProvider value={queryModels}>
            <Search/>
            <Source/>
        </ModelProvider>
    );
}
```

The `@airma/react-state` scope state usage steps are:

1. Create factory collections( or factory).
2. Provide factory collections to a parent `ModelProvider`.
3. Use `useModel` or `useSelector` in the children of `ModelProvider` to link store for usage.

Sometimes, we want to initialize a default state to store in component. We can use `useModel(factoryModel, defaultState)` to do that. If the factory model is matched, and the store state is uninitialized, the default state can be initialized into store once.

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
    // we can use default parameter for initializing in component
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

If the factory key can not find a matched store in the parent `ModelProvider`s, the `useModel` API throws an error to tell that the key factory can not find a matched store. That often happens when we want to reuse a scope state using component or customized hook out of the matched Provider. In that case, we can set a `autoLink` option to tell `useModel` use a local state instead, if the matched store can not be found.

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
    // `autoLink` option makes `useModel` to
    // create a local state with `defaultSearch`,
    // if no parent store matched `queryModels.search`. 
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
            <ModelProvider value={queryModels}>
                <Search/>
                <Source/>
            </ModelProvider>
        </div>
    );
}
```

Set `autoLink` option to `useModel` can create a private state when the matched store for factory is not found. But, it also disables the default state initializing for matched case.

#### Pipe

The factory model has a `pipe` method, you can use it to replace a new model, and link state to a matched store.

```ts
import React, {memo} from 'react';
import {ModelProvider, factory, useModel} from '@airma/react-state';

const counter = (count:number = 0)=> ({
    count,
    increase:()=>count + 1,
    decrease:()=>count - 1
});

const countFactory = factory(counter);

const Counter = memo(()=>{
    const {count, increase, decrease} = useModel(countFactory);

    return ......
});

const Cleaner = memo(()=>{
    // use `pipe` method can change a model, and links it to
    // the matched store state.
    // when we click `clean` button,
    // the count in `Counter` component changes to 0.
    const {clear} = useModel(countFactory.pipe((c:number)=>{
        clear():number{
            return 0;
        }
    }));

    return <button onClick={clear}>clean</button>
});

export default function Page(){
    return (
        <div>
            <ModelProvider value={countFactory}>
                <Counter/>
                <Cleaner/>
            </ModelProvider>
        </div>
    );
}
```

If you want to learn more about scope state, take the next [section](/react-state/feature.md) about features of `@airma/react-state`.



