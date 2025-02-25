# Features

## No zombie child

If the session usage is unmounted, no state change happens in react component. In that case, though the store ( if the Provider component is not unmounted ) may still works, but no state change happens in component.

## One session key with one execution at one time

API useQuery/useMutation uses session [key](/react-effect/concepts?id=key) to subscribe and set store state. If there are multiple useQuery/useMutation with a same session key executes at the same time, only one can be allowed to execute, others just wait for the state change by subscribing store.

```ts
import {session} from '@airma/react-effect';

const fetchUserRelationShips = async (): Promise<RelationShip[]> =>{
    return ......
};

const queryStore = session(fetchUserRelationShips, 'query').createStore();

// Common component
export const RelationShipSelector = (props: Props)=>{
    const [
        {
            data,
            isFetching
        }
        // common key to store
    ] = queryStore.useQuery({
        variables: [],
        defaultData: []
    });
    return (
        <Selector {...props} disabled={isFetching}>
            {
                data.map((r)=>
                    <Option value={r.id} key={r.id}>
                        {r.name}
                    </Option>
                )
            }
        </Selector>
    )
};

const App = ()=>{
    // More than one queryStore.useQuery works torgether
    // at the mount time,
    // only one really executes.
    return (
        <Page>
            <RelationShipSelector {...props}/>
            ......
            <div>
                <RelationShipSelector {...props}/>
            </div>
            ......
        </Page>
    );
}
```

This feature is very useful.

## Common Provider system with @airma/react-state

In fact, [session key](/react-effect/concepts?id=key) is a special [model key](/react-state/concepts?id=key) in `@airma/react-state`, and the [Provider system](/react-state/guides?id=createkey-and-provide) are same too. So, the they can use together with one provider, no matter is from `@airma/react-effect` or `@airma/react-state`. If it is a trouble problem, use [@airma/react-hooks](/react-hooks/index) for integration is a good idea.

```ts
import {provide, createKey} from '@airma/react-state';
import {createSessionKey} from '@airma/react-effect';

const countKey = createKey((count: number)=>{
    return {
        count,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}, 0);

const querySessionKey = createSessionKey(fetchUsers, 'query');

const keys = {count:countKey,query:querySessionKey};

// @airma/react-state provide can create session store too
const Component = provide(keys)(()=>{
    return ......;
});
```

Next section [api](/react-effect/api).