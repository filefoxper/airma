[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/restful.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/restful
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/restful.svg?style=flat-square

# @airma/restful

## Basic usage

We have provided a nice way to describe a restful http requests like:

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

// if you need details from response, use `response` from `method promise`
async function getUserResponse(id: string): Promise<ResponseData<User>>{
    try{
        // with response
        // when error { isError: true; error: any, networkError: boolean, status: number, headers?: Record<string, any> }
        // when success { isError: false; data: User, status: number, headers: Record<string, any> }
        return root.setParams({ id }).get<User>().response();
    } catch(e: any) {
        console.log(e)
    }
}
```

## Config

The `@airma/restful` contains a simple default config, it is not enough for you, you can config it:

```ts
import { client, ResponseData } from '@airma/restful';

const { rest } = client({
    // request headers
    headers: {...},
    // default params ex { sessionId: 12 } -> http://host/path?sessionId=12&xx=...
    defaultParams: {...},
    // intercept the response data
    responseInterceptor: ( data: ResponseData ) => {console.log(data)},
    // you can replace the default request with your own request method
    async request(url: string, requestConfig: RequestConfig){
        return Promise<ResponseData>;
    }
});
```

### Headers

You can set a headers for the client, and the client always sends request with the headers you set.

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

You can set default params for the requests send by you client. These params always exist in the `url`, unless you recover them with undefined in the specific request.

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
rest('/path').path('child').setParams({userId:1, private: undefined}).get<User>();
```

### Request

The default request sender is a `window.fetch` adapter. If you want to replace it with some more good adapter, you can set `request`.

The `Request` is a callback, with a url and requestConfig as params, it should returns a promise with a `ResponseData` type result.

```ts
type Request = (
  // request url  
  url: string,
  // requset config
  requestConfig: RequestConfig
) => Promise<ResponseData>; // response data
```

The `RequestConfig` type:

```ts
type RequestConfig = {
  // object style for ?param=xxx&more=xxx
  params?: Record<string, any>;
  // object style for post request payload
  body?: Record<string, any>;
  // GET, POST, PUT, DELETE
  method?: Method;
  // just headers you set to client({headers:...})
  headers?: Record<string, any>;
  // the response data format: json, text, formData, blob, arrayBuffer
  responseType?: ResponseType;
  // just responseInterceptor you set to client({responseInterceptor})
  responseInterceptor?: (
    data: ResponseData
  ) => ResponseData | undefined;
  // just defaultParams you set to client({defaultParams...})
  defaultParams?: Record<string, any>;
};
```

The `ResponseData` type:

```ts
export declare type SuccessResponse<T = any> = {
  status: number;
  headers?: Record<string, any>;
  // the final promise result
  data: T;
  // is error request
  isError: false;
};

export declare type ErrorResponse = {
  status: number | null;
  // error data
  error: any;
  // same value with `error`
  data: any;
  headers?: Record<string, any>;
  // is network error
  networkError: boolean;
  // is error request
  isError: true;
};

export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;
```

You can replace request with the most popular request tool [axios](https://www.npmjs.com/package/axios). And now you should know, that `@airma/restful` just provides a restful style for you. You can replace the core request work as you wish.

### ResponseInterceptor

`ResponseInterceptor` is a callback which helps you intercept a response. You can redefine if the request is an error request, and affect if the rest end should resolve or reject this result. You can also just make a log, and don't change result.

intercept response:

```ts
import {client, ResponseData} from '@airma/restful';

// for example we have to judge if the request is success 
// by the `data.success`
const redefinition = (response:ResponseData) :ResponseData =>{
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
    responseInterceptor: redefinition
})
```

log response:

```ts
import {client, ResponseData} from '@airma/restful';

// the different with redefinition is we should return void,
// if we do not want to change result.
const log = (response:ResponseData): void =>{
    const {data, status} = response;
    console.log(status, data);
}

const { rest } = client({
    responseInterceptor: log
})
```

## Change config

Sometimes you want to change rest config when the client has been built. You can use `config` method from client instance.

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

You can set headers and other config too.

If you want to config a specific request, you should set config to a method.

```ts
rest('/path').get({headers:{...}, responseType:'text'});
```

## Response

As we have known, the method `get`, `post`, `put`, `delete` provides a promise which has a result we need directly. But, sometimes, we need a more original response data with status, headers, networkError properties. So, we can use `response` from the method returns.

```ts
const res = await rest('/path').get<User>().response();
if(!res.isError){
    return res.data; // User type
}
// we can get details now
const {error, networkError, headers} = res;
```

The response method is a parasitic method in the `get`, `post`, `put`, `delete` method returning promise. It returns a promise which result is a `ResponseData`.

