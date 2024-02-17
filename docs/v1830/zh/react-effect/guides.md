# 引导

本章节，我们将着重介绍如何使用本地会话进行简单的本地请求操作；如何使用上下文会话进行较为复杂的请求数据同步，及跨组件操作等内容。

## 本地会话

本地会话涉及的查询和修改操作十分简单。通过合理区分每种不同异步操作的类型，配合正确的策略，就能简单满足我们的大部分需求。

### useQuery

如果一个会话仅仅涉及简单的数据查询工作，那么 `useQuery` 就是最佳选择。通常我们会对一个查询功能使用 `Strategy.throttle`、`Strategy.memo`、`Strategy.success`、`Strategy.error` 等策略。

#### 依赖查询

最常见的查询就是依赖查询，而依赖查询中变量依赖驱动方式最为普遍。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});

    const [ state ] = useQuery(
        // 设置查询请求函数
        fetchUsers,
        {
            // 根据变量依赖查询
            variables: [query],
            strategy: [
                // 设置，在 30 秒内，若变量序列化字符串没变，则不发起请求的节流策略
                Strategy.throttle(30000),
                // 设置结果数据序列化字符串没有变化，直接使用当前会话数据的策略
                Strategy.memo(),
                // 设置错误处理策略
                Strategy.error(message.error)
            ]
        }
    );

    const {
        // User[] | undefined
        data,
        // 是否正在请求数据
        isFetching,
        // 是否请求出错
        isError,
        // 是否有过一次正确请求
        loaded
    } = state;
    ......
}
```

#### 级联查询

有时，我们需要使用互相依赖的 `useQuery` 进行级联查询，这时我们可以利用 `triggerOn` 来控制我们下行 `useQuery` 在上行数据更新成功后进行。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    id: string;
}

// 获取当前登陆用户请求
const fetchLoginUser = ():Promise<User> =>
        Promise.resolve([{id:'1', username:'xxx', name:'xxx'});

// 通过 id 获取用户详细信息的请求
const fetchUserDetail = (id: number|undefined):Promise<User> =>{
    if (id == null) {
        throw new Error('xxx');
    }
    return Promise.resolve([{id:query.id, age: 10, introduce: 'xxx'});
}

const App = ()=>{
    const [ userState ] = useQuery(fetchLoginUser,[]);

    const [ detailState ] = useQuery(
        fetchUserDetail,
        {
            // 以 userState 中的 data.id 作为依赖变量
            variables: [userState?.data?.id],
            strategy: [
                Strategy.throttle(30000),
                Strategy.memo(),
                Strategy.error(message.error)
            ],
            // 使用更新触发模式
            // 依赖的 userState?.data?.id 变更后才开始查询，
            // userState?.data?.id 原始值为 undefined。
            triggerOn: ['update']
        }
    );

    const {
        // User[] | undefined
        data,
        // 是否正在请求数据
        isFetching,
        // 是否请求出错
        isError,
        // 是否有过一次正确请求 (如果设置默认值，loaded 必为 true)
        loaded,
        // 是否有过一次正确请求
        sessionLoaded
    } = state;
    ......
}
```

上例通过使用 `update` 触发模式查询。在上行 `useQuery(fetchLoginUser)` 加载时 `userState?.data?.id` 为 undefined，而此时由于下行 `useQuery(fetchUserDetail)` 不存在 `mount` 模式，所以不会在加载时触发查询。当上行 `useQuery(fetchLoginUser)` 查询成功后， `userState?.data?.id` 变成 `1`，这个改变触发了下行 `useQuery(fetchUserDetail)` 的 `update` 模式工作。 

#### 定时查询

