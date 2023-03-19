# Features

## Persist methods

The methods from `instance` are persistent, using them as props of memo component is very helpful. The `instance` method is a wrap function, it always calls the newest `proto instance` method when it works. So, the render closures can not affect it with stale values, that keeps it more safer than `useState`.

We have talked about the trouble about `setState` in [section guide](/react-state/guides?id=local-state). Let's continue the talking. 

The trouble about `useState` usage:

```ts
import React,{memo, useState} from 'react';

const App = memo(()=>{

    const [count, setCount] = useState(0);

    // click `lazy increase` button first
    const lazyIncrease = ()=>{
        setTimeout(()=>{
            // it should use like: `setCount(c=>c+1)`
            // to keep safe.
            setCount(count + 1);
        }, 3000);
    };

    // then click `increase` button 3 times immediately.
    const increase = ()=>{
        setCount(count + 1);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increase}>increase</button>
            <button onClick={lazyIncrease}>lazy increase</button>
        </div>
    );
})
```

Let's click `lazy increase` button first, then click `increase` button 3 times immediately, and after 3 seconds what the `count` should display? Is that `4`? No, it is `1`. Why? The render closures of course. If we want to make  `count` growth normally by increase 1, every time when we click buttons, we should setState like `setCount((c)=>c + 1)`.

The `useModel` API can help you avoid this case easily.

```ts
import React,{memo, useState} from 'react';
import {useModel} from '@airma/react-state';

const App = memo(()=>{

    const {count, increase} = useModel((c = 0)=>{
        count:c,
        increase:()=>c + 1
    });

    // click `lazy increase` button first
    const lazyIncrease = ()=>{
        setTimeout(()=>{
            increase();
        }, 3000);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increase}>increase</button>
            <button onClick={lazyIncrease}>lazy increase</button>
        </div>
    );
})
```

Let's do the operation again, we can see the result of `count` is always correct.

## Scope state

The scope state in `@airma/react-state` is persisted in a store created by `StoreProvider`. Every `StoreProvider` has its own store created by store keys, we can use these keys to link a nearest matched parent `StoreProvider` for state usage. It matches the parent `StoreProvider` from inside to outside, if there is no matched store, it throws error.

```ts
import {
    useModel, 
    createKey, 
    StoreProvider
} from '@airma/react-state';

const key1 = createKey(model);

const key2 = createKey(model);

const Comp = ()=>{
    useModel(key1);
    return ......;
}

const App = ()=>{
    // the usage in `Comp` find link in
    // `<StoreProvider keys={key1}>`
    return (
        <StoreProvider keys={key1}>
            <StoreProvider keys={key2}>
                <Comp/>
            </StoreProvider>
        </StoreProvider>
    );
}
```

The `createKey` API always generates a unique store key. Though the `key1` and `key2` wraps a same model, they are still different.

## More usage

The APIs of `@airma/react-state` are very flexible, you can use them to complete a lot of work. 

For example, we can use `useSelector` to organize asynchronous methods as side effects for model.

```ts
import React, {memo, useEffect} from 'react';
import {
    StoreProvider,
    useSelector, 
    useRefresh,
    useModel
} from '@airma/react-state';
import {Input, Button, Table, Pagination} from 'antd';
import {queryModels} from './model';
import {fetchSource} from './service';
import type {Query, User} from './type';

......

const Source = memo(()=>{

    const [fetching, setFetching] = useState(false);

    const validQuery = useSelector(
        queryModels.search, 
        (i)=>i.validQuery
    );

    const {
        datasource,
        page,
        pageSize,
        totalElement,
        changePage,
        querySource
    } = useSelector(queryModels.source,(instance)=>({
        ...instance,
        // composite an asynchronous method to update source,
        // and refresh the fetching state. 
        async querySource(query: Query){
            setFetching(true);
            try{
                const source = await fetchSource(query);
                instance.updateSource(source);
            }finally{
                setFetching(false);
            }
        }
    }));

    useRefresh(querySource, [validQuery]);

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

......
```

Let's take the final section about [API](/react-state/api.md).