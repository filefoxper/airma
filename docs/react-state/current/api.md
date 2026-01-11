# API

## useModel

```ts
function useModel(modelFn/modelKey/modelStore, initialState?): instance
```

Parameters:

* modelFn/modelKey/modelStore - A model function/model key/model store.
* initialState - Optional, a initial state for store initializing.

Returns

* A store instance object (Proxy object). Call the method from instance, can generate a next state, and refreshes instance.

## useControlledModel

```ts
function useControlledModel(
    modelFn, 
    state, 
    onChange
): instance
```

Parameters

* modelFn - A model function.
* state - An controlled state for generate instance.
* onChange - A callback to feedback state changes.

Explain

This API can help you reuse model more easier. It is drove by an outside state, and feedback state changes outside.

Returns

* A instance object, call the action method from instance, can generate a next state, and feedback by calling the onChange callback.

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
// select result from instance, 
// if the model is produced, 
// the instance is the produced object
type Selector=(instance)=>selectResult;

// telling API how to make judgment about if the selected result has been changed
type Equality=(prevInstance,currentInstance)=>boolean

function useSelector(
  // store/key
  modelKey/modelStore,
  // selector
  selector?: Selector,
  // select result equality for judging result is changed.
  equality?: Equality;
): selectResult;
```

Parameters

* modelKey/modelStore - A model key/model store.
* selector - A selector callback to select data from instance.
* equality - Optional callback, for telling API how to make judgment about if the selected result has been changed.

Explain

This API is for selecting data from store instance or the produced object when the store is refreshed by action. When a state change happens, **useSelector** refreshes and selects data from instance, only when the selected result is changed, the component rerenders. So, it is often used for reducing the frequency of component render.

Returns

* A result selected from store instance.

Example

Select with local selector.

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

It is a `Context.Provider` component for [Dynamic store state management](index?id=dynamic-store-state-management).

```ts
const Provider: FC<{
  value:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  children?: ReactNode;
}>;
```

Props

* value - model keys or objects contains key: {key: ModelKey}.
* children - react nodes

Returns

* react nodes

## provide

The HOC mode for Provider.

```ts
function provide(
  keys: Array<ModelKey> | ModelKey | Record<string, ModelKey>
): ((component: ComponentType) => typeof component)&{
  to: (component: ComponentType) => typeof component
};
```

Parameters

* keys - model keys or objects contains key: {key: ModelKey}.

Returns

* A callback which accepts a React Component, and returns a **HOC** of the parameter Component with a out **Provider** wrap.


Explain

It is a **HOC** usage for **Provider**.

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

or 

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

const App = provide(key).to(()=>{
    const {...} = useModel(key);
    const data = useSelector(key, s=>s.data);
});
```

## createKey

```ts
function createKey(
    modelFn,
    initialState?
): ModelKey;
```

Parameters

* modelFn - model function.
* initialState - Optional, for store initializing.

Returns

* A model [key](concepts?id=key).

## createStore

```ts
function createStore(
    modelFn,
    initialState?
): ModelStore;
```

Parameters

* modelFn - model function.
* initialState - Optional, for store initializing.

Returns

* A model [store](concepts?id=store).

## shallowEqual

To do a shallow compare with two object, if they are equal with each other, it returns `true`, else it returns `false`.

```ts
function shallowEqual<R>(prev: R, current: R): boolean;
```

Explain

This API is for **useSelector** equalFn to check out if the selected result is changed.

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

It is a simplified API for using hooks in **@airma/react-state**. It also can be used for checking the typescript problems about the parameter model function. 

```ts
interface StoreApi {
  // simplify useModel to static store
  useModel,
  // simplify useSignal to static store
  useSignal,
  // simplify useSelector to static store
  useSelector,
  // set initial state to initialize static store,
  // returns current store instance.
  instance:(initialState?)=>Instance,
}

interface KeyApi {
  // simplify useModel to dynamic store
  useModel,
  // simplify useSignal to dynamic store
  useSignal,
  // simplify useSelector to dynamic store
  useSelector
}

interface Api {
  // produce an instance usage object
  produce,
  // simplify useModel to local store
  useModel,
  // simplify useSignal to local store
  useSignal,
  // simplify useControlledModel
  useControlledModel,
  // create store, returns hooks to static store
  createStore: (initialState?) => StoreApi;
  // create key, returns hooks to dynamic store
  createKey: (initialState?) => KeyApi;
}

// wrap a model function to full hooks api usage
function model(modelFn): (typeof modelFn) & Api;

// It creates a field with callback return value. 
// The field value is regenerated and cached when the field deps change.
model.createField = function(callback:()=>any, deps?:any[]);

// It creates a simple method without action dispatching.
model.createMethod = function(callback:(...args:any[])=>any);
```

Parameters

* modelFn - A model function

Returns

A wrapped model function with [APIs](guides?id=model).

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

 A field object with a `get` method for getting the newest or cached field value. If there is no `deps` parameter, the `get` method returns a newest value. If there are `deps` parameters, the `get` method diffs the `deps`, and returns a cached value.

usage [reference](guides?id=createfield).

### model.createMethod

It is a static method for creating a normal method which is different with action method for model instance.

```ts
function createMethod<R extends (...args:any[])=>any>(callback:R): ()=>R;
```

## ConfigProvider

It is a provider component. It is used to config some feature for **@airma/react-state**.

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

**@airma/react-state** does not dependent to **react-dom**. Before `react@18.0.0` unstable_batchedUpdates is still needed for enhancing state change performance.

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
  (options:{cutOff?:boolean}):instance;
  useEffect:(call:()=>void|(()=>void))=>EffectOn
  useWatch:(call:()=>void)=>EffectOn
}

// If the `options.cutOff` is `true`,
// the signal instance will not feedback the fields usage to useSignal,
// and useSignal will not rerender component when this signal instance fields change.
type Signal = ((options:{cutOff?:boolean})=>instance) & {
  useEffect:(call:()=>void|(()=>void))=>EffectOn
  useWatch:(call:()=>void)=>EffectOn
}

function useSignal(modelOrKeyOrStore, initialState?):Signal
```

* modelOrKeyOrStore - A model function/model key/model store.
* initialState - Optional, a initial state for model initializing.

Returns

* A signal callback function to generate a newest store instance.

Explain

It is different with **useModel** by returns a instance generator function. Call this function can get a newest instance object in any where. And only the fields from instance change can make component rerender.

It also provides hook methods **useEffect** and **useWatch** to handle side effect for action methods.

* useEffect - It is used to handle side effect for renders caused by action methods.
* useWatch - It is used to handle actions dispatched from model connection.

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

* The **signal** callback function returns by useSignal is not recommended to be used in a child component **useLayoutEffect stage**. For the render fields usage computing process is shut down in **useLayoutEffect**, it may add some dirty fields which are not expected to appear in render usage.

Take more infos from [examples](guides?id=usesignal).