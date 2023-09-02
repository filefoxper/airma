[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks.svg?style=flat-square

# @airma/react-hooks

`@airma/react-hooks` 包含了一些常用的简单 hook API，同时集成了 `@airma/react-state` 和 `@airma/react-effect` 包中的常用内容。

* [@airma/react-state](/zh/react-state/index.md)：提供了以 function 为模型，返回对象为载体的状态管理机制。
* [@airma/react-effect](/zh/react-effect/index.md)：提供了以 effect 副作用方式管理异步状态的 hook API。

## 介绍

这里不对 `@airma/react-state` 和 `@airma/react-effect` 包进行详细介绍，如果想要深入了解，可点击以上链接直接访问相关的文档。这里给出了部分简单例子以供参考。

## 例子

### 模型状态管理

我们以一个假分页功能为例来描绘一个模型。

```ts
import { memo } from 'react';
import { chunk } from 'lodash';
import { useModel, useRefresh } from '@airma/react-hooks';
import { Table, PageNavigation } from 'xxxd';
import type { Record } from './type';

type PageSplitState = {
    page: number;
    pageSize: number;
    source: Record[];
};

// 模型即 function
// 入参为一个 state 状态对象
function pageSplit(state: PageSplitState){
    // 当状态发生改变时，我们计算出页面需要的数据
    const { source, pageSize, page } = state;
    const pageSourceGroup = chunk(source, pageSize);
    const totalRecords = source.length;
    const totalPages = pageSourceGroup.length || 1;
    const currentPage = page>totalPages?totalPages:page;
    // 分离出当前页码对应的列表数据，即需要显示的数据
    const pageSource = pageSourceGroup[currentPage - 1] ?? [];
    // 返回对象会通过 useModel 转换成模型实例对象
    return {
        totalRecords,
        page: currentPage,
        pageSize,
        pageSource,
        // 通过调用来自模型实例的方法可实现状态更新
        changePageInfo(p: number, ps: number) {
            // 返回值即调用方法后 state 的更新值
            return {...state, page: p, pageSize: p};
        },
        updateSource(s: (Record[])|undefined) {
            // 如果更新数据为空或与 state 中当前数据相同，则不更新
            if (s == null || s === source) {
                return state;
            }
            return {...state, source: s};
        }
    }
}

const TableView = memo(
    ({source}:{source: (Record[])|undefined})=>{
        const {
            // 直接渲染用的当前数据列表，
            // 由 state 状态计算而来，
            // 如果希望获取 state 原始状态，可在模型属性中挂载出来
            pageSource,
            // 行为方法，用于更新 state
            updateSource,
            ... pageInfo
        } = useModel(pageSplit, {
            page:1, 
            pageSize: 10, 
            source
        });

        // useRefresh 相当于一个简化的 useEffect,
        // 它以更新依赖为参数进行 function 调用。
        useRefresh(updateSource, [source]);

        return (
            <div>
                <Table dataSource={pageSource}>
                    <Table.Column ... />
                    {/* <Table.Column ... /> ...*/}
                </Table>
                <PageNavigation 
                    page={pageInfo.page} 
                    pageSize={pageInfo.pageSize}
                    totalRecords={pageInfo.totalRecords}
                    onChange={pageInfo.changePageInfo}
                />
            </div>
        )
    }
);

export default TableView;
```

### 异步状态管理

我们以上面的例子为基础，完善一个简单查询功能。

```ts
import { 
    useQuery
} from '@airma/react-hooks';
import TableView from './tableview';
import service from './service';
import css from './style.css';

export default ({userId}:{userId:number})=>{
    // useQuery 可以被参数依赖项驱动工作，
    // 并调用 `service.fetchAllRecords` promise 异步方法查询数据，
    // 注意被调用的必须时一个返回 promise 对象或异步（async/await）的函数。
    const [ 
        // data 为异步方法应取得的数据状态
        // isFetching 为异步方法是否正在运行的 boolean 状态
        {data, isFetching} 
    ] = useQuery(service.fetchAllRecords, [userId]);

    return (
        <div>
            <div 
                className={css.loading} 
                style={!isFetching?{display:'none'}:undefined} 
            />
            <TableView source = {data}/>
        </div>
    );
};
```

### 简单 hook

在模型状态管理例子中，我们已经了解了简单 hook useRefresh 的使用方法，让我们继续以上面例子为基础介绍：useUpdate。

```ts
import { 
    useQuery,
    useUpdate
} from '@airma/react-hooks';
import TableView from './tableview';
import service from './service';
import css from './style.css';

export default ({userId}:{userId:number})=>{
    const [ 
        {data, isFetching} 
    ] = useQuery(service.fetchAllRecords, [userId]);

    useUpdate(([d])=>{
        // 每次 data 发生变化时触发该回调函数，
        // 注意首次进入不会触发，
        // 另外回调入参为依赖上次更新数据。
        console.log(d);
    },[data]);

    return (
        <div>
            <div 
                className={css.loading} 
                style={!isFetching?{display:'none'}:undefined} 
            />
            <TableView source = {data}/>
        </div>
    );
};
```

如果你觉得该工具的价值已经满足了你的期许，请继续下一章节的内容[安装与支持](/zh/react-hooks/install.md)，赶紧装起来再说吧。如果，你觉得依然没有找到你所期望的价值，请直接进入[API](/zh/react-hooks/api.md)篇进行更加深入的了解。