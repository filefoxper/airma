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