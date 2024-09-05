# API

## useModel

```ts
function useModel(modelFnOrKey, defaultState?): instance
```

Parameters:

* modelFnOrKey - A function accepts a state parameter, and returns an object to provide display data and action methods. It also can be a model key, created by [createKey](/react-state/api?id=createkey) API.
* defaultState - Optional, a default state for model initializing.

Returns

* A instance object (Proxy object). Call the action method from instance, can generate a next state, and refreshes instance.

## useControlledModel

```ts
function useControlledModel(
    modelFn, 
    state, 
    onChange
): instance
```

Parameters

* modelFn - A function accepts a state parameter, and returns an object to provide display data and action methods.
* state - An outside state for refresh model instance.
* onChange - A callback to feedback a next state outside.

Explain

This API can help you reuse model more easier. It is drived by an outside state, and feedback a next state to change the outside state when the action method from instance calls. It has no state inside. You can refer to [guide section](/react-state/guides?id=usecontrolledmodel) for detail.

Returns

* A instance object, call the action method from instance, can generate a next state, and feedback this new state outside by the `onChange` callback.

Example

```ts
import React from 'react';
import {counter} from './model';
import {useControlledModel} from '@airma/react-state';

interface CounterProps {
    value:number;
    onChange(v:number):void
}

const ControlledCounter = ({value, onChange}: CounterProps)=>{
    const {
        count,
        increase,
        decrease,
    } = useControlledModel(counter, value, onChange);

    return ......
}

const App = ()=>{
    const [state, setState] = useState(0);
    return (
        <ControlledCounter value={state} onChange={setState}/>
    );
}
```

## useSelector

```ts
function useSelector(
  modelKey,
  selector,
  equalFn?
): ReturnType<C>;
```

Parameters

* modelKey - A model key, it should be a result of calling [createKey](/react-state/api?id=createkey).
* selector - A callback to select properties from instance which is refreshed by the matched store state.
* equalFn - Optional callback, for telling API how to make judgment about if the selected result has been changed

Explain

This API only can be used to link a matched store. It can select data from instance which is refreshed by the matched store state. If there is no matched store, it throws an error. When a state change happens, `useSelector` refreshes and selects data from the instance, only if the selected result is changed, it drives component to rerender. So, it is often used for reducing the frequency of component render.

Returns

* A result selected from instance refreshd by the matched store state.

Example

```ts
import React from 'react';
import {
  Provider, 
  createKey, 
  useSelector
} from '@airma/react-state';

// use createKey API to make a key to store
const counter = createKey((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Increase = ()=>{
    // select action method from instance,
    // the action method from instance is persistent,
    // so, useSelector will never drive `Increase` rerender again.
    const increase = useSelector(counter, instance=>instance.increase);

    return ......
}

const Decrease = ()=>{
    // same as `Increase`
    const decrease = useSelector(counter, instance=>instance.decrease);

    return ......
}

const Counter = ()=>{
    const count = useSelector(counter, instance=>instance.count);
    return ......
}

export default ()=>{
    return (
        <Provider value={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </Provider>
    );
}
```

## Provider

It is a `Context.Provider` component for [React.Context state-management](/react-state/index?id=reactcontext-state-management).

```ts
const Provider: FC<{
  value:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  children?: ReactNode;
}>;
```

Props

* value - model keys.
* children - react nodes

Returns

* react nodes

## provide

The HOC mode for Provider.

```ts
function provide(
  keys
): (component: ComponentType) => typeof component;
```

Parameters

* keys - model keys.

Returns

* A callback which accepts a React Component, and returns a `HOC` of the parameter Component with a out `Provider` wrap.


Explain

It is a `HOC` usage for `Provider`.

Example

```ts
import React from 'react';
import { 
    provide, 
    createKey, 
    useModel, 
    useSelector 
} from '@airma/react-state';
import model from './model';

const key = createKey(model);

const App = provide(key)(()=>{
    const {...} = useModel(key);
    const data = useSelector(key, s=>s.data);
});
```

## createKey

```ts
function createKey(
    modelFn,
    defaultState?
): ModelKey;
```

Parameters

* modelFn - A function accepts a state parameter, and returns an object to provide display data and action methods.
* defaultState - Optional, provide a default state for store initial.

Returns

* A model [key](/react-state/concepts?id=key).

## shallowEqual

To do a shallow compare with two object, if they are equal with each other, it returns `true`, else it returns `false`.

```ts
function shallowEqual<R>(prev: R, current: R): boolean;
```

Explain

This API is for `useSelector` equalFn to check out if the selected result is changed.

Example

```ts
import React from 'react';
import {
    useSelector,
    shallowEqual
} from '@airma/react-state';

const Counter = ()=>{
    // compare the shallow properties one by one.
    const {count, isNegative} = useSelector(counter, instance=>({
        count:instance.count,
        isNegative: instance.isNegative
    }), shallowEqual);
    return ......
}
```

## model

It is a simplified API for use `hooks` in `@airma/react-state`. It also can be used for checking the typescript problems about the parameter `model function`. 

```ts
interface GlobalStoreApi {
  useModel,
  useSignal,
  useStaticModel,
  useSelector
}

interface StoreApi {
  key,
  with:(
    ...stores: (StoreApi | ModelKey)[]
  ) => StoreApi,
  asGlobal: () => GlobalStoreApi,
  provide,
  provideTo: (
    component: ComponentType
  ) => typeof component,
  Provider: FC<{ children?: ReactNode }>,
  useModel,
  useSignal,
  useStaticModel,
  useSelector
}

interface Api {
  useModel,
  useSignal,
  useControlledModel,
  createStore: (defaultState?) => StoreApi;
}

function model(modelFn): (typeof modelFn) & Api;

model.createField = function(callback:()=>any, deps?:any[]);

model.createMethod = function(callback:(...args:any[])=>any);
```

