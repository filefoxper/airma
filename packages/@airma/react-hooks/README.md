[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks.svg?style=flat-square

# @airma/react-hooks

It is a simple tool for providing some simple and useful react hooks for `@airma/react-*` tools. You can use it too.

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
import {usePersistFn} from '@airma/react-hooks';

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
  callback: (prevDeps: undefined | T) => (() => void) | void,
  deps?: T
): void;
```

This hook is created for listen the update effect of functional component.

```ts
import {memo, useState} from 'react';
import {useUpdate} from '@airma/react-hooks';

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

### useUnmount

```ts
export declare function useUnmount(destroy: () => void): void;
```

This hook is created for listen the unmount effect of functional component.