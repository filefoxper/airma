# Features

## Persist methods

The methods from instance are persistent. You can pass it to a memo component directly. Every time, when we call a method, it refreshes from proto instance, and run the newest one to generate a next state. So, it has no problem about the stale method running caused by closures.

We have talked about the trouble about `setState` in [section guide](/react-state/guides?id=local-state). Let's continue the talking. 

Take a view about the code below:

```ts
import React,{memo, useState} from 'react';

const App = memo(()=>{

    const [count, setCount] = useState(0);

    // click `lazy increase` button first
    const lazyIncrease = ()=>{
        setTimeout(()=>{
            setCount(count + 1);
        }, 3000);
    };

    // then click `increase` button 3 times immediately
    // in 3 seconds after you click `lazy increase` button.
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

Let's click `lazy increase` button first, then click `increase` button 3 times in 3 seconds immediately, and after 3 seconds what the `count` should display? Is that `4`? No, it is `1`. Why? The closures of course. If we want to make  `count` growth normally by increase 1, every time when we click buttons, we should setState like `setCount((c)=>c + 1)`.

The `useModel` API can help you avoid this case easily.

```ts
import React,{memo, useState} from 'react';

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

The scope state in `@airma/react-state` is persisted in a store created by `ModelProvider`. Every `ModelProvider` has its own store created by factory collections, we can use the factory model in collections as a key to link the state in a nearest matched parent `ModelProvider`. If the parent `ModelProvider` is not matched with the factory usage (`useModel` or `useSelector`), it keeps finding through the `ModelProvider` tree util the top one.

```ts
const factory1 = factory(model);

const factory2 = factory(model);

const Factory1Usage = ()=>{
    useModel(factory1);
    return ......;
}

const App = ()=>{
    // the usage in `Factory1Usage` find link in
    // `<ModelProvider value={factory1}>`
    return (
        <ModelProvider value={factory1}>
            <ModelProvider value={factory2}>
                <Factory1Usage/>
            </ModelProvider>
        </ModelProvider>
    );
}
```

The `factory` API generates a unique key by every calling, it can not be affected by the wrapped model. So, though the `factory1` and `factory2` wraps a same model, they are still different.

## More usage

The APIs of `@airma/react-state` are very flexible, you can use them to complete a lot of work. 

For example, we can use `useSelector` to organize asynchronous methods as side effects for model.

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

This example is just for explaining you can use these APIs flexible. We do not recommend using `useSelector` to do an asynchronous work.

Let's take a view about [API](/react-state/api.md).