通常涉及到的定时查询以人工触发 `trigger` 函数为佳。我们可以通过 `manual: true`，将 `useQuery` 设置为人工触发模式。该配置相当于 `triggerOn: ['manual']` 的快捷方式。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});

    const [users, setUsers] = useState<User[]>([]);

    // 直接使用 isFetching 查看请求是否还在进行中
    const [ { isFetching }, trigger, execute] = useQuery(
        // 设置查询请求函数
        fetchUsers,
        // 请求参数
        {
            variables: [query],
            strategy: [
                Strategy.throttle(30000),
                Strategy.memo(),
                // 成功后直接把结果设置到 useState 
                Strategy.success(setUsers),
                // 设置错误处理策略
                Strategy.error(message.error)
            ],
            // 相当于 triggerOn: ['manual']，
            // 只支持手动触发模式
            manual: true
        }
    );

    useEffect(()=>{
        // 20 秒触发一次查询
        const id = setInterval(()=>{
            trigger();
        }, 20000);
        return ()=>{
            clearInterval(id);
        }
    },[]);

    ......
}
```

### useMutation

异步修改操作通常通过手动触发的形式进行，如：

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

// 保存请求函数
const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    // 需要保存的 user 数据
    const [user, setUser] = useState<User>({...});

    // 需手动触发
    const [state, trigger] = useMutation(
        // 设置保存请求函数
        saveUser,
        // 设置保存参数
        [ user ]
    );
    const {
        // User | undefined
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleSubmit = ()=>{
        // 通过元组中的 trigger 手动触发
        trigger();
    }

    ......
}
```

#### 传参触发函数

我们注意到，无论 `useQuery` 还是 `useMutation` 返回元组中都有一个会话外的触发函数 `execute`，它允许我们传入临时参数触发工作，之所以放在 `useMutation` 中进行说明是因为 `useMutation` 使用传参触发的概率会更高一些。

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

// 保存请求函数
const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    // 需要保存的 user 数据
    const [user, setUser] = useState<User>({...});

    // 传参的手动触发方式
    const [state, , execute] = useMutation(
        // 设置保存请求函数
        // 不设置变量
        saveUser
    );
    const {
        // User | undefined
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleSubmit = ()=>{
        // 通过元组中的 execute 手动触发，并传入 user 参数
        execute(user);
    }

    ......
}
```

注意：这里我们没有设置任何变量依赖与自定义依赖，这时 `useQuery` 和 `useMutation` 都将自动进入手动触发状态，而我们也不推荐在使用 `execute` 的同时也使用变量依赖，这会导致我们的会话参数变化极不稳定。或者说，在大部分情况下，我们不应该去使用 `execute` 这个会话外的可传参触发函数。关于 `execute` 的返回值，同样仅供参考，若真要使用，请注意只采纳 `abandon` 不为 `true` 的会话结果。 

最后因为修改相对比较简单，复杂的例子也和 `useQuery` 类似，就不再展开叙述了。

## 上下文会话

本地会话基本可以满足一个简单页面的增删改查需求了。但如果查询数据可以通过上下文状态的方式，在需要的深层子组件中直接获取，而非 props 层层传递，那会更加方便。

### 基本用法

`@airma/react-effect` 提供了这个能力。为了实现会话的上下文同步，我们采取了和 `@airma/react-state` 的[上下文状态](/zh/react-state/guides?id=上下文状态)管理一样的机制，通过键库匹配的方式进行上下文间的关联同步。

1. 使用 `createSessionKey` API 创建一个会话`键`。
2. 将创建好的会话`键`集合（可以是独立的`键`，也可以是由`键`组成的对象或数组）提供给 `SessionProvider` 组件，用于生成会话`库`（store）。
3. 通过 `useQuery` 或 `useMutation` 使用会话`键`来连接 `SessionProvider` 组件实例中的 会话`库`。请求所得的会话结果最终会发往与`键`匹配的`库`，从而支持上下文关联。需要知道的是所有使用同一会话`键`的 `useQuery` 或 `useMutation` 共享通一个上下文会话。
4. 通过 API `useSession` 使用会话`键`来连接 `SessionProvider` 组件实例中的 会话`库`。与 `useQuery` 或 `useMutation` 不同，`useSession` 的主要用途是用来被动接收来自 `useQuery` 或 `useMutation` 创建好的会话变更，所以不具备除了手动触发以外的触发模式。

基础样例：

```ts
import React from 'react';
import {
    useQuery,
    useSession,
    createSessionKey,
    SessionProvider
} from '@airma/react-effect';
import { fetchUsers } from './service';
import type { UserQuery, User } from './type';

// type UserQuery = {username?: string};

// function fetchUsers(query: UserQuery): Promise<User[]>;

// 给 createSessionKey 提供一个请求函数，可以创建一个会话`键`。
// 相当于一把钥匙
const fetchUsersSessionKey = createSessionKey(fetchUsers);

