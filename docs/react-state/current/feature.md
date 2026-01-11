# Features

## Persist action methods

The **store instance** is a **proxy** object, action methods from this object are persistent, no change happens to the action methods when the **instance** refreshes. It is helpful for using them to memo component props.

In fact, these changeless methods are just action dispatching entrances. In the runtime of action method, an actual method from the source of **proxy instance** is called, this source object is the newest instance data in store, so, there is no stale data problem happens in action method runtime. 

```ts
import React,{memo, useState} from 'react';
import {useModel} from '@airma/react-state';

const App = memo(()=>{

    const {count, increase} = useModel((c = 0)=>{
        count:c,
        increase:()=>c + 1
    });

    const lazyIncrease = ()=>{
        setTimeout(()=>{
            // Consider the action method as a dispatch in `redux`.
            // It calls the newest `increase` method in source of instance.
            // No stale data happens.
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

## No zombie child

If the model owner is unmounted, no state change happens in react component. In that case, though the store ( if the Provider component is not unmounted ) may still works, but no state change happens in component.

Next Page [API](api).