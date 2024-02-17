# API

## useModel

```ts
function useModel<S, T extends Record<string|number, any>>(
  model: (state:S)=>T
): T;
function useModel<S, T extends Record<string|number, any>, D extends S>(
  model: (state:S)=>T,
  defaultState: D
): T;
function useModel<S, T extends Record<string|number, any>, D extends S>(
  model: ModelKey<(state:S)=>T>,
  defaultState?: D
): T;
```

Parameters:

* model - A function accepts a state parameter, and returns an object to provide display data and action methods. It also can be a model key, created by [createKey](/react-state/api?id=createkey) API.
* defaultState - Optional, a default state for model initializing.

Returns

* A instance object (Proxy object). Call the action method from instance, can generate a next state, and refreshes instance.

## useControlledModel

```ts
function useControlledModel<
  S,
  T extends Record<string|number, any>,
  D extends S
>(
    model: (state:S)=>T, 
    state: D, 
    onChange: (nextState: S) => any
): T;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
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
export declare function useSelector<
  R extends ModelKey<AirReducer<any, any>>,
  C extends (instance: ReturnType<R>) => any
>(
  modelKey: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
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
  StoreProvider, 
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
        <StoreProvider keys={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </StoreProvider>
    );
}
```

## Provider

It is a `Context.Provider` component for [React.Context state-management](/react-state/index?id=reactcontext-state-management).

```ts
const Provider: FC<{
  keys:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  children: ReactNode;
}>;
```

Props

* keys - model keys.
* children - react nodes

Returns

* react nodes

## provide

The HOC mode for Provider.

```ts
function provide(
  keys: Array<ModelKey> | ModelKey | Record<string, ModelKey>
): <P extends object>(component: ComponentType<P>) => typeof component;
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
function createKey<S,T extends Record<string|number,any>>(
    model: (state:S)=>T,
    defaultState?: S
):ModelKey;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
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
    ModelProvider, 
    factory, 
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
declare interface StoreUsageApi<R extends AirReducer> {
  useModel: (state?: PickState<R>) => ValidReducerReturnType<R>;
  useSelector: <C extends (instance: ReturnType<R>) => any>(
    call: C,
    equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
  ) => ReturnType<C>;
}

declare interface StoreApi<R extends AirReducer> extends StoreUsageApi<R> {
  key: ModelKey<R>;
  with: <M extends ModelKey<AirReducer>>(
    ...key: ({ key: M } | M)[]
  ) => StoreApi<R>;
  asGlobal: () => StoreUsageApi<R>;
  provide: <P>() => (
    component: FunctionComponent<P> | NamedExoticComponent<P>
  ) => typeof component;
  provideTo: <P>(
    component: FunctionComponent<P> | NamedExoticComponent<P>
  ) => typeof component;
  Provider: FC<{ children?: ReactNode }>;
}

declare interface Api<R extends AirReducer> {
  useModel: ModelUsage<R>;
  useControlledModel: ControlledModelUsage<R>;
  createStore: (state?: PickState<R>) => StoreApi<R>;
}

declare function model<R extends AirReducer>(modelFn: ValidModel<R>): R & Api<R>;
```

Parameters

* modelFn - A model function

Returns

A wrapped model function with [APIs](/react-state/guides?id=model).

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

Notice, if the version of react you used is `>=18.0.0`, you can forget it.

```ts
import React from 'react';
import { render, unstable_batchedUpdates } from 'react-dom';
import App from '@/app';
import { ConfigProvider, GlobalConfig } from '@airma/react-state';

const root = document.getElementById('root');

// use `unstable_batchedUpdates` as a batchUpdate.
// It is often used in react with a lower version to 18.0.0
const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates
};

render(
  <React.StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
  root
);
```