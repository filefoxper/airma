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
