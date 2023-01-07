[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma/react-state

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

The example above is using `useModel` to create a `count model instance`. By calling method `increase`/`decrease` from this instance, we can increase or decrease the `count` from `model instance`.

## Introduction

The principle for instance creating and refreshing is simple.

1. Provides a `model function` which returns an object with refresh methods and data for display.
2. API `useModel` creates a `instance` from `model function` and default parameter (state).
3. Calls `instance` method to generate a `next parameter` for `model function`.
4. API `useModel` refreshes `instance` by recalling `model function` with the `next parameter` again automatically.

### Why not setState?

Provide a `setState` API can make model more flexible. But it takes troubles too, when you want to test or reuse your model, you have to do more works.

Test examples between `setState` and `return`: 

```ts
// setState
const counter = (count:number, setState:(d:number)=>void)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            setState(count+1);
        },
        decrease(){
            setState(count-1);
        }
    }
}

// test
import {act} from 'xxx-react-test-lib';
import {useModel} from '@airma/fake-react-state';

const instance = useModel(counter,0);
const method = act(()=>instance.increase()));
......
expect(instance.count).toBe(1);
// this is a little boring
```

vs 

```ts
// return
const counter = (count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
}

// test
const instance = counter(0);
const nextInstance = counter(instance.increase());
expect(nextInstance.count).toBe(1);
```

Use `method return` to refresh instance makes model a pure function, you can test or reuse it more easier.

Reuse examples between `setState` and `return`:

```ts
const counter = (count:number, setState:(d:number)=>void)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            setState(count+1);
        },
        decrease(){
            setState(count-1);
        }
    }
}

const MyComp = (props)=>{
    const {count, onChange} = props;
    const instance = useMemo(()=>{
        return counter(count, onChange);
    },[count, onChange]);

    const handlePositiveDecrease = ()=>{
        // We have to modify counter model to make sure,
        // that the instance.count always >=0
    }

    ......
}
```

vs

```ts
const counter = (count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
}

const MyComp = (props)=>{
    const {count, onChange} = props;
    const instance = useMemo(()=>{
        return counter(count);
    },[count]);

    const handlePositiveDecrease = ()=>{
        // a composite way to make sure,
        // that the instance.count always >=0
        const result = instance.decrease();
        if(result<0){
            return;
        }
        onChange(result);
    }

    ......
}
```

So, you can know that `@airma/react-state` is a tool which manages state by method returning just like `redux` or `useReducer`.

If you are interested with this tool please take next section about [installing and browser supports](/react-state/install.md) or go to [concepts](/react-state/concepts.md) directly.