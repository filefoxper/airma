[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square


# @airma/react-state

`@airma/react-state` is a simple state management tool for react app with typescript ( javascript ), you can use it to replace `useReducer`.

`@airma/react-state` works like that:

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

What you need to do is providing a callback which accepts a state (any type) param, and returns an object or array `instance`. Then choose a hook API like `useModel` to generate `instance` by calling the callback. Calling methods from `instance` can generate a new state, and `@airma/react-state` will use this new state as a new param to refresh instance by recalling callback again. This callback function is a `model` in `@airma/react-state`. 

It looks like `useReducer`, but more free for usage, you can forget `dispatch` now.

As a standard for state management libraries, global state sharing is so important, that makes `@airma/react-state` to do a support. A fixed global store object for state sharing is so terrible, that makes your component fixed by this store, and difficult for reusing again.  `@airma/react` provides a new way for relieving the pain of fixed global store, and makes a good typescript support for it.

Use `requireModels` API can create a global model `factory`. Pass the `factory` to `RequiredModelProvider` Component can persist a new store. We can use `useRequiredModel` API and global model `factory` to retrieve a `scope model instance` from the closest parent `RequiredModelProvider` Component which contains the `factory`.

```tsx
import React,{memo} from 'react';
import {render} from 'react-dom'
import {
  requireModels,
  RequiredModelProvider,
  useRequiredModel
} from '@airma/react-state';

const counter = (count:number = 0) =>{
  return {
    count,
    isNegative: count<0,
    increase:()=>count+1,
    decrease:()=>count-1
  };
};

const modelFactory =  requireModels((factory)=>({
  counter:factory(counter)
}));

const Increase = memo(()=>{
  const {count,increase} = useRequiredModel(modelFactory.counter);
  return (
    <button onClick={increase}>{count}++</button>
  );
});

const Decrease = memo(()=>{
  const {count,decrease} = useRequiredModel(modelFactory.counter);
  return (
    <button onClick={decrease}>{count}--</button>
  );
});

const CountValue = memo(()=>{
  const {count,isNegative} = useRequiredModel(modelFactory.counter);
  return (
    <span style={isNegative?{color:'red'}:undefined}>{count}</span>
  );
});

function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
        <RequiredModelProvider value={modelFactory}>
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

As you can see, when click the button in Decrease/Increase component, the CountValue changes. The components with same store factory share state with each other.

If we use Counter component twice in one component, what happens? The two Counter component will share the state?

```tsx
......

render(
  <div>
    <Counter index={1}/>
    <Counter index={2}/>
  </div>
)
```

The state about two Counter is different, they have different state, for they have different `RequiredModelProvider` instance, so the Counter is very easy for reusage, and not sharing state with each other.

If we have another more closer `RequiredModelProvider` hold a different factory, does `useRequiredModel` go to a wrong model?

```tsx
function Counter({index}:{index:number}){
    return (
      <div>
        counter:{index}
        <RequiredModelProvider value={modelFactory}>
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

The model in `Decrease` component is still from `<RequiredModelProvider value={modelFactory}>` store instance, unless the `otherFactory` is the same object with `modelFactory`, so the model finding is credible, it will not be affected by another source from a more closer `RequiredModelProvider`.

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

As we can see, the components works with their own local state. So, `useRequiredModel` works a local model from model factory if it can not find a correct model factory.

## API

### useModel

It is used to create a model instance, which persist a local state, and you can call the instance method to change state, and refresh the instance for next render.

* model - A callback accepts newest state, and generate a model instance. Call the method from this instance can refresh instance.
* state - A default state for model refresh. It is optional, and default with `undefined`.
* option - An optional config, you can set `{refresh: true}`, and the instance will be refreshed by the param state change.

```ts
type AirModelInstance = Record<string, any>;

type AirReducer<S, T extends AirModelInstance> = (state:S)=>T;

function useModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state?: D,
    option?: {refresh:boolean}
): T
```

### useTupleModel

It is used to create a tuple array `[state, instance]`, you can call the instance method to change state, and refresh `[state, instance]` for next render.

* model - A callback accepts newest state, and generate a model instance. Call the method from this instance can refresh instance.
* state - A default state for model refresh.
* onChangeOrOption - An optional param. If it is a callback, `useTupleModel` goes to a controlled mode, it only accepts state change, and uses this callback to change state outside, you can use `useControlledModel` to do this too. If it is an option config, you can set `{refresh: true}`, and the instance will be refreshed by the param state change.

```ts
type AirModelInstance = Record<string, any>;

type AirReducer<S, T extends AirModelInstance> = (state:S)=>T;

function useTupleModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state: D,
    onChangeOrOption?: ((s:S)=>any)|{refresh:boolean}
): [S, T]
```

With this api, you can split state and methods like:

```tsx
const [count, {increase, decrease}] = useTupleModel((state:number)=>{
    return {
        increase(){
            return state + 1;
        },
        decrease(){
            return state - 1;
        }
    };
},0);
```

### useControlledModel

It is used to create a model instance, which links to an outside state, call method from instance, will trigger the `onChange` callback, and send next state outside through this callback, when the outside state changes, the instance refreshes.

* model - A callback accepts newest state, and generate a model instance. Call the method from this instance can refresh instance.
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

With this API, your model can be more reusable. For example, you can use it to a conrolled Component with a `{value,onChange}` props.

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

  return (
    <div>
      <MyComp value={value} onChange={setValue}/>
      <div>{value}</div>
    </div>
  );
}
```

### useRefreshModel

It is used to create a model instance, which persist a local state and response to a outside state, you can call the instance method to change state, and refresh the instance for next render.

* model - A callback accepts newest state, and generate a model instance. Call the method from this instance can refresh instance.
* state - A outside state to refresh instance.

```ts
export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D
): T;
```

When the param state changes, model instance is refreshed by the new state param.

Suggest using this API with async state mangement library like [react-query](https://tanstack.com/query/v4).

### useRefresh

It is used to watch the dependencies change, and call instance method to refresh a model instance with dependencies.

* method - A method from model instance.
* params - Params for the method, it is an array for method parameters.

```ts
export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
):void;
```
When some of the params change, the method is called with these params.

Suggest using this API with async state mangement library like [react-query](https://tanstack.com/query/v4).

### requireModels

It is used to create a model factory. You can pass a callback returns a model callback or an object with model callback properties. The callback can accept a factory hold function as param, you should use it to hold your model.
1. `requireModels((factory)=>factory(model,?state))`  
2. `requireModels((factory)=>({key:factory(model,?state)}))`

* requireFn - A callback accepts a factory function as param, and generate a model factory.

```ts
export declare function requireModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(requireFn: (factory: HoldCallback) => T): T;
```

This API is for create a model factory, it can be used with `RequiredModelProvider`, and make state sharing possible. You can refer to the introduction before for a detail.

### RequiredModelProvider

* value - model factory created by `requireModels` API.
* children - react nodes.

return react nodes.

```ts
export declare const RequiredModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}>;
```

This provider is a `Provider` from `React Context`, it generates model instances from model factory, and persists them inside the `Provider` instance.

### useRequiredModel

It is used to retrieve a model instance from model instances which are created in a closest `RequiredModelProvider` with the same seeking factory. If the instance can not be found, it trys to create a local instance for working.

* model - A callback accepts a state, and generate a model instance.
* state - a default state for a local model, when the model instance can not be found.

Refer to introduce for details.

## Tips

The `state` property of model object is not necessary, it can be ignored, you can have some properties as you wish.

```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

