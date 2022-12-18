[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square


# @airma/react-state

`@airma/react-state` is a simple state management tool for react app.

It works like that:

```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

function App(){
    const {count, increase, decrease} = useModel((state:number)=>{
        const baseState = state >= 0? state : 0;
        return {
            count: baseState,
            increase(){
                return baseState + 1;
            },
            decrease(){
                return baseState - 1;
            }
        };
    },0);
    return (
        <div>
            <button onClick={decrease}>-</button>
            <span>{count}</span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

API `useModel` can generate an `instance` object by calling a `model` function with its default parameter. Call `instance` method can generate a new parameter, and then make `instance` to refresh itself by recalling the newest `model` and parameter again. 

It looks like `useReducer`, but more free for usage, you can forget `dispatch` now.

To make a state change sharing, you need to create a `factory`, and use it on a `RequiredModelProvider`, then use `useRequiredModel` or `useSelector` to link it.

```tsx
import React,{memo} from 'react';
import {render} from 'react-dom'
import {
  RequiredModelProvider,
  useRequiredModel,
  useSelector,
  factory
} from '@airma/react-state';

const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

// Use API `factory` to build a model factory.
// It can be used as a `function` key for instance fetching.
// A factory is not a store, it only can carry a default state.
const couterFactory =  factory(counter);

const Increase = memo(()=>{
  // use API `useSelector` to fetch the `increase` method.
  // The method from instance is persistent,
  // so, the none props memo component will not rerender.
  const increase = useSelector(couterFactory, c=>c.increase);
  return (
    <button onClick={increase}>+</button>
  );
});

const Decrease = memo(()=>{
  // same as the usage in `Increase`
  const decrease = useSelector(couterFactory, c=>c.decrease);
  return (
    <button onClick={decrease}>-</button>
  );
});

const CountValue = memo(()=>{
  // use API `useRequiredModel` can fetch a whole instance.
  const {count,isNegative} = useRequiredModel(couterFactory);
  return (
    <span style={isNegative?{color:'red'}:undefined}>{count}</span>
  );
});

function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
        {/* RequiredModelProvider can hold factories, */}
        {/* and create a instance store in it, */}
        {/* then we can use factory as key to fetch instance */}
        <RequiredModelProvider value={couterFactory}>
          <div>
            <Decrease/>
            <CountValue/>
            <Increase/>
          </div>
        </RequiredModelProvider>
      </div>
    );
}

render(<Counter index={1}/>, document.getElementById('root'));
```

As you can see, when click the button in Decrease/Increase component, the CountValue changes.

If the Counter element repeat in one component, what happens? Do they share state changes too?

```tsx
......

render(
  <div>
    <Counter index={1}/>
    <Counter index={2}/>
  </div>
)
```

Though the Counter elements have a same factory, but they can not share state change with each other, for they have different `RequiredModelProvider` elements.

If we have another more closer `RequiredModelProvider` hold a different factory, does `useRequiredModel` find a wrong instance?

```tsx
function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
        <RequiredModelProvider value={couterFactory}>
          <div>
            <RequiredModelProvider value={otherFactory}>
              <Decrease/>
            </RequiredModelProvider>
            <CountValue/>
            <Increase/>
          </div>
        </RequiredModelProvider>
      </div>
    );
}
```

The instance in `Decrease` component is still from `<RequiredModelProvider value={couterFactory}>` store.

If there is no `RequiredModelProvider` which provides a right model store, what happens?

```tsx
function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
          <div>
            <RequiredModelProvider value={otherFactory}>
              <Decrease/>
            </RequiredModelProvider>
            <CountValue/>
            <Increase/>
          </div>
      </div>
    );
}
```

It throws errors. 

If you want `useRequiredModel` work with a local instance when the store instance fetching is failed, you can open `autoRequired` option config to support this feature.

```ts
useRequiredModel(couterFactory,0,{autoRequired:true})
```

In this case, you have to provide a default state.

If we want to change a model to hold the sharing instance state parameter, what we can do?

```tsx
// the factory model created by API `factory`,
// owns a `pipe` static method,
// use this method, you can switch to a new model,
// it will not affect other usages of origin factory model.
const {reset} = useRequiredModel(counterFactory.pipe((count:number)=>({
  reset:()=>0
})));
```

`pipe` is very useful to change a model from store temporarily.

## API

### useModel

It is used to create a local model instance. Call the instance method can refresh instance by recalling model function again. 

Open option config `required` can make `useModel` retrieving a model instance from the most closest model store in `RequiredModelProvider` which contains a same model. If retrieving is failed, it throws an error, for example, the usage is out of a `RequiredModelProvider`, or there is no match factory key in parent `RequiredModelProvider`. You can use `useRequiredModel` API for a no config usage.

Open option config `autoRequired` with `required` can help `useModel` build a local instance when retrieving from `RequiredModelProvider` is failed.

Open option config `refresh` can make `useModel` follow the state parameter. When the state parameter changes, it refresh model instance too. You can use `useRefreshModel` for a no config usage.

* model - A function accepts a state parameter, and generate a model instance. Call the method from this instance can refresh instance.
* state - A default state for local instance. When `refresh` config is open, it is a state to follow.
* option - An optional config contains optional properties `refresh`, `autoRequired` and `required`.

```ts
type AirModelInstance = Record<string, any>;

