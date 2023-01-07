# API

## useModel

```ts
function useModel<S, T extends Record<string|number, any>>(
  model: (state:S)=>T
): T;
function useModel<S, T extends Record<string|number, any>, D extends S>(
  model: (state:S)=>T,
  state: D,
  option?: { refresh?: boolean; autoLink?: boolean }
): T;
```

Parameters:

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
* state - Optional, a default state for model initial.
* option - Optional, an optional config for opening `refresh` and `autoLink` mode.

Explain

1. `option.refresh`: When open the `refresh` optional config, `useModel` follows the change of state. That means every change of state parameter will lead a refresh for instance. You can consider it as [useRefreshModel](/react-state/api?id=userefreshmodel).
2. `option.autoLink`: When open the `autoLink` optional config, `useModel` creates a local state instead a unavailable store state. You can refer to the [guides detail](/react-state/guides?id=autolink) to learn it.

Returns

* A instance object, call the action method from instance, can generate a next state, and refreshes instance with this new state.

Example

```ts
// local state usage
import {useModel} from '@airma/react-state';

const counter = (state:number)=>({
    count: state,
    increase:()=> state + 1,
    decrease:()=> state - 1
});

// customized hook
const useCounter = ()=>{
    const {
        count,
        increase,
        decrease,
    } = useModel(counter);

    ......
};
```

or 

```ts
// scope state usage
import React from 'react';
import {
    useModel, 
    factory,
    ModelProvider
} from '@airma/react-state';

// use factory API to make a key to store
const counter = factory((state:number)=>({
    count: state,
    increase:()=> state + 1,
    decrease:()=> state - 1
}));

// deep component
const Counter = ({name}:{name:string})=>{
    // use factory model `counter` as key to store
    const {
        count,
        increase,
        decrease,
    } = useModel(counter);

    ......
};

export const App = ()=>{
    // ModelProvider to create store with factory model
    return (
        <ModelProvider value={counter}>
            <Counter name="count_1">
            <Counter name="count_2">
        </ModelProvider>
    );
}
```

## useControlledModel

```ts
function useControlledModel<
  S,
  T extends Record<string|number, any>,
  D extends S
>(
    model: (state:S)=>T, 
    state: D, 
    onChange: (s: S) => any
): T;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
* state - An outside state for refresh model instance.
* onChange - A callback to feedback a next state outside.

Explain

This API can help you reuse model more easier. It is drived by an outside state, and feedback a next state to change the outside state when the action method from instance calls. It has no state inside. You can refer to [guide section](/react-state/guides?id=controlled-model) for detail.

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

## useRefreshModel

```ts
function useRefreshModel<
  S,
  T extends Record<string|number, any>,
  D extends S
>(
  model: (state:S)=>T,
  state: D,
  option?: { autoLink?: boolean }
): T;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
* state - An outside state for refresh model instance.
* option - Optional, an optional config for opening `autoLink` mode.

Explain

This API is a shortcut for `useModel(model, state, {refresh:true})`. When the state parameter changes, it refreshes the instance. When the action method from instance is called, it refreshes the instance. It is different with `useControlledModel`, for it maintains an own state or links with a store state (when use a factory model). So, it is just follow the outside state change, it will not feedback state outside.

Returns

* A instance object, call the action method from instance, can generate a next state, and refreshes instance with this new state.

Example

```ts
import React from 'react';
import {useRefreshModel} from '@airma/react-state';
import {counter} from './model';

const App = ()=>{
    const [state, setState] = useState(0);

    const {
        count,
        // the action method changes its own state: count,
        // it can not change state from useState
        increase,
        decrease,
    } = useRefreshModel(counter, state); 
    // the state change can refresh count

    const resetCountTo = (c)=>{
        setState(c);
    };

    return ......;
}
```

## useRefresh

```ts
function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
): void;
```

Parameters

* method - Any function callback.
* params - The parameters for method, it is an array type object.

Explain

This API is a supplement for `useRefreshModel`. Sometimes, we don't want to watch and change a whole state, and we can use it for a partial watch and change. It watches if the params are changed, and then call the method function with the newest params.

```ts
// you can consider this code as `useRefresh`
function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
) {
  useEffect(() => {
    method(...params);
  }, [method, ...params]);
}
```

Returns

* void

## useSelector

```ts
function useSelector<
  S,
  T extends Record<string|number, any>,
  C extends (instance: T) => any
>(
  factoryModel: (state:S)=>T,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
```

Parameters

* factoryModel - A factory model, it should be wrapped by [factory](/react-state/api?id=factory) API.
* selector - A callback to select properties from instance which is refreshed by the matched store state.
* equalFn - Optional callback, it is used to provide a comparator for comparing if the result of `selector` has been changed. Only when the result of `selector` has been changed, it drive the component which uses it to render. In default, it compares the result change by using `===` expression.

Explain

This API only can be used to link a matched store with factory model. It can select data from instance which is refreshed by the matched store state. If no matched store is found, it throws an error. When a state change happens, `useSelector` refresh and select data from the instance, only if the selected result is changed, it drives component to render. So, it is often used for reducing the frequency of component render.

Returns

* A result selected from instance refreshd by the matched store state.

Example

```ts
import React from 'react';
import {ModelProvider, factory, useSelector} from '@airma/react-state';

// use factory API to make a key to store
const counter = factory((state:number)=>({
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
        <ModelProvider value={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </ModelProvider>
    );
}
```

## ModelProvider

```ts
type Factory=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

const ModelProvider: FC<{
  value:  Array<Factory> | Factory | Record<string, Factory>;;
  children: ReactNode;
}>;
```

Props

* value - Factorys, it can be a collection of factory models or just a factory model.
* children - react nodes

Returns

* react nodes

## factory

```ts
type Factory=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

function factory<S,T extends Record<string|number,any>>(
    model: (state:S)=>T,
    defaultState?: S
):Factory;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
* defaultState - Optional, provide a default state for store initial.

Explain

If you want to learn how to use `pipe`, please review the [guide detail](/react-state/guides?id=pipe).

Returns

* A factory model, which can be provided to `ModelProvider` for generating a store, and be provided as key to link the store state for `useModel` or `useSelector`.

## shallowEqual

```ts
function shallowEqual<R>(prev: R, current: R): boolean;
```

Explain

This API is for `useSelector` equalFn to compare the selected result changes.

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