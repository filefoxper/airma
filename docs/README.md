[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/core.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/core
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/core.svg?style=flat-square


# @airma

`@airma` is a scope package, which contains some useful react tools. Every child package supports react from version `16.8.0`.

* [@airma/react-state](/react-state/index.md)
* [@airma/restful](/restful/index.md)
* [@airma/react-effect](/react-effect/index.md)

<h2> @airma/react-state </h2>

`@airma/react-state` is a state management tool. It uses a method calling style to change state.

```tsx
import React from 'react';
import {render} from 'react-dom';
import {useModel} from '@airma/react-state';

const App = ()=>{

    // useModel create a instance from model function
    const instance = useModel((count:number)=>({
        count,
        isNegative: count<0,
        // method returns next parameter for model function
        increase:()=> count + 1,
        decrease:()=> count - 1
    }),0); // default parameter 0

    const {
        count, 
        isNegative,
        // call method returns a next parameter
        // for model function refreshment.
        decrease, 
        increase
    } = instance;

    return (
        <div>
            <div>start with a counter</div>
            <button onClick={decrease}>decrease</button>
            <span style={isNegative?{color:'red'}:undefined}>
                {count}
            </span>
            <button onClick={increase}>increase</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

If you want to manage a scope (or global) state with `@airma/react-state`, please take APIs like `createKey`, `StoreProvider`, `useSelector` to do it.

`@airma/react-state` has some very useful functions like `useControlledModel`, `useRefreshModel`, `useRefresh` for usage. Take the [introduce document](/react-state/index.md) to learn how to use it.
