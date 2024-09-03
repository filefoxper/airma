# Change Logs

## v 16.0.0 2023-03-05

* optimize `useMutation`.
* add `triggerOn` to config.
* add `useStatus` API.
* make `useMutation` config more similar with `useQuery`.

## v 17.0.0 2023-03-12

* remove API `useStatus`.
* rename API `client` to `createSessionKey`.
* rename API `useClient` to `useSession`.
* rename API `GlobalConfigProvider` to `GlobalRefreshProvider`.
* rename API `ClientProvider` to `SessionProvider`.
* add API `useIsFetching`.

# v 17.0.1 2023-03-12

* rename API `GlobalRefreshProvider` to `GlobalProvider`.

# v 18.0.0 2023-07-03

* add `variables` and `sessionLoaded` to session state.
* add API `useLazyComponent`.

# v 18.2.0 2023-09-03

* deprecate GlobalSessionProvider
* deprecate useLazyComponent
* add ConfigProvider to replace GlobalSessionProvider

# v 18.2.1 2023-09-12

* add `loaded` to session config
* recover `useLazyComponent` API

# v 18.2.3 2023-09-14

* fix bug about `Strategy.debounce`, `Strategy.reduce`
* fix bug about `useResponse` typescript syntax.

# v 18.2.9 2023-11-10

* replace `Strategy.effect` with `Strategy.response`

# v 18.2.10 2023-11-18

* fix bugs about `useResponse` and `Strategy.response`, that it responses a before fetching session state change.

# v 18.2.11 2023-11-27

* add `fetchVersion` into `sessionState`, it should be `undefined` or an increased `number` data.

# v 18.2.12 2023-11-30

* fix `useResponse` typescript problem.

# v18.3.0

* optimize interfaces
* add `session` API

# v18.3.1

* change throw Error about no variables auto trigger to console.error.

# v18.3.2

* less render
* make useSession support execute with parameters.

# v18.3.3

* modify the no variables trigger warning content.

# v18.4.0

* improve render performance.

# v18.4.2

* fix bug about the trigger action from `useSession` and `useQuery` is not working problem.

# v18.4.3

* add `static` option to `Strategy.cache`.
* add `static` method to `sessionStore`.

# v18.4.4

* fix problem about when `Strategy.cache` works failed, the temporary data can not be rollback.

# v18.4.5

* fix problem about when `Strategy.cache` works failed, the rollback temporary data is not correct.

# v18.4.6

* fix problem about `Strategy.response.failure` not work.

# v18.4.7

* ~~fix problem about `useResponse` and `useResponse.*` response the mount effect.~~

# v18.4.8

* roll `useResponse` and `useResponse.*` features back. [rollback reason](/react-effect/guides?id=useresponse)
* add options for `useResponse` and `useResponse.*`.

# v18.4.11

* fix the bug about `useMutation` in static store can not work.

# v18.5.0

* make `useQuery` and `useMutation` works like `useSession` when there is no config for them.
* make `Strategy.validate` support async function for validation.

# v18.5.1

* upgrade `Strategy.validate` API, support accepts variables from execution stage as parameters.