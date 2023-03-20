# 特性

`@airma/react-effect` 的一些固有特性可以为我们省去很多麻烦，有必要做基本了解。这些特性基本集中在 `useQuery` 与 `useMutation` 这两个工作者 API 上。

## UseQuery

对 `useQuery` API 来说，查询功能才是它的菜，所以千万不要把它用在一个修改功能中，否则它的一些固有特性会让你感到诧异。

### 最新数据

对一个查询来说，永远接收最新一次发出请求的返回结果是非常有必要的。所以 `useQuery` 通过使用一个不透出的内部策略实现了这一目标，也就是说无论用不用策略，你所使用的 `useQuery` 渲染的永远是最新请求的会话结果。

比如翻页查询功能：

假设有一个可快速点击翻页的翻页器，如果我们快速连续翻第2，第3页，这时每个请求都已经发向服务端，我们并不知道哪页数据会先被服务端处理，并返回给我们。如果，`useQuery` 没有做最新数据保护，那么可能出现第3页数据先返回并渲染在我们的页面中，之后姗姗来迟的第2页数据将最新请求的第3页数据覆盖掉，从而导致了页码与数据不对应的问题。所以本特征对 `useQuery` 来说是必要的，`useQuery` 通过对迟到请求的会话结果标记 `abandon` 废弃信息拦截了迟到数据的渲染工作。

场景模拟如下：

```ts
const fetchData = (page: number)=>{
    return new Promise((resolve)=>{
        // 模拟第二页数据的延时请求
        if(page === 2){
            setTimeout(()=>{
                resolve(page);
            }, 2000);
            return;
        }
        resolve(page);
    });
}

const App = ()=>{
    const [page, setPage] = useState(1);
    // 始终保证了最新操作所得的会话数据不会被覆盖渲染
    const [ {data} ] = useQuery(fetchData, [page]);

    const handleChangePage=(p: number)=>{
        // 翻页查询
        setPage(p);
    }

    return ......;
}
```

关于 `useQuery` 与 `useMutation` 的共性，我们放到[共性](/zh/react-effect/feature?id=共性)小节进行讲解。

## UseMutation

也许你已经知道了在只允许一次性修改操作的地方对 `useMutation` 使用 `Strategy.once` 可以有很大的帮助，你不必再当心一个保存弹窗会有多次新增数据的机会了。但你未必知道其实 `useMutation` 内部已经集成了一个弱化版原子性操作策略。现在我们就来看看 `useMutation` 没有向你透露的秘密。

`useMutation` 修改操作应该保持原子性，即一次请求没有结束，就不该进行下一次操作。这个内置特性，在数据`更新`操作时非常有用。

## 共性

`useQuery` 与 `useQuery` 有许多相同点，如：它们都能使用会话`键`连接上下文会话库；它们有相似度极高的会话配置。

### 上下文会话

既然是在上下文会话中，我们就使用[工作者](/zh/react-effect/guides?id=调度者与工作者)来称呼它们了。

之前我们介绍过调度者与工作者是多对多的关系，就是说允许多个拥有相同`键`的不同`工作者`同时出现。当它们同时被依赖更新（`mount | update` 模式）触发，或是被调度者（`useSession` trigger 函数）触发时，只有优先级最高的`工作者`能够开始工作，其他`工作者`处于休眠状态，这时，它们只会等待并同步库中的`会话状态`变更。

```ts
import React from 'react';
import {
    SessionProvider,
    createSessionKey,
    useQuery
} from '@airma/react-effect';
import {fetchData} from './service';

const fetchDataKey = createSessionKey(fetchData, 'query');

const Content = ()=>{
    // 调度者触发两个同`键`工作者，只有一个能正常工作。
    const [, trigger] = useSession(fetchDataKey);
    return ......;
}

const Page = ()=>{
    // 两个同 `键` 的 useQuery 同时在 mount 中触发。
    // 只有一个能正常工作。
    useQuery(fetchDataKey,[]);
    useQuery(fetchDataKey,[]);
    return (
        <Content />
    );
}

const App = ()=>{
    return (
        <SessionProvider keys={fetchDataKey}>
          <Page/>
        </SessionProvider>
    );
}
```

