# Guides

The core APIs are [useModel](guides?id=usemodel), [useSignal](guides?id=usesignal), [useSelector](guides?id=useselector), [provide](guides?id=provide). Using them from declare API [model](guides?id=model) makes state-management more convenient and easier.

## useModel

API [useModel](guides?id=usemodel) is the most basic hook in **@airma/react-state**. It almost can be used in every kind of state-management.

### Local state-management

It needs model function and its initial state for initializing.

```ts
const instance = useModel(model, initialState);
```

Example:

```ts
import {useModel} from '@airma/react-state';

const {
    // render data
    count,
    // action method
    increase,
    ......
} = useModel(
    // a model function
    (state:number)=>({
        count: state,
        isNegative: state<0,
        increase(){
            return state+1;
        },
        decrease(){
            return state-1;
        }
    }), 
    // a initial state
    props.defaultCount??0
);
```

Just consider it as simplified `useReducer`, that's enough.

### Dynamic store state-management

There are some differences with `Local state-management` usage. 

1. The model function should be replaced by a model [key](concepts?id=key).
2. This key should be assigned to [provide](api?id=provide) to generate a store inside this High-Order-Component element.
3. The render initial state can be ignored, if a static one had been set when [createKey](api?id=createkey).

```ts
// has been initialized when create this key.
const storeInstance = useModel(modelKey);
// initializes in render time.
const storeInstance = useModel(modelKey, defaultState);
```

This is about how to initialize in create time.

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generating store
const counterKey = createKey((count:number)=>{
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
// give the key an initial state
}, 0);