Parameters

* modelFn - A model function

Returns

A wrapped model function with [APIs](/react-state/guides?id=model).

static methods

* createField - create field for model instance.
* createMethod - create normal method for model instance, and calling this method from instance can not change state.

### model.createField

It is a static method for creating a field for model instance.

```ts
function createField(callback:()=>any, deps?:any[]): {
  get:()=>ReturnType<typeof callback>,
};
```

Parameters

* callback - A callback to generate a field.
* deps - Optional, a dependencies array for caching field value.

Returns

 A field object with a `get` method for getting value.

usage [reference](/react-state/guides?id=createfield).

### model.createMethod

It is a static method for creating a normal method which is different with action method for model instance.

```ts
function createMethod<R extends (...args:any[])=>any>(callback:R): ()=>R;
```

## ConfigProvider

It is a provider component. It is used to config some feature for `@airma/react-state`.

```ts
export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
};

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
```

Props

* value - A config object.
* children - React Nodes

Explain

`@airma/react-state` does not dependent to `react-dom`. Before `react@18.0.0` unstable_batchedUpdates is still needed for enhancing state change performance.

Notice, if react>=18.0.0, this config is unnecessary.

```ts
import React from 'react';
import { render, unstable_batchedUpdates } from 'react-dom';
import App from './app';
import { ConfigProvider, GlobalConfig } from '@airma/react-state';

const root = document.getElementById('root');

// use `unstable_batchedUpdates` as a batchUpdate.
// It is often used in react with a lower version to 18.0.0
const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates
};

render(
  <ConfigProvider value={config}>
    <App />
  </ConfigProvider>,
  root
);
```

## useSignal

It is a hook Api to create a signal callback.

```ts
interface EffectOn {
  onActions: (
    filter: (ins: Instance) => ActionMethod[]
  ) => EffectOn;
  onChanges: (
    filter: (ins: Instance) => any[]
  ) => EffectOn;
}

interface Signal {
  useEffect:(call:()=>void|(()=>void))=>EffectOn
  useWatch:(call:()=>void)=>EffectOn
}

function useSignal(modelFnOrKey, defaultState?): (()=>instance)&;Signal
```

* modelFnOrKey - A function accepts a state parameter, and returns an object to provide display data and action methods. It also can be a model key, created by [createKey](/react-state/api?id=createkey) API.
* defaultState - Optional, a default state for model initializing.

Returns

* A signal callback function to generate a current instance object of model.

Explain

It is different with `useModel` by returns a instance generator function. Call this function can get a newest instance object in any where. And only the fields from instance change can make component rerender.

It also provides hook methods `useEffect` and `useWatch` to handle side effect for action methods.

* `useEffect` - It is used to handle side effect for renders caused by action methods.
* `useWatch` - It is used to handle actions dispatched from model connection.

Example

```ts
import React, { useState } from 'react';
import { model } from '@airma/react-state';

const counter = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Counter = ()=>{
    const signal = counter.useSignal(0);

    // handle side effect for renders caused by action methods.
    signal.useEffect((instance)=>{
        // This signal has'nt use `count` field in render stage, so it will not trigger rerender.
        // And that means this effect will not be called, if only `count` field changes.
        // When the `isNegative` field changes, this effect will be called.
        console.log('count effect change', instance.count);
    });

    // handle actions dispatched from model connection.
    signal.useWatch((instance)=>{
        // useWatch is very different with useEffect, it acccepts actions from model connection directly.
        // That makes it runs without before action renders, and no matter if the signal has used any field.
        console.log('count watch change', instance.count);
    });

    const {increase, decrease, isNegative} = signal();

    return (
        <div>
            <button onClick={increase}>+</button>
            <span>{isNegative? 'negative' : 'positive'}</span>
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

The filters from `onActions` and `onChanges` can help for reducing the frequency of side effect calling.

```ts
import React, { useState } from 'react';
import { model } from '@airma/react-state';

const counter = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Counter = ()=>{
    const signal = counter.useSignal(0);

    // handle side effect for renders caused by action methods.
    signal.useEffect((instance)=>{
        // The `count` field dependence added in `onChanges` filter,
        // makes this effect listens to the `count` field changes.
        // No matter if `count` is used in render stage.
        console.log('count effect change', instance.count);
    }).onChanges((ins) => [ins.count]);

    // handle actions dispatched from model connection.
    signal.useWatch((instance)=>{
        // Give the `onActions` filter the action method `increase`,
        // makes this effect listens to the `increase` action only.
        // So, when the `descrease` action dispatched, this effect will not be called.
        console.log('count watch change', instance.count);
    }).onActions((ins) => [ins.increase]);

    const {increase, decrease, isNegative} = signal();

    return (
        <div>
            <button onClick={increase}>+</button>
            <span>{isNegative? 'negative' : 'positive'}</span>
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

Note:

* The `signal` callback function returns by useSignal is not recommended to be used in a child component `useLayoutEffect stage`. For the render fields usage computing process is shuted down in `useLayoutEffect`, it may add some dirty fields which are not expected to appear in render usage.

Take more infos from [examples](/react-state/guides?id=usesignal).