当`工作者`们同时被自带手动触发函数（`trigger`、`execute`）触发时，所有工作者都会正常工作，但最终请求的会话结果会采用后触发的`工作者`返回的结果。

```ts
import React from 'react';
import {
    SessionProvider,
    createSessionKey,
    useQuery
} from '@airma/react-effect';
import {fetchData} from './service';

const fetchDataKey = createSessionKey(fetchData, 'query');

const Content = ()=>{
    return ......;
}

const Page = ()=>{
    // 两个同 `键` 的 useQuery 同时在 mount 中触发。
    // 只有一个能正常工作。
    const [state1, trigger1] = useQuery(fetchDataKey,[]);
    const [state2, trigger2] = useQuery(fetchDataKey,[]);

    const handleQuery = ()=>{
        // 最终会话状态会是 trigger2 的会话结果
        trigger1();
        trigger2();
    };

    return (
        <Content />
    );
}

const App = ()=>{
    return (
        <SessionProvider keys={fetchDataKey}>
          <Page/>
        </SessionProvider>
    );
}
```

通过上述例子，我们建议使用者应尽量避免两个同`键`工作者同时出现在一个会话库中，以降低复杂度。当然，如果我们能反其道，简单运用这个特点来优化性能，降低请求频率，也未尝不是一件好事。

```ts
import React from 'react';
import {
    SessionProvider,
    createSessionKey,
    useQuery
} from '@airma/react-effect';
import {fetchData} from './service';

const fetchDataKey = createSessionKey(fetchData);

const ComplexComponent = ()=>{
    // 数据源是固定的，无参的
    const [state] = useQuery(fetchDataKey,[]);

    return ......;
}

const Page = ()=>{
    // 如果，有需求需要我们复用 ComplexComponent，
    // 我们的 useQuery(fetchDataKey,[]) 工作者因此出现了两次，
    // 但请求只会发送一次，这降低了我们的请求频率，
    // 同时我们也不需要把 useQuery(fetchDataKey,[]) 提取到更高层，
    // 这反而加强了 ComplexComponent 组件的可复用性
    return (
        <div>
          <ComplexComponent />
          <div>......</div>
          <ComplexComponent />
        </div>
    );
}

const App = ()=>{
    return (
        <SessionProvider keys={fetchDataKey}>
          <Page/>
        </SessionProvider>
    );
}
```

所以任何事物都有两面性，只要能提前分析清楚，使用对我们有利的一面，我们一样能组织出优秀的代码案例。

### 会话配置

`useMutation` 与 `useQuery` 的会话配置是高度相似的。

```ts
declare type TriggerType = 'mount' | 'update' | 'manual';

declare type StrategyCollectionType<T> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

declare type SessionConfig<T, C extends PromiseCallback<T>> = {
  defaultData?: T;
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
};
```

除了 `defaultData` ，其他字段的作用在之前的篇章中基本都有提及。这里再次做一个总结：

* defaultData - 你可以设置一个默认数据，在请求正确返回前，会话状态中的 `data` 字段默认为 `defaultData`；如没有设置此项，`data` 为 `undefined`。
* deps - [自定义依赖](/zh/react-effect/concepts?id=自定义依赖)
* variables - [变量依赖](/zh/react-effect/concepts?id=变量依赖)
* triggerOn - [触发模式](/zh/react-effect/concepts?id=触发模式)
* strategy - [策略](/zh/react-effect/concepts?id=策略)

对于 `useMutation` 来说，这就是所有配置项了，但对于 `useQuery` 来说，还多了个 `triggerOn: ['manual']` 的快捷配置项 `manual`。

* manual - 当 `useQuery` 使用该配置项时，相当于强行配置了 `triggerOn: ['manual']`。

最后让我们进入 [API](/zh/react-effect/api.md) 章节，进行最后的阅读。