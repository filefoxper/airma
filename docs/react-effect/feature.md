# Features

There are some useful features you should know about `useQuery`, `useMutation` and `state sharing`.

## UseQuery

API useQuery always query a newest data for you. If you have triggered one `useQuery` mutiple times, and an old one resolve data later than the newest one, the old promise data will not cover the newest one. The old later data is always comes with a field `abandon: true`, it will not appear in promise state.

```ts
const fetchData = (page: number)=>{
    return new Promise((resolve)=>{
        // Simulate a later resolve,
        // when page is 1.
        if(page === 1){
            setTimeout(()=>{
                resolve(page);
            }, 800);
            return;
        }
        resolve(page);
    });
}

const App = ()=>{
    const [page, setPage] = useState(1);
    const [ {data} ] = useQuery(fetchData, [page]);

    const handleChangePage=(p: number)=>{
        // Set page 2 in 800 ms after component mounted.
        // The data should be 2,
        // after 800 ms, the data is still 2,
        // it won't be covered by the later resolve.
        setPage(p);
    }

    return ......;
}
```

We have simulate a later resolve when varible page is 1. When the component App is mounted, change page to 2 quickly, the data should be 2. After the simulate duration, it is still 2.

## UseMutation

The useMutation can not start its promise callback when last calling is not finished. That means you have to mutate one by one. But this limit is only exist in the same useMutation usage.

```ts
const saveData = (data:any)=>Promise.resolve(data);

const App = ()=>{
    const [data, setData] = useState(...);
    const [, trigger] = useMutation(saveData, [ data ]);

    const handleSubmit = ()=>{
        // The twice trigger happens
        trigger();
        // The second trigger will not call saveData
        trigger();
    }
}
```

## State sharing

When you are using [state sharing](/react-effect/guides?id=sharing-state) with `useQuery` or `useMutation` in `SessionProvider`, you may use a same key in multiple times to query or mutate data at the same time. In that case, only the first triggered one can actually call the promise callback, and others will be an acceptor to accept the state change from `SessionProvider`.

```ts
const query = createSessionKey(fetchData);

const Child1 = ()=>{
    // It is a earliest triggered one
    useQuery(query, []);

    return ......;
}

const Child2 = ()=>{
    // It will not actually call fetchData,
    // for there is a same key calling happened.
    // But it can accept state changes.
    const [ {data}, trigger, execute ] = useQuery(query, []);

    return ......;
}

const App = ()=>{
    // The query in Child1 and Child2 triggered in component mount
    // at the same time.
    return (
        <SessionProvider value={query}>
          <Child1/>
          <Child2/>
        </SessionProvider>
    );
}
```

The final section is [APIs](/react-effect/api.md), you can finish it now.