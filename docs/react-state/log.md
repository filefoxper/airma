# Change Logs

## v 17.0.0 2023-01-07

* remove APIs `useRequiredModel`, `useRequiredModelState`, `useLocalSelector`.
* remove configs `required`, `autoRequired`.
* rename API `RequiredModelProvider` to `ModelProvider`.
* add configs `autoLink`.

## v 17.0.1 2023-01-07

* fix bug about `pipe` model generates a local state instance.

## v 17.0.2 2023-01-07

* update index.d.ts to provide a more exacter typescript check. 

## v 17.0.3 2023-01-15

* fix bug about connect a sharing factory with undefined state when default state has been set in factory. 

## v 17.0.4 2023-01-17

* fix bug about `useSelector` can not select a method.

## v 17.0.5 2023-01-29

* optmize the typescript of `useSelector`.

## v 17.0.6 2023-02-12

* optmize `useRefresh` API, provide a refresh dependecies as an option config for this API.

## v 17.0.7 2023-02-16

* add `withModelProvider` API for a easy usage of `ModelProvider`. 

## v 17.0.9 2023-02-21

* optimize typescript descriptions about `FactoryModel` and `withModelProvider`.

## v 17.1.1 2023-02-24

* optimize `useModel` scope model default state setting. 

## v 17.1.3 2023-02-28

* optimize `useSelector` and `useRefresh` API.

## v 17.1.4 2023-03-02

* fix bug about auto refresh of `useModel`.

## v 17.1.6 2023-03-02

* fix bug about auto refresh model of `ModelProvider`.

## v 17.1.9 2023-03-03

* fix bug about useSelector can not listen to store state change.

## v 17.2.0 2023-03-12

* add API `createStoreKey`.
* add API `StoreProvider`.
* add API `withStoreProvider`.
* optimize `instance` to `stable instance` and `realtime instance`.
* add API `useRealtimeInstance`.
* add API `useIsModelMatchedInStore`

## v 18.0.0 2023-07-03

* refact how to `dispatch` state.

## v 18.0.2 2023-07-23

* provide more simple but more effective typescript
* remove the dependency about `@airma/core`.

## v 18.2.0 2023-09-03

* provide `ConfigProvider` to config API usage in it.
* deprecate `useRefreshModel` API
* deprecate `useRefresh` API

## v 18.3.0 2024-02-20

* remove old deprecated APIs.
* simplify APIs.
* add `model` API.

## v18.3.1 2024-03-03

* add `useStaticModel` API