const Condition = ()=>{
    const [displayQuery, setDisplayQuery] = useState<UserQuery>({});

    const [validQuery, setValidQuery] = useState<UserQuery>(displayQuery);

    // 通过会话`键`匹配通过该`键`建立的会话库，
    // useQuery直接使用匹配库中会话。
    // 查询产生的会话结果将被更新到匹配库的会话状态中。
    useQuery(fetchUsersSessionKey, [validQuery]);

    const handleUsernameChange = (e)=>{
        setDisplayQuery({username: e.target.value});
    };

    const handleSubmitQuery = ()=>{
        // 必须引起依赖变量的改变，以期每次提交都能触发查询。
        setValidQuery({...displayQuery});
    };

    return (
        <div>
          <input 
            type="text" 
            value={displayQuery.username}
            onChange={handleUsernameChange}
          />
          <button onClick={handleSubmitQuery}>提交</button>
        </div>
    );
}

const Datasource = ()=>{

    const [
        {
          isFetching, 
          data, 
          isError, 
          error,
          loaded
        }
        // 使用 useSession 可以直接获取会话库中与`键`匹配的会话，
        // 根据目前的需求，我们只需要获取会话状态即可。
    ] = useSession(fetchUsersSessionKey);

    if (isFetching) {
        return (
            <div>加载中...</div>
        );
    }

    if (isError) {
        return (
            <div>
                {
                    error?error.toString():'未知错误'
                }
            </div>
        );
    }

    return (
        <div>
          {
            loaded?
              data.map((user)=>(
                <div>
                  <span>{user.name}</span>
                  <span>{user.username}</span>
                </div>
              )):
              null
          }
        </div>
    );
}

const App = ()=>{
    // 把会话`键`提供给 `SessionProvider`，
    // `SessionProvider` 会根据会话`键`建立一个内部的会话库
    return (
        <SessionProvider keys={fetchUsersSessionKey}>
          <Condition />
          <Datasource />
        </SessionProvider>
    );
}
```

通过 API `createSessionKey`，我们可以把请求包装成一个会话`键`。一个会话`键`相当于一把钥匙，把同一把钥匙提分别供给会话库的创建者 `SessionProvider` 和使用者 `useQuery`、`useMutation`、`useSession` 就能为它们建立起会话同步链接。每个 `SessionProvider` 都会在组件实例内部维护会话库，这意味着内部使用 `SessionProvider` 的相同组件的不同实例拥有的会话库是不同的，会话状态也是不同步的。

```ts
const App = ()=>{
    // 把会话`键`提供给 `SessionProvider`，
    // `SessionProvider` 会根据会话`键`建立一个内部的会话库
    return (
        <SessionProvider keys={fetchUsersSessionKey}>
          <Condition />
          <Datasource />
        </SessionProvider>
    );
}

const Layout = ()=>{
    // 两个 App 的会话状态是互不干扰的。
    return (
        <div>
          <App />
          <App />
        </div>
    );
}
```

使用键库配对的上下文状态管理要比只有全局库的方式来的更灵活。比如我们需要设计一个可能在一个页面多次复用的复杂组件，该组件需要根据 props 传入参数查询请求，这时，只有全局库的弊端就出来了，因为使用的是同一库对象，所以这些组件的最终会话状态都是相同的，这明显不符合我们的需求。如果简单使用 React.Context.Provider 来同步数据，则会引发另外一个问题，同一种 Context 的 Provider 会阻止更高层 Provider 提供的会话状态，这可能导致真正的全局会话状态无法直接从复杂组件中通过 useContext 获取出来。这也引出了一个话题，`SessionProvider` 会阻止访问更高层 `SessionProvider` 提供的会话库吗？答案显然是不会的，不然我发这个问有啥意义。

通过键库匹配原则，我们可以在内层 `SessionProvider` 的子组件中使用高层`键`匹配到高层库。

所谓的键库匹配规则就是，当我们使用`键`去查找库时，会按就近原则匹配最近一层父级 `SessionProvider`，如匹配失败（没在库里找到），则继续向更高层 `SessionProvider` 发起匹配，直至匹配成功或者匹配结束为止。如所有的 `SessionProvider` 都没有提供使用者持有的`键`，持有者会抛出异常。

```ts
import React from 'react';
import {
    useQuery,
    useSession,
    createSessionKey,
    SessionProvider
} from '@airma/react-effect';
import { fetchSomething } from './service';
import { globalKeys } from '@/global';

// export const globalKeys = {
//     currentUser: createSessionKey(fetchCurrentUser),
//     config: createSessionKey(fetchUserConfig)
// }