type AirReducer<S, T extends AirModelInstance> = (state:S)=>T;

function useModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state?: D,
    option?: {refresh?:boolean, required?:boolean, autoRequired?: boolean}
): T
```

ex:

```tsx
import {
  useModel,
  RequiredModelProvider,
  factory
} from '@airma/react-state';

const model = (state: StateType)=>({
  prop: fromState(state),
  changeStateMethod(...args:any[]): StateType{
    return nextState(state, ...args);
  }
});

const factoryModel = factory(model,defaultState);

const LocalInstance = ()=>{
  // a local instance
  const {prop, changeStateMethod} = useModel(model,defaultState);
  return <div>......</div>
};

const StoreInstance = ()=>{
  // only can be used in a right RequiredModelProvider
  const {prop, changeStateMethod} = useModel(factoryModel,defaultState,{
    required:true
  });
  return <div>......</div>
}

const StoreOrLocalInstance = ()=>{
  // can be used in or out a right RequiredModelProvider,
  // if out, create a local one.
  const {prop, changeStateMethod} = useModel(factoryModel,defaultState,{
    required:true,
    autoRequired:true
  });
  return <div>......</div>
}

const App = ()=>{
  return (
    <div>
    <LocalInstance/>
    <StoreOrLocalInstance/>
      <RequiredModelProvider factory={factoryModel}>
        <StoreInstance>
        <StoreOrLocalInstance/>
      </RequiredModelProvider>
    </div>
  );
}
```

### useControlledModel

It is used to create a model instance, which links to an outside state, call method from instance, will trigger the `onChange` callback, and send next state outside through this callback, when the outside state changes, the instance refreshes.

* model - A callback accepts a state, and generate a model instance. Call the method from this instance can refresh instance.
* state - A outside state, when it changes, the instance refreshes.
* onChange - A callback for change outside state.

```ts
type AirModelInstance = Record<string, any>;

type AirReducer<S, T extends AirModelInstance> = (state:S)=>T;

function useControlledModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, onChange: (s: S) => any): T
```

With this API, your model can be more reusable. For example, you can use it in a conrolled Component to process `{value,onChange}` props.

```tsx
// model.ts
export const counter = (count:number)=>{
    return {
        count,
        increase(){
            return count + 1;
        },
        decrease(){
            return count - 1;
        }
    };
};

//......

// component.ts
import {useControlledModel} from '@airma/react-state';
import {counter} from './model';

const MyComp = ({
  value, 
  onChange
  }:{
    value:number, 
    onChange:(v:number)=>void
  })=>{
  const {
    count, 
    increase, 
    decrease
  } = useControlledModel(counter, value, onChange);
  return ...... 
}

function App(){
  const [value, setValue] = useState<number>(0);

  // link with useState.
  return (
    <div>
      <MyComp value={value} onChange={setValue}/>
      <div>{value}</div>
    </div>
  );
}
```

### useRefreshModel

It is a simplify API for `useModel(model,state,{refresh:true})`. It follows the parameter state change, and refresh instance with the newest state. It also response the method calling change, just like `useModel`.

Open option config `required` can make `useRefreshModel` links to a closest model store in `RequiredModelProvider` which contains a same model. You can use `useModel(model,state,{refresh:true,required:true})` or `useRequiredModel(model, state, {refresh:true})` to replace this config.

* model - A callback accepts newest state, and generate a model instance. Call the method from this instance can refresh instance.
* state - A state to follow.
* option - An optional config, contains `required`, `autoRequired`.

```ts
export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: {required?:boolean, autoRequired?:boolean}
): T;
```

ex:

```tsx
import {useEffect, useState} from 'react';
import {useRefreshModel} from '@airma/react-state';

