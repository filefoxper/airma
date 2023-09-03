[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks.svg?style=flat-square

# @airma/react-hooks

`@airma/react-hooks` is a simple react hooks collection. It is made up by a core package [@airma/react-hooks-core](https://www.npmjs.com/package/@airma/react-hooks-core) and other useful packages: 

* [@airma/react-state](/react-state/index.md): Provides model state management hooks.
* [@airma/react-effect](/react-effect/index.md): Provides asynchronous state management hooks.

## Introduction

If you want to understand principles about `@airma/react-state` and `@airma/react-effect`, you'd better take the references above to have details, This package just lists out the often used APIs from these them. And it has some APIs itself.

## Usage Example

### Model State Manage

Let's take a simple page split state manage example:

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

// write a model function
function pageSplit(state: PageSplitState){
    // when state change, compute what we need.
    const { source, pageSize, page } = state;
    const pageSourceGroup = chunk(source, pageSize);
    const totalRecords = source.length;
    const totalPages = pageSourceGroup.length || 1;
    const currentPage = page>totalPages?totalPages:page;
    // pick current page data which should display in table
    const pageSource = pageSourceGroup[currentPage - 1] ?? [];
    // return an object, useModel will conside it as a instance.
    // the method from this instance regenerated from useModel can change state, and recall model function with newst state.
    return {
        totalRecords,
        page: currentPage,
        pageSize,
        pageSource,
        // define action method
        changePageInfo(p: number, ps: number) {
            // return the next state should be.
            return {...state, page: p, pageSize: p};
        },
        updateSource(s: (Record[])|undefined) {
            // if source is not changed, keep state.
            // if parameter source is null, keep state.
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
            // property generated from state.
            pageSource,
            // action method for update state.
            updateSource,
            ... pageInfo
        } = useModel(pageSplit, {
            page:1, 
            pageSize: 10, 
            source
        });

        // useRefresh is a simplified `useEffect`,
        // it can call any function with its parameters as effect dependencies.
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

### Asynchronous State Management

Let's use the pageSplit example above as a dependency, and take a simple example about asynchronous state management.

```ts
import { 
    useQuery
} from '@airma/react-hooks';
import TableView from './tableview';
import service from './service';
import css from './style.css';

export default ({userId}:{userId:number})=>{
    // when the effect time about userId from props comes,
    // useQuery run `service.fetchAllRecords`,
    // and change `data` and `isFetching`.
    const [ 
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

### Simple Hook

Let's take a example about `useUpdate`.

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
        // every time d is a prev value of data.
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

If you are interested with this tool please take next section about [installing and browser supports](/react-hooks/install.md) or go to [API](/react-hooks/api.md) directly.