const fetchSomethingKey = createSessionKey(fetchSomething);

const Condition = ({variables}:{variables})=>{
    useQuery(fetchSomethingKey, [variables]);
    // 在  <SessionProvider keys={fetchUsersSessionKey}> 无法匹配，
    // 询问更高层进行匹配，并建立同步关系 
    const [ {data: user} ] = useSession(globalKeys.currentUser);
    return ......;
}

const Datasource = ()=>{
    useSession(fetchSomethingKey);
    // 在  <SessionProvider keys={fetchUsersSessionKey}> 无法匹配，
    // 询问更高层进行匹配，并建立同步关系 
    const [ {data: config} ] = useSession(globalKeys.config);
    return ......;
}

const Complex = ({variables}:{variables})=>{
    // 把会话`键`提供给 `SessionProvider`，
    // `SessionProvider` 会根据会话`键`建立一个内部的会话库
    return (
        <SessionProvider keys={fetchUsersSessionKey}>
          <Condition />
          <Datasource />
        </SessionProvider>
    );
}

const Layout = ()=>{
    // 因为库的不同，所以两个 Complex 的会话状态是互不干扰的。
    // 不同 variables 的结果自然也是不同的
    return (
        <div>
          <SessionProvider keys={globalKeys}>
            <Complex variables={......} />
            <Complex variables={......} />
          </SessionProvider>
        </div>
    );
}
```

上例展示了键库匹配原则的基本运用。同时我们也观察到了 `SessionProvider` 接收的`键`形式可以是由`键`组成的 object 这一现象（可以认为是钥匙串）。

### 调度者与工作者

在上下文会话模式下，`useQuery` 和 `useMutation` 是不可或缺的，`useSession` 仅仅只是共享了它们的会话状态，并提供了再次触发会话工作的接口 `trigger`。我们可以形象的把 `useQuery` 和 `useMutation` 称作`工作者`，而 `useSession` 就是`调度者`。`调度者`在获知工作者会话状态的同时，也可以通过触发器 `trigger` 调度相关`工作者`的工作。而`工作者`互相之间可以共享会话状态，但不能互相触发工作。

为了说明问题，我们对[基本用法](/zh/react-effect/guides?id=基本用法)中的基础样例做了些小改动。

```ts
import React from 'react';
import {
    useQuery,
    useSession,
    createSessionKey,
    SessionProvider
} from '@airma/react-effect';
import { fetchUsers } from './service';
import type { UserQuery, User } from './type';

// type UserQuery = {username?: string};

// function fetchUsers(query: UserQuery): Promise<User[]>;

// 给 createSessionKey 提供一个请求函数，可以创建一个会话`键`。
// 相当于一把钥匙。
// 注意：这里我们为会话键配置了一个 `query` 的会话类型，
// 如果我们把这个明确为 `query` 会话类型的会话键提供给了 `useMutation`，
// 就会发生运行时报错。
const fetchUsersSessionKey = createSessionKey(fetchUsers, 'query');

const Submit = ()=>{
    // 调度者
    // 不关心会话状态，只做调度触发工作。
    const [, trigger] = useSession(fetchUsersSessionKey);
    return (
        <button onClick={trigger}>提交</button>
    );
}

const Condition = ()=>{
    const [displayQuery, setDisplayQuery] = useState<UserQuery>({});

    // 工作者
    // 负责工作，并将工作所得的会话状态共享给其他工作者和调度者
    useQuery(fetchUsersSessionKey, {
        // 利用了调读者和工作者的关系，
        // 我们只需对依赖做些小调整就可以省去 validQuery 这个提交状态了
        variables: [ displayQuery ],
        deps: []
    });

    const handleUsernameChange = (e)=>{
        setDisplayQuery({username: e.target.value});
    };

    return (
        <div>
          <input 
            type="text" 
            value={displayQuery.username}
            onChange={handleUsernameChange}
          />
          <Submit />
        </div>
    );
}

const Datasource = ()=>{

    const [
        {
          isFetching, 
          data, 
          isError, 
          error,
          loaded
        }
        // 调度者
        // 只共享了会话状态，
        // 开启 `query` 会话类型检查
    ] = useSession(fetchUsersSessionKey, 'query');

    return ......;
}