const Comp = ()=>{
  const [state, setState] = useState(null);
  useEffect(()=>{
    (async function fetchData(){
      const data = await fetch();
      setState(data);
    })();
  },[]);
  const {prop, changeStateMethod} = useRefreshModel(model, state);
  return (
    <div>......</div>
  );
}
```

When the param state changes, model instance is refreshed by the new state param.

Suggest using this API with async state mangement library like [react-query](https://tanstack.com/query/v4).

### useRequiredModel

This API is from `useModel` API. It is used to retrieve model instance from the closest model store in `RequiredModelProvider` which contains a same model. If the instance can not be found, it throws an error.

Open option config `autoRequired` can help `useRequiredModel` build a local instance when retrieving from `RequiredModelProvider` is failed.

Open option config `refresh` can help you listen to the parameter state change, and refresh model instance in store with this state. You can use `useModel(model,state,{refresh:true,required:true})` or `useRefreshModel(model, state, {required:true})` to replace this config.

* model - A callback accepts a state, and generate a model instance.
* state - A default state for a local instance when `autoRequired` config is open, or a follow state when `refresh` config is open.
* option - An optional config, contains `required`, `autoRequired`.

```ts
export declare function useRequiredModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>,
    state?: D,
    option?:{refresh?:boolean, autoRequired?:boolean}
): T;
```

Refer to introduce for details.

### useRefresh

It is used to listen the params change, and call instance method to refresh a model instance with params.

* method - A method from model instance.
* params - Params for the method, it is an array for method parameters.

```ts
export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
):void;
```

ex:

```tsx
import {useEffect, useState} from 'react';
import {useModel,useRefresh} from '@airma/react-state';

const defaultState = {...};

const Comp = ()=>{
  const [state, setState] = useState(null);
  useEffect(()=>{
    (async function fetchData(){
      const data = await fetch();
      setState(data);
    })();
  },[]);
  const {prop, refresh} = useModel(model, defaultState);
  useRefresh(refresh,[state]);
  return (
    <div>......</div>
  );
}
```

When some of the params change, the method is called with these params.

Suggest using this API with async state mangement library like [react-query](https://tanstack.com/query/v4).

### factory

It is used to create a model factory. Model factory wraps a model function and returns a new model function, it can take a default state. The `RequiredModelProvider` uses it to create a instance store, and persists instance state in. `useRequiredModel` use it as a key to retrieve instance and current state from store.

* model - model function
* defaultState - it is optional, default state for model

```ts
export declare function factory<T extends AirReducer<any, any>>(
  model: T,
  defaultState?: T extends AirReducer<infer S, any> ? S : never
): T & {
  pipe<R extends AirReducer<any, any>>(otherModel:R):R
};
```

The wrapped model has a static method `pipe`. You can use `pipe` method to create a new model which uses the factory model state from store.

ex:

```tsx
import React, {memo} from "react";
import {
  factory, 
  RequiredModelProvider, 
  useRequiredModel
} from "@airma/react-state";

const count = (state:number)=>({
  count: state,
  increase: ()=> state + 1,
  decrease: ()=> state - 1
})

const countFactory = factory(count);

const myFactory = {
  count: factory(count)
};

const Reset = memo(()=>{
  const resetModel = (count:number)=>[
      count,
      ()=>0
    ] as [number,()=>number];
  const {value, reset} = useRequiredModel(
    // use pipe to link state to another model
    countFactory.pipe(resetModel)
  );
  return <button onClick={reset}>reset</button>
});

const Counter = memo(()=>{
  return (
    <RequiredModelProvider value={myFactory}>
      ......
    </RequiredModelProvider>
  );
});

// For the countFactory is different with myFactory,
// the instance for model count is different too
const InitialCounter = memo(()=>{
  return (
    <RequiredModelProvider value={countFactory}>
      <Reset/>
      ......
    </RequiredModelProvider>
  );
});
```

### RequiredModelProvider

* value - model factory collection, it can be a model wrapped by `factory`, or a collection like: `{key: factory(model, defaultState)}`.
* children - react nodes.

return react element of `RequiredModelProvider`.

```ts
export declare const RequiredModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}>;
```

This provider is a `Provider` from `React Context`, it generates a model instance store from model factory, and persists instance states in.

### useSelector

It is used to select properties from a store instance which are helpful for your component. If the selected data changes it refreshes. It can help you reduce your component render frequency.

This API can only works in a `RequiredModelProvider`, if it can not find instance by factory model, it throws an error.

* factoryModel - A factory model created by `factory` API, just like a key for seeking instance from store.
* callback - A select callback, accepts the instance of `factoryModel`, you can pick the interested properties include methods, and rebuild an object for usage.
* equalFn - A optional callback, accepts previous and current instance as param, and returns a boolean result. When useSelector receives an update notice, it calls this callback and use the result to determine update or not. If returns `true`, it ignores the update notice.

```ts
export declare function useSelector<
  S,
  T extends AirModelInstance,
  C extends (instance: T) => any
