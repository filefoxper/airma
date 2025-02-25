# @airma

`@airma` 是一款用于辅助 react `>=16.8.0` 版本的编码的工具库，它包含了多样化的简易状态管理功能。

* [@airma/react-state](/zh/react-state/index)
* [@airma/react-effect](/zh/react-effect/index)
* [@airma/react-hooks](/zh/react-hooks/index)

与 React 关系不大的 http rest style 请求工具库：

* [@airma/restful](/zh/restful/index)

### @airma/react-state

`@airma/react-state` 是一款基于模型对象的类 redux 状态管理工具，通过调用行为方法进行事件分发，改变模型状态。

```ts
import {useModel} from '@airma/react-state';

const instance = useModel((count)=>({
    // 渲染数据
    count,
    isNegative: count<0,
    // 行为方法，用于生成行为后的状态
    increase:()=> count + 1,
    decrease:()=> count - 1
}),0); // 默认状态 0

const {
    count, 
    isNegative,
    // 调用行为方法触发状态变更与重渲染
    decrease, 
    increase
} = instance;
```

[相关文档](/zh/react-state/index.md)


### @airma/react-effect

`@airma/react-effect` 是一款用于管理 react 异步请求状态的工具。

例子：

```ts
import {useQuery} from '@airma/react-effect';
import {queryUsers} from './service';
import type {User} from './type';

// function queryUsers(query: {name: string}):Promise<User[]>

const [
    {
        // 查询返回数据 User[]，默认为 undefined
        data, 
        // 是否正在查询 boolean
        isFetching, 
        // 是否有过至少一次成功的查询 boolean
        loaded,
        // 错误信息
        error,
        // 是否有错误
        isError
    }
] = useQuery(
    // 查询函数，需要返回一个 Promise 对象
    queryUsers, 
    // 查询函数的参数，
    // 当 useQuery 首次被加载或查询参数发生变更时，开始查询
    [query]
);
```

[相关文档](/zh/react-effect/index)

### @airma/react-hooks

`@airma/react-hooks` 是 `@airma/react-state` 与 `@airma/react-effect` 的合集，它能让使用者更方便的操作两个库的API。

[相关文档](/zh/react-hooks/index)

### @airma/restful

@airma/restful 是一个优化异步请求代码风格的工具。支持流式请求设定，让请求代码更像请求路由。

```ts
import { client } from '@airma/restful';

const { rest } = client();

const root = rest('/path');

// GET http://host/path
root.get();

// GET http://host/path?param1=param1&param2=param2
root.setParams({ param1:'param1', param2:'param2' }).get();

// GET http://host/path/child-path
root.path('child-path').get();

// GET http://host/path/child-path?param1=param1&param2=param2
root.path('child-path').setParams({ param1:'param1', param2:'param2' }).get();

// POST http://host/path 
// payload: {data:'data'}
root.setBody({data:'data'}).post();

// POST http://host/path/child-path 
// payload: {data:'data'}
root.path('child-path').setBody({data:'data'}).post();

// POST http://host/path/child-path?param1=param1&param2=param2 
// payload: {data:'data'}
root.path('child-path').setParams({ param1:'param1', param2:'param2' }).setBody({data:'data'}).post();
```

[相关文档](/zh/restful/index)