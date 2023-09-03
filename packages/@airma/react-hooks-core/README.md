[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks-core.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks-core
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks-core.svg?style=flat-square

# @airma/react-hooks-core

It is a simple tool for providing some simple and useful react hooks for `@airma/react-*` tools. You can use it directly.

## API

### usePersistFn

```ts
export declare function usePersistFn<T extends (...args: any[]) => any>(
  callback: T
): T;
```

This hook is created for replacing `useCallback`, if you want to create a persist callback.

```ts
import {memo} from 'react';
import {usePersistFn} from '@airma/react-hooks-core';

const App = memo((props: {onChange: (value:string)=>void})=>{
    return ...;
});

const Layout = ()=>{
    const call = usePersistFn((v: string)=>{});

    return <App onChange={call}/>
}
```

### useMount

```ts
export declare function useMount(callback: () => (() => void) | void): void;
```

This hook is created for listen the mount effect of functional component.

### useUpdate

```ts
export declare function useUpdate<T extends any[]>(
  callback: (prevDeps: typeof deps) => (() => void) | void,
  deps?: T
): void;
```

This hook is created for listen the update effect of functional component.

```ts
import {memo, useState} from 'react';
import {useUpdate} from '@airma/react-hooks-core';

const App = memo((props: {value:number})=>{

    const [count, setCount] = useState(props.value);

    useUpdate((prev)=>{
        if(!prev){
            return;
        }
        const [prevValue] = prev;
        console.log(prevValue)
    }, [props.value]);

    return ...;
});
```

### useRefresh

```ts
export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
): void;
```

This hook helps you call a `function` when the parameters have been changed.

```ts
import {useEffect, useState} from 'react';
import {useRefresh} from '@airma/react-hooks-core';

function useIntervalCountDown() {
    const [count, setCount] = useState(60);
    const [s, setS] = useState(count);
    useEffect(()=>{
        const id = window.setInterval(()=>{
            setCount(c=>c-1);
        },1000);
        return ()=> {
            window.clearInterval(id);
        }
    },[]);
    
    useRefresh((seconds)=>setS(seconds<0?0:seconds), [count]);
    
    return s+'s';
}
```

### useUnmount

```ts
export declare function useUnmount(destroy: () => void): void;
```

This hook is created for listen the unmount effect of functional component.

## Recommends

We recommend you use these packages for a better experience.

1. [@airma/react-hooks](https://www.npmjs.com/package/@airma/react-hooks): It provides simple APIs: `usePersistFn`, `useMount`, `useUpdate` for usage.
2. [@airma/react-state](https://www.npmjs.com/package/@airma/react-state): It provides a model hook usage for manage react states.
3. [@airma/react-effect](https://www.npmjs.com/package/@airma/react-effect): It provides asynchronous state manage hooks for easy usage.

## Examples

### @airma/react-hooks

```ts
import { useUpdate } from '@airma/react-hooks';
import type { User } from './type';

export function useUserUpdateReload(user: User){
    const { orders, messages } = user;
    useUpdate(([prevOrders, prevMessages])=>{
        if (
            orders.length !== prevOrders.length ||
            messages.length !== prevMessages.length
        ) {
            window.location.reload();
        }
    }, [orders, messages]);
}
```

### @airma/react-state

```ts
import {memo} from 'react';
import {useModel} from '@airma/react-state';

const Layout = memo(({interval}:{interval: number})=>{
    const instance = useModel((state: number)=>{
        return {
            value: state,
            isNegative: state < 0,
            increase(): number{
                return state + interval;
            },
            decrease(): number{
                return state - interval;
            }
        }
    }, 0);
    
    const {
        value,
        isNegative,
        increase,
        decrease
    } = instance;

    return ......;
});
```

### @airma/react-effect

```ts
import {memo} from 'react';
import {useQuery} from '@airma/react-effect';
import {fetchUser} from './session';

const App = memo(({userId}:{userId: number})=>{
    const [
        {
            data: user,
            isFetching,
            loaded,
            error
        },
        trigger
    ] = useQuery(fetchUser, [ userId ]);
    
    const refetch = ()=>{
        trigger(userId);
    };
    
    return ...;
});
```