function App(){
    const {count, isNegative, increase, decrease} = useModel((state:number)=>{
    return {
      count: state,
      isNegative: state<0,
      increase(){
        return state + 1;
      },
      decrease(){
        return state - 1;
      }
    };
  },0);

  return (
    <div>
      <div>react state ex 1</div>
      <div>
        <button onClick={decrease}>-</button>
          <span style={isNegative?{color:'red'}:undefined}>{count}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
}

render(<App/>, document.getElementById('root'));
```

The model function can return almost every instance extends `Record<string|number, any>`. Yes, you can write a tuple model yourself if you wish.

```tsx
import React from 'react';
import {render} from 'react-dom'
import {useModel} from '@airma/react-state';

const toggleModel = (v:boolean):[boolean, ()=>boolean] =>[ v, ()=>!v ];

function App(){
    const [visible, toggle] = useModel(toggleModel,false);
    return (
        <div>
            <button onClick={toggle}>toggle</button>
            <span style={!visible?{display:'none'}:undefined}>
              hellow world
            </span>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

As we can see it is very easy to describe state properties for usage.

## Persistent methods

The methods from `useModel` instance is persistent, so, you can pass it to a memo component directly, it can improve your app performance.

## Work with closure data

Yes, the methods are persistent, but you still can use closure data in the model function, it updates everytime, when the instance is refreshing.

## Security for reducing state

The API from `useTupleModel`(without onChange) like `useModel`, `useRefreshModel`, `useRequiredModel` are secure for state update. The state is outside of react system, so every update from methods is a secure reducing process. If you want to use `useState` to replace its job, you have to call it like: `setState((s)=>s+1)`.

## Typescript check

`@airma/react-state` is a typescript support library, you can use it with `typescript` for a better experience. 

It checks if the input `state` type is same with the param default `state` type. 

If the method returning type is same with param default `state` type, and so on.

## Async state management

You can not use async method with `@airma/react-state`, and we will not support async method in future, we suggest you works the async state with [react-query](https://tanstack.com/query/v4), you can use `useRefresh` or `useRefreshModel` to adapt the async state management.

## End

We hope you can enjoy this tool, and help us to enhance it in future.

