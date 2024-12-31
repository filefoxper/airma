[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/restful.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/restful
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/restful.svg?style=flat-square

# @airma/restful

A nice restful style http request tool.

## Basic usage

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

// DELETE http://host/path
root.delete();

// DELETE http://host/path?param1=param1&param2=param2
root.setParams({ param1:'param1', param2:'param2' }).delete();

// DELETE http://host/path/child-path
root.path('child-path').delete();

// DELETE http://host/path/child-path?param1=param1&param2=param2
root.path('child-path').setParams({ param1:'param1', param2:'param2' }).delete();

// PUT http://host/path
root.put();

// PUT http://host/path?param1=param1&param2=param2
root.setParams({ param1:'param1', param2:'param2' }).put();

// PUT http://host/path/child-path
root.path('child-path').put();

// PUT http://host/path/child-path?param1=param1&param2=param2
root.path('child-path').setParams({ param1:'param1', param2:'param2' }).put();
```

With typescript

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

async function saveUser(user:User): Promise<void>{
    try{
        return root.path('/user').setBody(user).post<void>();
    } catch(e: any) {
        console.log(e)
    }
}

// use `response` method to get response detail.
async function getUserResponse(
    id: string
): Promise<ResponseData<User>>{
    try{
        const responseData = await root.
            setParams({ id }).
            get<User>().
            // with response
            // when error { isError: true; error: any, networkError: boolean, status: number, headers?: Record<string, any> }
            // when success { isError: false; data: User, status: number, headers: Record<string, any> }
            response();
        return responseData;
    } catch(e: any) {
        console.log(e)
    }
}
```

## Config

The `@airma/restful` contains a simple default config. Use client API to set it.

```ts
import { client, ResponseData } from '@airma/restful';

const { rest } = client({
    // request headers
    headers: {...},
    // default params ex { sessionId: 12 } -> http://host/path?sessionId=12&xx=...
    defaultParams: {...},
    // intercept the response data
    responseInterceptor: ( 
        data: ResponseData 
    ) => {
        console.log(data)；
        return data
    },
    // throw a whole response object when error happens. You can catch a `ErrorResponse` type object.
    throwErrorResponse: true, 
    // replace request implement with a customized asynchronous callback
    async request(url: string, requestConfig: RequestConfig){
        return Promise<ResponseData>;
    }
});
```

### Headers

Set a request headers for client.

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

Set default params for requests. These params always exist in the `url`, unless recover them with tobe undefined.

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
// recover private tobe undefined.
rest('/path').path('child').setParams({userId:1, private: undefined}).get<User>();
```

### Request

The default request sender based on [window.fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). It is allowed to be replaced with customized implement.

The `Request` is an asynchronous callback, with url and requestConfig as parameters. It should returns a promise with a `ResponseData` type result.

```ts
type Request = (
  // request url  
  url: string,
  // requset config
  requestConfig: RequestConfig
) => Promise<ResponseData>; // response data
```

RequestConfig type:

```ts
type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'blob'
  | 'arrayBuffer';

type ParamsProcessor = {
  stringify: (params: Record<string | number, any>) => string;
  parse: (query: string) => Record<string | number, any>;
};

// client config type
type RestConfig = {
  // request headers
  headers?: Record<string, any>;
  // response data format: json, text, formData, blob, arrayBuffer
  responseType?: ResponseType;
  // callback for reproducing response data.
  responseInterceptor?: (
    data: ResponseData
  ) => ResponseData | undefined;
  // default parameters make query data with default options.
  defaultParams?: Record<string | number, any>;
  // re-define how to stringify parameters to query, and how to parse query to parameters.
  paramsProcessor?: () => ParamsProcessor;

  /** Refer to window.fetch API **/
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

type RequestConfig = RestConfig & {
  // object style for query string: ?param=xxx&more=xxx
  params?: Record<string, any>;
  // object style for post request payload
  body?: Record<string, any>;
  // GET, POST, PUT, DELETE
  method?: Method;
};
```

The `ResponseData` type:

```ts
export declare type SuccessResponse<T = any> = {
  // response status
  status: number;
  // response headers
  headers?: Record<string, any>;
  // the final promise result
  data: T;
  // if request is failed
  isError: false;
};

export declare type ErrorResponse = {
  // response status
  status: number | null;
  // error data
  error: any;
  // same value with `error`
  data: any;
  // response headers
  headers?: Record<string, any>;
  // if network error is happening
  networkError: boolean;
  // if request is failed
  isError: true;
};

export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;
```

**If you want to use the default request for composing, you can fetch it from the `defaults` object.**

```ts
import {defaults} from '@airma/restful';

const {rest, config} = client();

config({
    request:(url:string, config:RequestConfig):Promise<ResponseData>=>{
        // do something with url and config
        return defaults.request(url, config);
    }
})
```

### ResponseInterceptor

`ResponseInterceptor` is a callback for intercepting a response.

intercept response:

```ts
import {client, ResponseData} from '@airma/restful';

const myInterceptor = (response:ResponseData) :ResponseData =>{
    // If a system allows no http error happen,
    // intercept response, and re-define response data for simple usage.
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
    responseInterceptor: myInterceptor
})
```

### paramsProcessor

For replacing the function about how to stringify parameters to query, or parse query to parameters object. The recommend tool is [qs](https://www.npmjs.com/package/qs).

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

## Accumulated config

Use the **config** method from client instance to config cumulatively.

```ts
import {client} from '@airma/restful';

const {rest, config} = client();

async function test(){
    // http://host/path?id=1
    await rest('/path').setParams({id:1}).get();
    // set a sessionId as a default param
    config(
        c => ({...c, defaultParams: {sessionId: 12} })
    );
    // http://host/path?sessionId=12&id=1
    await rest('/path').setParams({id:1}).get();
}
```

It also supports config for special request.

```ts
rest('/path').get({headers:{...}, responseType:'text'});
```

## Realtime config

Use the **configRuntime** method from client instance to config everytime when request works.

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

// Everytime when request is started,
// the callback setted by `configRuntime` is called for generating a realtime request config data.
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

Everytime when request is started, the callback setted by `configRuntime` is called for generating a realtime request config data.

## Response

Method `response` allows to get the origin response data for process.

```ts
const res = await rest('/path').get<User>().response();
if(!res.isError){
    return res.data; // User type
}
// detail
const {error, networkError, headers} = res;
```

Type of response data:

```ts
export declare type SuccessResponse<T = any> = {
  // response status
  status: number;
  // response headers
  headers?: Record<string, any>;
  // the final promise result
  data: T;
  // if request is failed
  isError: false;
};

export declare type ErrorResponse = {
  // response status
  status: number | null;
  // error data
  error: any;
  // same value with `error`
  data: any;
  // response headers
  headers?: Record<string, any>;
  // if network error is happening
  networkError: boolean;
  // if request is failed
  isError: true;
};

export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;
```

## Changes

### v15.0.1 2023-02-07

* change class `Http` to `rest` function, and use closure scope variables to replace keyword `this`.

### v15.1.0 2023-02-09

* use a simple inside `qs` to replace [qs](https://www.npmjs.com/package/qs), and you can replace it with [qs](https://www.npmjs.com/package/qs) by client config `paramsProcessor`.
* add the config from `window.fetch` API.

### v18.3.0

* add `configRuntime` method in client instance.

### v18.3.2

* When use config callback, the parameter config data contains request implement.