const App = ()=>{
    // 把会话`键`提供给 `SessionProvider`，
    // `SessionProvider` 会根据会话`键`建立一个内部的会话库
    return (
        <SessionProvider keys={fetchUsersSessionKey}>
          <Condition />
          <Datasource />
        </SessionProvider>
    );
}
```

`@airma/react-effect` 支持多对多的 `调读者` 和 `工作者` 关系，但这并不是理想状态，最佳方案是多个`调度者`对应一个`工作者`。那么，如果同时存在多个`键`相同的`工作者`会发生什么？如果这些`工作者`是被同时触发工作的，那只有最先被触发的`工作者`才能正常工作，其他工作者将处于等待会话同步的状态，我们稍后会在特性中看到详细解释。

注意：上例中，我们在创建会话键时，提供了会话类型限制 `query`，这意味着，只有 `useQuery` 和 `useSession`  才能使用这把钥匙。会话类型🈶️：`'query' | 'mutation'`。同理，`useSession` 也可以进行会话类型限制。使用类型限制创建会话键可以让你的应用更安全。

让我们看看剩下的常见问题，如错误兜底功能。

### 全局会话

通过以上学习，我们可以很容易的使用 `SessionProvider` 包装一个全局会话库，似乎已经不在需要那么多功能了。但 `@airma/react-effect` 依旧塞过来一份传单：9块9，9块9啊，9块9你买不了吃亏，买不了上当......于是你揣起了传单，定睛一看：`GlobalSessionProvider`，正当你准备一怒弃之时，一条消息飘过你的眼帘：具有真正的全局配置功能。

好了，让我们来看看 `GlobalSessionProvider` 与 `SessionProvider` 的区别。`GlobalSessionProvider` 是专为全局会话准备的，除了生成应用的上下文会话库，还有一个主打功能，那就是全局配置，不论你使用的 `useQuery` 与 `useMutation` 是否在使用上下文会话`键`，这份全局配置都能起作用。

何曾几时，在前端流传着 `window.addEventListener('unhandledrejection', ......)` 的传说，无奈现在的前端异步处理库越来越主动得揽收了错误处理步骤，并要求使用者独立处理。

现在就让我们看看，如何使用 `GlobalSessionProvider` 做全局错误兜底工作。

#### 全局配置

全局配置 config 作用于所有包含再 `GlobalSessionProvider` 组件内的 `useQuery` 和 `useMutation`。

```ts
import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  GlobalSessionProvider,
  Strategy
} from '@airma/react-effect';
import type { GlobalConfig } from '@airma/react-effect';

const root = document.getElementById('root');

// 使用全局配置做异常兜底
const config: GlobalConfig = {
  // 为所有会话添加 Strategy.error 错误策略兜底
  strategy: s => [...s, Strategy.error(e => console.log('未捕捉异常：', e))]
};

// 如果不希望使用 `GlobalSessionProvider` 配置全局会话库也没关系
render(
  <React.StrictMode>
    <GlobalSessionProvider config={config}>
      <App />
    </GlobalSessionProvider>
  </React.StrictMode>,
  root
);
```

通过添加 `config` 我们可以为 `GlobalSessionProvider` 内部的所有 `useQuery` 与 `useMutation` 提供一些公共的[策略](/zh/react-effect/concepts?id=策略)。

`config.strategy` 是一个函数。所有的 `useQuery` 或 `useMutation` 在加载时会检查这个全局的策略配置函数是否存在，如存在，则将当前会话配置的策略作为参数传入该函数以生成一套包含全局策略的策略链。

上例的配置相当于为为所有会话添加了 `Strategy.error` 错误策略兜底。根据 `Strategy.error` 的特性，在一次会话的请求过程中，`Strategy.error` 只能执行一次，我们可以知道，如果我们的策略遗漏了错误处理（或者就想纯粹偷懒），那么此处的 `Strategy.error` 就能为我们提供最后的防御；如果，我们在会话中已经使用了 `Strategy.error` 错误策略，那么最后的兜底策略将不做反应。

关于 GlobalConfig 配置的解释：

```ts
export declare type GlobalConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: 'query' | 'mutation'
  ) => (StrategyType | null | undefined)[];
};
```

目前这个全局配置项只包含了策略配置函数。我们可以通过它来配置全局策略。

GlobalConfig.strategy：

策略函数 `strategy` 能接受两个参数：

* strategy - 来自运行会话的策略列表。
* type - 会话类型，`query` 表示当前使用配置函数的是一个 `useQuery`，`mutation` 表示的时一个 `useMutation`。

返回值：

该函数要求配置者根据参数返回一个新的策略列表。上例中，是通过追加的方式，为所有会话策略添加了错误兜底策略。

根据配置参数，我们完全可以自由发挥，如继续追加一个自定义的错误日志策略，将错误信息回传服务器；又如通过判断 `type` 会话类型是否是 `query` 来决定是否追加 `Strategy.memo` 会话结果优化策略，等......

#### 会话库

`GlobalSessionProvider` 是一种特殊的 `SessionProvider`。我们也可以为它提供会话`键`，维护会话库。这点和 `SessionProvider` 是一致的，就不再次啰嗦了。

#### 管理全局 isFetching 状态

`GlobalSessionProvider` 还有一个作用，就是管理旗下所有 `useQuery` 和 `useMutation` 的辅助状态：`isFetching`，`isError`。

目前我们只提供了获取全局 `isFetching` 的途径，我们可以通过使用无参的 `useIsFetching` hook API 来获取是否有请求依然还处于工作状态的信息。

```ts
import React from 'react';
import { render } from 'react-dom';
import {
  GlobalSessionProvider,
  Strategy,
  useQuery
} from '@airma/react-effect';
import type { GlobalConfig } from '@airma/react-effect';