const Increase = memo(()=>{
    // use key to subscribe store in Provider
    const increase = useSelector(counterKey, i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use key to subscribe store in Provider
    const {count} = useModel(counterKey);
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    // use key to subscribe store in Provider
    const decrease = useSelector(counterKey, i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// use HOC `provide` to generate store inside Provider elements.
const Component = provide(counterKey)(function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

This is about how to initialize in render time.

```ts
import {
    createKey,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create key for generating store
const counterKey = createKey((count:number)=>{
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
});

const Increase = memo(()=>{
    const increase = useSelector(counterKey, i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = useModel(counterKey);
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = useSelector(counterKey, i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
const Component = provide(counterKey)(function Comp() {
    // initialize state in render time.
    useModel(counterKey, 0);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

The value about dynamic store is it supports different react elements carries different stores.

### Static store state-management

The static store is simple. It is created outside components, it needs no provider for creating or making scope. But currently **@airma/react-state** has not provided an API **createStore** directly, it should be used with API [model](api?id=model), like:

```ts
// has been initialized when create this key.
const storeInstance = useModel(modelKey);
// initializes in render time.
const storeInstance = useModel(modelKey, defaultState);
```

This is about how to initialize in create time.

```ts
import {
    createStore,
    provide,
    useModel,
    useSelector
} from '@airma/react-state';

// create static store
const counterStore = createStore((count:number)=>{
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
// give the store an initial state
}, 0);

const Increase = memo(()=>{
    // subscribe store directly
    const increase = useSelector(counterStore, i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // subscribe store directly
    const {count} = useModel(counterStore);
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    // subscribe store directly
    const decrease = useSelector(counterStore, i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// No HOC `provide` is needed.
const Component = function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

## useSelector

API [useSelector](api?id=useselector) provides a way to select data from **store instance**. When the selected result is changed, it rerenders. That can reduce the frequency of component render. 

```ts
const xxx = useSelector(modelKey, (instance)=>instance.xxx);
```
The last parameter can be a **equality judgement function** for telling API if the selected result has been changed.

```ts
import {pick} from 'lodash';
import {useSelector, shallowEqual} from '@airma/react-state';

// select property directly
const xxx = useSelector(modelKeyOrStore, (instance)=>instance['xxx']);
// pick property object
const xxxWrapper = useSelector(modelKeyOrStore, (instance)=>pick(instance, ['xxx']), shallowEqual);
```

## createKey and provide

API [provide](api?id=provide) is a HOC (Higher-Order-Component). It accepts model keys, and creates a `Context.Provider` wrapper for the component which needs a model store usage. The stores are created from model keys inside every element of provided component.

API [createKey](api?id=createkey) wraps a [model](concepts?id=model) to be a unique [key](concepts?id=key).

```ts
import {myModel} from './model';
import {createKey, provide} from '@airma/react-state';

const modelKey = createKey(myModel)

const Component = provide(modelKey)(function Component(){
    return ......;
})
```

Want to use more than one stores?


```ts
import {myModel, myModel2} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel, defaultState);

const key2 = createKey(myModel2);

const keys = {key, key2};

const Child = ()=>{
    // link the store with key
    useModel(key);
    return ......;
}

// object style keys
const Component = provide(keys)(function Component(){
    // link the store of key2
    useModel(key2, defaultState);
    return <Child/>
});

// array style keys
const Component1 = provide([key, key2])(function Component1(){
    return <Child/>;
})

// parameter style keys
const Component2 = provide(key, key2)(function Component2(){
    return <Child/>;
})

// parameter style keys, and method style to wrap
const Component3 = provide(key, key2).to(function Component3(){
    return <Child/>;
})
```

Want a Component `provide` style?

```ts
import {myModel} from './model';
import {createKey, Provider} from '@airma/react-state';

const modelKey = createKey(myModel)

const Component = function Component(){
    return (
        <Provider keys={modelKey}>
            ......
        </Provider>
    );
})
```

`Provider` system supports a tree structure find way. When a key finding is started, it always finds store from the most nearest parent Provider to the farthest one from bottom to top.

```ts
import {myModel, myModel2} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel, defaultState);

const key2 = createKey(myModel2);

const Child = provide(key2)(()=>{
    // link the store of key,
    // no matched store in `provide(key2)`,
    // then find in a higher provider,
    // and matched in `provide(key)`
    useModel(key);
    useModel(key2, defaultState);
    return ......;
});

const Component = provide(key)(function Component(){
    useModel(key);
    return <Child/>;
});
```

Want same model, different stores?

```ts
import {myModel} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel);

const key2 = createKey(myModel);

// key and key2 are different keys,
// they are from same model `myModel`,
// that makes they belongs to two different stores
const keys = {key, key2};

const Component = provide(keys)(function Component(){
    return ......;
});
```

## useControlledModel

This API `useControlledModel` can be used in a controlled component, like:

Common model:

```ts
export const toggleModel = (selected:boolean)=>([
    selected,
    ()=>!selected
] as const);
```

Use in un-controlled component:

```ts
import {toggleModel} from '../common/model';
import {useModel} from '@airma/react-state';

const UnControlledCheckbox = ()=>{
    const [
        selected,
        toggle
    ] = useModel(
        toggleModel, 
        false
    );

    return ......;
}
```

Use in controlled component:

```ts
import {toggleModel} from '../common/model';
import {useControlledModel} from '@airma/react-state';

const ControlledCheckbox = (props:{
    checked:boolean,
    onChange:(checked:boolean)=>void
})=>{
    const {checked, onChange} = props;
    const [
        selected,
        toggle
    ] = useControlledModel(
        toggleModel,
        // set the controlled state from props 
        checked, 
        // set the controlled onChange from props
        onChange
    );

    return ......;
}
```

Auto controlled component:

```ts
import {toggleModel} from '../common/model';
import {useControlledModel} from '@airma/react-state';

const Checkbox = (props:{
    checked?:boolean,
    onChange?:(checked:boolean)=>void
})=>{
    const {checked, onChange} = props;

    const handleChange = (c: boolean)=>{
        onChange?.(c);
    }
    const instance = useModel(
        toggleModel, 
        checked ?? false
    );
    const cInstance = useControlledModel(
        toggleModel,
        checked ?? false, 
        handleChange
    );

    const isUnControlled = 'checked' in props;

    const [
        selected,
        toggle
    ] = isUnControlled? instance : cInstance;

    return ......;
}
```

API `useControlledModel` accepts a model function, a controlled state and a change callback for notifying a next state.

```ts
const instance = useControlledModel(modelFn, value, onChange)
```

## model

API `model` is a simplify API to use APIs referred before. It accepts a model function, returns a similar model function with APIs inside.

```ts
import {model, provide} from '@airma/react-state';

const toggleModel = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const));

// create key for dynamic store
const toggleKey = toggleModel.createKey(false);

// create static store
const toggleGlobalStore = toggleModel.createStore(false);

// support initialize static store outside component
toggleGlobalStore.instance(defaultState?);

......
function ChildComponent(props){
    // local state-management usage
    const instance = toggleModel.useModel(false);
    // every local state-management usage has different store with each other.
    const signal = toggleModel.useSignal(false);
    // controlled usage
    const controlledInstance = toggleModel.useControlledModel(props.checked, props.onChange);
    return ......;
}

......
// dynamic store should be created from key by provider
provide(toggleKey).to(function Component(){
    const [, toggle] = toggleKey.useModel();
    const [signalSelected] = toggleKey.useSignal()();
    const selected = toggleKey.useSelector(([s])=>s);
    // static store can be used directly without any provider
    const selectedInGlobal = toggleGlobalStore.useSelector(([s])=>s);
    return ......;
});
......
function Comp(){
    toggleGlobalStore.useSignal();
    toggleGlobalStore.useModel();
    return ......;
}
```

The `model` API supports to create a static store usage, in that case, no provider is needed.

API `model` is more simple and useful, the output from `model(myModelFn)` is still a model function, it still can be used in other model functions.

The usage `useSignal` is very useful, take examples and explains in [useSignal](guides?id=usesignal) section.

### produce instance

The model **produce** method can simulate an asynchronous action usage, and make asynchronous logic to be split with synchronous model logic.

```ts
import React from 'react';
import {model} from '@airma/react-state';
import service from './service';

// Use model api to create a static store.
const counter = model((count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase(){
            return count + 1;
        },
        decrease(){
            return count - 1;
        },
        sumWith(value: number){
            return count + value;
        }
    }
}).produce((getInstance)=>{
    // use `model(xxx).produce((getInstance)=>...)`  to produce instance
    const i = getInstance();
    // This object returns will replace instance when using 'useModel/useSignal/useSelector' APIs.
    return {
        ...i,
        async increaseBySetting(){
            const setting = await service.fetchSetting();
            // getInstance is a callback to get the newest instance in store.
            const currentInstance = getInstance();
            return currentInstance.sumWith(setting.step);
        },
        async decreaseBySetting(){
            const setting = await service.fetchSetting();
            const currentInstance = getInstance();
            // getInstance is a callback to get the newest instance in store.
            if(currentInstance.count < 0){
                return currentInstance.count;
            }
            return currentInstance.sumWith(-setting.step);
        }
    }
});

const App = ()=>{
    const signal = counter.useSignal({initialState: 0}); // set initial state.
    // The instance is the produced one.
    const instance = signal();
    const {
        // use asynchronous simulate action method
        decreaseBySetting, 
        // data for rendering
        count,
        // use asynchronous simulate action method
        increaseBySetting
    } = instance;
    return (
        <div>
            <button onClick={decreaseBySetting}>-</button>
            <span>{count}</span>
            <button onClick={increaseBySetting}>+</button>
        </div>
    );
}
```

The produced instance has persist methods just like instance.

**Note: This support is for people who does not like using useQuery/useMutation to manage asynchronous state. It is still not a good idea to control asynchronous code in synchronous logic.**

## createField

API `model.createField` helps creating field for model instance. It generates value by calling a `get` method. If a cache value is needed, put some change-able dependencies as an array to the second parameter, that is very helpful when using it with react effect hooks.

```ts
import {model} from '@airma/react-state';

type QueryCondition = {
    name: string;
    page:number;
    pageSize:number;
    fetchVersion:number;
}

const queryModel = model((condition:QueryCondition)=>{
    return {
        ...condition,
        // use condition.fetchVersion as cache dependency,
        // when condition.fetchVersion changes, the cache value will be reloaded.
        // Be careful, the cache field is for model instance outside, so it has no cache effect in model function context.
        // Only when it is get from model instance, and called the get method, the cache effect can be applied.
        query:model.createField(()=>{
            const {name, page, pageSize} = condition;
            return {name, page, pageSize}
        },[condition.fetchVersion]),
        setName(name:string){
            return {
               ...condition,
                name
            }
        },
        setPageInfo(page:number, pageSize:number){
            return {
               ...condition,
                page,
                pageSize
            }
        },
        startFetch(){
            return {
               ...condition,
                fetchVersion:condition.fetchVersion+1
            }
        }
    }
});

const App = ()=>{
    const instance = queryModel.useModel(
        {
            name:'', 
            page:1, 
            pageSize:10, 
            fetchVersion:0
        }
    );
    const { query } = instance;
    const {setName, setPageInfo, startFetch} = instance;

    useEffect(()=>{
        // call the field get method to get value. 
        // {name, page, pageSize}
        fetch(query.get());
    },[query.get()]) // call the field get method to get the cache value, and make cache effect.

    // When the action method setName changes condition.name, the cache field does not response.
    const handleNameChange = (e)=>setName(e.target.value);

    // When action method startFetch changes condition.fetchVersion, the cache field will be reloaded. For its dependency condition.fetchVersion is changed.
    const handleFetch = ()=>startFetch();
    ......
}
```

**Note, the result generated by calling API model.createField should be hang on the instance or dependent by another cache field which has been hang on instance. For the cache effect is given by instance.**

You can make a cache field dependent by another one.

```ts
import {model} from '@airma/react-state';

type QueryCondition = {
    name: string;
    page:number;
    pageSize:number;
    fetchVersion:number;
}

const queryModel = model((condition:QueryCondition)=>{

    // This cache field has not been hang on instance,
    // but it is dependent by another cache field.
    // That makes its dependencies passed to that one.
    const pageInfo = model.createField(()=>{
        const {page, pageSize} = condition;
        return {page, pageSize}
    },[condition.page, condition.pageSize]);
    
    return {
        ...condition,
        // It dependents on pageInfo, that makes its dependencies to be condition.page, condition.pageSize and ondition.fetchVersion.
        query: model.createField(()=>{
            const {page, pageSize} = pageInfo.get();
            const {name} = condition;
            return {name, page, pageSize}
        },[condition.fetchVersion, pageInfo]),
        setName(name:string){
            return {
               ...condition,
                name
            }
        },
        setPageInfo(page:number, pageSize:number){
            return {
               ...condition,
                page,
                pageSize
            }
        },
        startFetch(){
            return {
               ...condition,
                fetchVersion:condition.fetchVersion+1
            }
        }
    }
});
```

If there are no dependencies, the get method from field always returns a newest value.

```ts
import {model} from '@airma/react-state';

const countModel = model((count:number)=>([
    model.createField(()=>count),
    ()=>count+1,
    ()=>count-1
] as const));

const App = ()=>{
    const [countField,increase,decrease] = countModel.useModel(0);
    const count = countField.get();

    useEffect(()=>{
        // When count changes, the effect works after 1s.
        // If there is another action happening in this 1s, 
        // the `count` value should be a stale one for the closures effect by ecmascript feature.
        // But the `countField.get()` calling can return a trustable newest value.
        setTimeout(()=>{
            console.log('differ', count, countField.get());
        },1000);
    });

    return (
        <div>
            <button onClick={increase}>+</button>
            {count}
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

The field can be used in model produce too.

```ts
import {model} from '@airma/react-state';

const countModel = model((count:number)=>([
    count,
    ()=>count+1,
    ()=>count-1
] as const)).produce((getInstance)=>{
    const [count, increase, decrease] = getInstance();
    const sym = (function computeSym(){
        if(!count){
            return '';
        }
        return :count>0? '+': '-';
    })();
    return {
        count,
        // cache by sym: '+'/ '-'/ ''
        infoField:model.createField(()=>{
            return {sym};
        }, [sym]),
        increase,
        decrease
    }
});

const App = ()=>{
    const {
        infoField,
        count,
        increase,
        decrease
    } = countModel.useModel(0);
    const info = infoField.get();

    useEffect(()=>{
        console.log(info.sym);
    }, [info]);

    return (
        <div>
            <button onClick={increase}>+</button>
            {count}
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

**Note, currently, the field object changes when its dependencies changes, or the model refreshes if there is no dependencies. In future, the field object will be changeless like action methods, and only the get method returns in field can make changes.** 

## ConfigProvider

The **@airma/react-state** system uses subscription mode to synchronous state changes, it needs a batch update way to update multiple state changes.

Before react<18.0.0, provide `unstable_batchedUpdates` from `react-dom` to `@airma/react-state` can make subscription state updating work more effectively. 

```ts
import { unstable_batchedUpdates } from 'react-dom';
import { ConfigProvider } from '@airma/react-state';

const config = {
    batchUpdate: unstable_batchedUpdates
};

<ConfigProvider value={config}>
......
</ConfigProvider>
```

## useSignal

API [useSignal](api?id=usesignal) creates a instance getter callback. Calling this callback can get a newest store instance. And only the changes of render usage fields from instance can make component rerender.

```ts
const signal = useSignal(modelFn, defaultState?);
// const signal = useSignal(modelKey);
// const signal = useSignal(modelStore);
const instance = signal();
```

Example:

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const App = () =>{
    const countingSignal = useSignal(counting, props.defaultCount??0);

    // The `isNegative` is added for rerender optimization.
    // When `isNegative` changes, it rerenders component.
    const {
        // render usage field
        isNegative
    } = countingSignal();

    if(!isNegative){
        // When `isNegative` is false, and `count` changes, it rerenders component.
        const {
            // render usage field, limited by `isNegative`
            count
        } = countingSignal();
        return ......;
    }
    return ......;
}

```

To prevent signal render:

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const Comp = ({
    isActive, 
    defaultCount
    }: {isActive: boolean; defaultCount?:number}) =>{
    const countingSignal = useSignal(counting, props.defaultCount??0);

    // Set Signal option 'cutOff' to true,
    // can prevent signal fields change to rerender component 
    const {
        count,
        isNegative
    } = countingSignal({cutOff: !isActive});

    return ......;
}

const App = ()=>{
    const [isFirstActive, setIsFirstActive] = useState(true);
    return (
        <div>
            <Comp isActive={isFirstActive} defaultCount={0}/>
            <Comp isActive={!isFirstActive} defaultCount={1}/>
        </div>
    )
}
```

It is a better choice than [useSelector](guides?id=useselector) for reducing the frequency of component render when it works with a store.

A signal callback provides a hook API for adding effects to the action methods.

### signal.useEffect

It is very different with `useEffect` in react. It watches the action methods calling, and executes the effect callbacks after render stages caused by action methods.

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect(()=>{
    // This signal only uses `isNegative` field in render stage, so, only when `isNegative` changes, the effect works.
    console.log('some action method is called');
})
```

The `signal.useEffect` returns filter APIs for narrowing down the calling frequencies.

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect(()=>{
    // Only when increase is called, the effect works.
    console.log('some action method is called');
}).onActions((instance)=>{
    // get the action methods which you want to listen for narrowing change listening frequency. 
    return [instance.increase];
})
```

Use `onChanges` to narrow down the calling frequencies by fields changes.

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect(()=>{
    // Only when count changes, the effect works.
    // No matter if field `count` is used in render stage.
    console.log('some action method is called, that makes render happens');
}).onChanges((instance)=>{
    // returns fields you want to listen for narrowing change listening frequency.
    return [instance.count];
})
```

### signal.useWatch

The difference about `signal.useWatch` with `signal.useEffect` is that `signal.useWatch` listens to the action changes directly, it is not a response to render stage. And no matter if render happens or not, it always executes when the action method is called.

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useWatch(()=>{
    // No matter which field is chhanged, the effect works.
    console.log('some action method is called');
});

countingSignal.useWatch(()=>{
    // To narrow down the calling frequencies, by using `onActions` filter.
    console.log('some action method is called');
}).onActions((instance)=>{
    return [instance.increase];
});

countingSignal.useWatch(()=>{
    // To narrow down the calling frequencies, by using `onChanges` filter.
    console.log('some action method is called');
}).onChanges((instance)=>{
    return [instance.isNegative];
});
```

**Note: The signal.useEffect and signal.useWatch API only can work on instance properties and methods, it can not subscribe the changes about produced instance properties and methods.**

```ts
import {useSignal} from '@airma/react-state';

const counting = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state + 1;
    },
    decrease(){
        return state - 1;
    },
    add(data: number){
        return state + data;
    }
})).produce((getInstance)=>{
    const instance = getInstance();
    return {
        ...instance,
        increaseBySetting:async ()=>{
            const setting = await fetchSetting();
            return getInstance().add(setting);
        }
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increaseBySetting,
    decrease
} = countingSignal();

countingSignal.useEffect(()=>{
    console.log('some action method is called, that makes render happens');
}).onActions((instance)=>{
    // type error, there is no property key 'increaseBySetting' in instance.
    // instance.increaseBySetting is undefined.
    return [instance.increaseBySetting]; // X
})
```

### useSignal from model

The declare API [model](api?id=model) can generate `useSignal` usage too.

```ts
import {model} from '@airma/react-state';

const counting = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){       
        return state+1;
    },
    decrease(){
        return state-1;       
    }
})).createStore();
// Create a static store without initializing state.

const Increase = ()=>{
    // increase is a action method from instance, it is immutable.
    // usSignal returns a instance getter callback, it should be recalled for field usage.
    const {increase} = counting.useSignal()();
    return <button onClick={increase}>+</button>;
};

const Decrease = ()=>{
    // decrease is a action method from instance, it is immutable.
    const {decrease} = counting.useSignal()();
    return <button onClick={decrease}>-</button>;
}

const Count = ()=>{
    const {count} = counting.useSignal()();
    return <span>{count}</span>;
}

const App = ()=>{
    // Use useSignal to initialize state with 0.
    // For this signal is not called, and no field is added into render usage fields, it won't cause component rerender.
    counting.useSignal(0);
    return (
        <div>
            <Count/>
            <Increase/>
            <Decrease/>
        </div>
    );
}
```

### useSignal note:

* The **signal** callback function returns by useSignal is not recommended to be used in a child component **useLayoutEffect stage**. For the render fields usage computing process is shuted down in **useLayoutEffect**, it may add some dirty fields which are not expected to appear in render usage.

Next Page [feature](feature).