>(
  factoryModel: AirReducer<S | undefined, T>,
  callback: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
```

Returns the select `callback` returns.

ex:

```tsx
import React,{memo} from 'react';
import {render} from 'react-dom'
import {
  RequiredModelProvider,
  useSelector,
  factory,
  shallowEqual
} from '@airma/react-state';

const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

// Use API `factory` to build a model factory.
// It can be used as a `function` key for instance fetching.
// A factory is not a store, it only can carry a default state.
const couterFactory =  factory(counter);

const Increase = memo(()=>{
  // use API `useSelector` to fetch the `increase` method.
  // The method from instance is persistent,
  // so, the none props memo component will not rerender.
  const increase = useSelector(couterFactory, c=>c.increase);
  return (
    <button onClick={increase}>+</button>
  );
});

const Decrease = memo(()=>{
  // same as the usage in `Increase`
  const decrease = useSelector(couterFactory, c=>c.decrease);
  return (
    <button onClick={decrease}>-</button>
  );
});

const CountValue = memo(()=>{
  const {
    count,
    isNegative
  } = useSelector(couterFactory, ({count, isNegative})=>({
    count, isNegative
  }),shallowEqual);
  // use `shallowEqual` API to compare a temporary 
  // created select result, is helpful to reduce render frequency
  return (
    <span style={isNegative?{color:'red'}:undefined}>{count}</span>
  );
});
```

### useLocalSelector

It is used to select a local model instance. You can even use it to support async operation.

* model - A model function.
* callback - A select callback, accepts the instance of `model`, you can pick the interested properties include methods, and rebuild an object for usage.
* defaultState - default state for model instance initial.

```ts
export declare function useLocalSelector<
    S,
    T extends AirModelInstance,
    C extends (instance: T) => any,
    D extends S
>(
    model: AirReducer<S | undefined, T>,
    callback: C,
    defaultState?:D
): ReturnType<C>
```

Returns the select `callback` returns.

ex:

```tsx
const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

const {count,asyncIncrease} = useLocalSelector(counter,(instance)=>(
  {
    ...instance,
    async asyncIncrease(){
      await new Promise((r)=>setTimeout(r,1000));
      instance.increase();
    }
  }
));
```

### shallowEqual

It is used to help `useSelector` API compare the previous and current instance, and determine if it should update or not when `useSelector` received an update notice from store.

```ts
export declare function shallowEqual<R>(previous: R, current: R): boolean;
```

If it returns true, it means the two instances are shallow equals.

### useRequiredModelState

It is used to set state param for a store relative model factory usage.

* factoryModel - A factory model
* defaultState - An optional default state, if the model has not been operated, the default state will be setted.

```ts
export declare function useRequiredModelState<
    S,
    T extends AirModelInstance,
    D extends S
>(
    factoryModel: AirReducer<S | undefined, T>,
    defaultState?: D
): [S | undefined, (s: S | undefined) => void]
```

Returns a tuple array `[state, setState]`. You can call `setState` to change a store instance state, and refresh instance immediately.

## Tips

The `useSelector` API can support async state operation. But it is not helpful for reduce the component refresh frequency.

```tsx
const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

const countFactory = factory(counter,0);

const {count,asyncIncrease} = useSelector(countFactory,(instance)=>(
  {
    ...instance,
    async asyncIncrease(){
      await new Promise((r)=>setTimeout(r,1000));
      instance.increase();
    }
  }
));
```

## Persistent methods

The methods from `useModel` instance is persistent, so, you can pass it to a memo component directly, it can improve your app performance.

## Work with closure data

Yes, the methods are persistent, but you still can use closure data in the model function, it updates everytime, when the instance is refreshing.

## Security for producing state

The APIs from like `useModel`, `useRefreshModel`, `useRequiredModel` are secure for state update. The state is outside of react system, so every update from methods is a secure producing process. If you want to use `useState` to replace the job, you have to call it like: `setState((s)=>s+1)`.

### Less change context

When the state in `RequiredModelProvider` model store changes, it don't rerender the whole `RequiredModelProvider` component, but only notify the context end `useRequiredModel` and `useSelector`, then the `useRequiredModel` works with `setState` from `useState`. If you want to reduce the component render frequency, use API `useSelector` and `shallowEqual`.

## Typescript check

`@airma/react-state` is a typescript support library, you can use it with `typescript` for a better experience. 

It checks if the input `state` type is same with the param default `state` type. 

If the method returning type is same with param default `state` type, and so on.

## Async state management

There is an unofficial async state operation `useSelector` and `useLocalSelector`, but we still suggest you works the async state with [react-query](https://tanstack.com/query/v4), you can use `useRefresh` or `useRefreshModel` to adapt the async state management.

## Browser Support 

We support the browsers:

```
chrome: '>=58',
edge: '>=16',
firefox: '=>57',
safari: '>=11'
```

If you want to support less version browsers, you'd better have your own polyfills.

## End

We hope you can enjoy this tool, and help us to enhance it in future.

