[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/restful.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/restful
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/restful.svg?style=flat-square

# @airma/restful

@airma/restful 是一个优化异步请求代码风格的工具。支持流式请求设定，让请求代码更像请求路由。

## 基本用法

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

Typescript 风格：

```ts
import { client, ResponseData } from '@airma/restful';

const { rest } = client();

const root = rest('/path');

type User = {
    id: string;
    name: string;
    username: string;
}

async function getUser(id: string): Promise<User>{
    try{
        return root.setParams({ id }).get<User>();
    } catch(e: any) {
        console.log(e)
    }
}

// 获取请求详细信息
async function getUserResponse(
    id: string
): Promise<ResponseData<User>>{
    try{
        const responseData = await root.
            setParams({ id }).
            get<User>().
            // 通过 response 方法获取请求详细信息
            response();
        return responseData
    } catch(e: any) {
        console.log(e)
    }
}
```

## 配置

通过 client API 可以为所有请求配置静态的 headers，默认参数，响应拦截器，请求实现方法等信息。

```ts
import { client, ResponseData } from '@airma/restful';

const { rest } = client({
    // request headers
    headers: {...},
    // 如 defaultParams: { sessionId: 12 }，
    // 则所有请求都会带上 sessionId=12 的参数。 
    // -> http://host/path?sessionId=12&xx=...
    defaultParams: {...},
    // 响应拦截器函数，可拦截并重新定义响应详情。
    responseInterceptor: ( 
        data: ResponseData 
    ) => {
        console.log(data)；
        return data
    },
    // 自定义请求实现。默认采用 window.fetch 方法
    async request(url: string, requestConfig: RequestConfig){
        return Promise<ResponseData>;
    }
});
```

### Headers

使用 client 设置 request headers。

```ts
client({
    headers:{
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ......
    }
})
```

### DefaultParams

默认参数会影响所有请求路由中的参数。

```ts
const {rest} = client({
    defaultParams:{
        sessionId: 12,
        private:true
    }
});

// http://host/path/child?sessionId=12&private=true&userId=1
rest('/path').path('child').setParams({userId:1}).get<User>();

// http://host/path/child?sessionId=12&userId=1
// 独立请求参数可覆盖默认参数
rest('/path').path('child').setParams({userId:1, private: undefined}).get<User>();
```

通过设置具体请求参数，可覆盖默认参数。

### Request

默认的 request 方法采用 [window.fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) 作为核心，可通过配置自定义该核心请求的实现方案。

`Request` 必须满足以下接口要求：

```ts
type Request = (
  // 请求路由 url  
  url: string,
  // 请求配置信息
  requestConfig: RequestConfig
) => Promise<ResponseData>; // 返回响应数据格式 promise 对象
```

请求配置信息类型如下：

```ts
// 响应格式
type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'blob'
  | 'arrayBuffer';

// 对象参数与 url 参数的转换设定
type ParamsProcessor = {
  stringify: (params: Record<string | number, any>) => string;
  parse: (query: string) => Record<string | number, any>;
};

// 请求配置信息类型
type RestConfig = {
  // 请求头信息 request headers
  headers?: Record<string, any>;
  // 数据响应格式：json, text, formData, blob, arrayBuffer
  responseType?: ResponseType;
  // 响应拦截器函数
  responseInterceptor?: (
    data: ResponseData
  ) => ResponseData | undefined;
  // 默认参数
  defaultParams?: Record<string | number, any>;
  // 对象参数与 url 参数之间的转换器
  paramsProcessor?: () => ParamsProcessor;

  /** 剩余配置可参考 window.fetch API **/
  credentials?: 'include' | 'omit' | 'same-origin';
  cache?:
    | 'default'
    | 'force-cache'
    | 'no-cache'
    | 'no-store'
    | 'only-if-cached'
    | 'reload';
  mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
  redirect?: 'error' | 'follow' | 'manual';
  integrity?: string;
  keepalive?: boolean;
  referrer?: string;
  referrerPolicy?:
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  window?: null;
}

// 请求核心函数实现入参
// 在请求配置的基础上增加了 params, body, method 信息
type RequestConfig = RestConfig & {
  // 对象参数，最终被转成 ?param=xxx&more=xxx 样式的 url 参数
  params?: Record<string, any>;
  // 请求的 payload 对象，通常由 post 请求携带
  body?: Record<string, any>;
  // 请求方法：GET, POST, PUT, DELETE
  method?: Method;
};
```

响应详细信息类型：

```ts
// 响应成功详细信息
export declare type SuccessResponse<T = any> = {
  // 响应状态码 status
  status: number;
  // 响应头信息 response headers
  headers?: Record<string, any>;
  // 响应数据
  data: T;
  // 当前请求是否失败
  isError: false;
};

// 响应失败详细信息
export declare type ErrorResponse = {
  // 响应状态码 status
  status: number | null;
  // 错误信息
  error: any;
  // 同错误信息
  data: any;
  // 响应头信息 response headers
  headers?: Record<string, any>;
  // 是否属于网络异常
  networkError: boolean;
  // 当前请求是否失败
  isError: true;
};

// 响应详细信息
export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;
```

### ResponseInterceptor

响应拦截器函数，接收原始的响应详细信息，要求返回新的响应详细信息。

intercept response:

```ts
import {client, ResponseData} from '@airma/restful';

const myInterceptor = (
    response:ResponseData
) :ResponseData =>{
    // 需求实现：系统不允许出现 http 异常，
    // 所有请求必须正常响应，
    // 是否异常以及异常数据挂载在返回数据格式上。
    const {data, status, networkError} = response;
    if ( data && data.success ) {
        return {
            data: data.data,
            status,
            isError: false
        }
    }else {
        return {
            error: data.data,
            data: data.data,
            status,
            networkError,
            isError: true
        }
    }
}

const { rest } = client({
    // 配置拦截器
    responseInterceptor: myInterceptor
})
```

### paramsProcessor

参数序列化与反序列化定义函数。推荐使用 [qs](https://www.npmjs.com/package/qs)。

```ts
import { client } from '@airma/restful';
import qs from 'qs';

export default client({
    paramsProcessor(){
        return {
            stringify(
                data: Record<string | number, any>
            ): string{
                return qs.stringify(data);
            },
            parse(
                query: string
            ): Record<string | number, any>{
                return qs.parse(query);
            }
        }
    }
})
```

## 累积配置

使用 client 实例对象的 **config** 方法可持续累积设定所有请求配置信息。

```ts
import {client} from '@airma/restful';

const {rest, config} = client();

async function test(){
    // http://host/path?id=1
    await rest('/path').setParams({id:1}).get();
    // 配置默认参数
    config(
        c => ({...c, defaultParams: {sessionId: 12} })
    );
    // http://host/path?sessionId=12&id=1
    await rest('/path').setParams({id:1}).get();
}
```

单独设定特殊请求配置信息

```ts
rest('/path').get({headers:{...}, responseType:'text'});
```

## 实时配置

使用 client 实例对象的 **configRuntime** 方法可实时设定所有请求的配置信息。

```ts
import {client} from '@airma/restful';

const {rest, configRuntime} = client();

const sessionCache = {
    sessionId: undefined
};

setInterval(async ()=>{
    const sessionId = await rest('/get-session-id').get();
    sessionCache.sessionId = sessionId;
}, 5000);

// 每当请求开始时就会运行 configRuntime 设置的配置函数进行实时配置
configRuntime(
    c => ({
        ...c, 
        defaultParams: {
            // use newest sessionId
            sessionId: sessionCache.sessionId
        } 
    })
);

function test(){
    // http://host/path?sessionId=xxx&id=1
    await rest('/path').setParams({id:1}).get();
}
```

每当请求开始时就会运行 configRuntime 设置的配置函数进行实时配置。

注意， **configRuntime** 方法的提供的实时配置信息只能与 **config** 提供的累积配置临时累积，实时配置信息之间是互相覆盖的关系，所以不建议多次调用 **configRuntime** 方法。

## Response

在方法调用的末端调用 `response` 方法可以获取响应的详细信息。

```ts
const res = await rest('/path').get<User>().response();
if(!res.isError){
    return res.data; // User type
}
// 响应详细信息
const {error, networkError, headers} = res;
```

响应详细信息类型：

```ts
// 响应成功详细信息
export declare type SuccessResponse<T = any> = {
  // 响应状态码 status
  status: number;
  // 响应头信息 response headers
  headers?: Record<string, any>;
  // 响应数据
  data: T;
  // 当前请求是否失败
  isError: false;
};

// 响应失败详细信息
export declare type ErrorResponse = {
  // 响应状态码 status
  status: number | null;
  // 错误信息
  error: any;
  // 同错误信息
  data: any;
  // 响应头信息 response headers
  headers?: Record<string, any>;
  // 是否属于网络异常
  networkError: boolean;
  // 当前请求是否失败
  isError: true;
};

// 响应详细信息
export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;
```

## 变更日志

### v18.3.0

* 加入 `configRuntime` 配置方法。

### v18.3.2

* 当使用回调函数配置时，函数参数配置信息默认携带默认 request 实现。