const root = document.getElementById('root');

const lazyLoading = (): Promise<number>=>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(1);
        }, 3000);
    });
}

const App = ()=>{
    useQuery(lazyLoading, []);
    useQuery(lazyLoading, []);

    // 可以通过 useIsFetching 获知，是否有会话正在工作。
    const isFetching = useIsFetching();

    return ......;
}

// 使用全局配置做异常兜底
const config: GlobalConfig = {
  // 为所有会话添加 Strategy.error 错误策略兜底
  strategy: s => [...s, Strategy.error(e => console.log('未捕捉异常：', e))]
};

// 如果不希望使用 `GlobalSessionProvider` 配置全局会话库也没关系
render(
  <React.StrictMode>
    <GlobalSessionProvider config={config}>
      <App />
    </GlobalSessionProvider>
  </React.StrictMode>,
  root
);
```

注意，如果无参的 `useIsFetching` 在 `GlobalSessionProvider` 环境之外使用会报异常。如果需要在 `GlobalSessionProvider` 外部环境使用 `useIsFetching` ，需要为它提供`会话状态`参数。

```ts
import React from 'react';
import { render } from 'react-dom';
import {
  GlobalSessionProvider,
  Strategy,
  useQuery
} from '@airma/react-effect';
import type { GlobalConfig } from '@airma/react-effect';

const root = document.getElementById('root');

const lazyLoading = (): Promise<number>=>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(1);
        }, 3000);
    });
}

const App = ()=>{
    const [ state1 ] = useQuery(lazyLoading, []);
    const [ state2 ] = useQuery(lazyLoading, []);

    // 可以通过 useIsFetching 获知指定会话状态是否有正在工作的。
    const isFetching = useIsFetching(state1, state2);

    return ......;
}

render(
  <App />,
  root
);
```

### SessionProvider 与 StoreProvider

如果你在使用 `@airma/react-effect` 的同时也在使用 [@airma/react-state](/zh/react-state/index)，那么这里有一条值得你注意的消息，`SessionProvider` 就是 `@airma/react-state` 中的 [StoreProvider](/zh/react-state/guides?id=库)。也就是说两者是完全可以通用，因此我们可以把会话`键`用于 [StoreProvider](/zh/react-state/guides?id=库)，也可以把 模型[键](/zh/react-state/guides?id=键) 用于 `SessionProvider`，`createSessionKey` 产生的会话`键`其实就是一种特殊的模型[键](/zh/react-state/guides?id=键)。

## 本地状态管理

关于本地状态管理，我们推荐 [@airma/react-state](/zh/react-state/index) ，这是一个非常棒的本地状态管理库，它将 reducer 系统与方法调用完美结合，为使用者省去了很多状态管理相关的烦恼。`@airma/react-effect`正式基于此库开发的。希望大家能够喜欢，你们的支持就是我们创作的动力。

好了，特性时间到了，现在你已经基本学会了如何使用 `@airma/react-effect` 库进行开发，让我们看看它有哪些固有[特性](/zh/react-effect/feature.md)可以为我们省去不必要的麻烦。
