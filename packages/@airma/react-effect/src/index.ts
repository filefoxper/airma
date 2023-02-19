import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  ModelProvider,
  useModel,
  useSelector,
  withModelProvider
} from '@airma/react-state';
import {
  PromiseResult,
  PromiseEffectCallback,
  QueryConfig,
  MutationConfig,
  ModelPromiseEffectCallback
} from './type';
import { defaultPromiseResult, effectModel } from './model';

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(
  callback: E | ModelPromiseEffectCallback<E>,
  config?: C
): [ModelPromiseEffectCallback<E>, E, C?] {
  const { pipe } = callback as ModelPromiseEffectCallback<E>;
  const isModel = typeof pipe === 'function';
  if (!isModel) {
    return [
      effectModel as ModelPromiseEffectCallback<E>,
      callback as E,
      config
    ];
  }
  const { effect } = callback as ModelPromiseEffectCallback<E>;
  const [effectCallback, cg] = effect;
  return [
    callback as ModelPromiseEffectCallback<E>,
    effectCallback,
    (cg || config) as C | undefined
  ];
}

function usePromise<T, C extends () => Promise<T>>(
  callback: C
): (
  feedback: (r: PromiseResult<T>) => PromiseResult<T>
) => Promise<PromiseResult<T>> {
  return (
    feedback: (r: PromiseResult<T>) => PromiseResult<T>
  ): Promise<PromiseResult<T>> => {
    const result = callback();
    if (!result || typeof result.then !== 'function') {
      throw new Error('The callback have to return a promise object.');
    }
    feedback({ ...defaultPromiseResult(), isFetching: true });
    return result.then(
      d => {
        const r = {
          data: d,
          isError: false,
          isFetching: false,
          abandon: false
        };
        return feedback(r);
      },
      e => {
        const r = {
          data: undefined,
          error: e,
          isError: true,
          isFetching: false,
          abandon: false
        };
        return feedback(r);
      }
    );
  };
}

export function useQuery<T, C extends PromiseEffectCallback<T>>(
  callback: C | ModelPromiseEffectCallback<C>,
  config?: QueryConfig<T, C> | Parameters<C>
): [PromiseResult<T>, () => Promise<PromiseResult<T>>] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, QueryConfig<T, C>>(
    callback,
    cg
  );
  const params: [typeof model, PromiseResult<T>?] =
    model === effectModel ? [model, defaultPromiseResult()] : [model];
  const instance = useModel(...(params as [typeof model, PromiseResult<T>]));
  const { variables, deps, manual: man, strategy } = con || {};
  const manual = !deps && !variables ? true : man;
  const runner = usePromise<T, () => Promise<T>>(() =>
    effectCallback(...(variables || []))
  );
  const keyRef = useRef({});
  const strategyStoreRef = useRef<any>();

  const versionRef = useRef(0);
  const caller = function caller(): Promise<PromiseResult<T>> {
    const version = versionRef.current + 1;
    versionRef.current = version;
    const feedback = function feedback(
      res: PromiseResult<T>
    ): PromiseResult<T> {
      const { state: current, setState } = instance;
      const abandon = version !== versionRef.current;
      const response = (data: PromiseResult<T>): PromiseResult<T> => {
        if (!abandon) {
          setState(data);
        }
        return data;
      };
      if (res.isFetching) {
        return response({
          ...res,
          data: current.data,
          abandon,
          fetchingKey: keyRef.current
        });
      }
      if (res.isError) {
        return response({
          ...current,
          ...res,
          data: current.data,
          abandon,
          fetchingKey: undefined
        });
      }
      return response({ ...res, abandon, fetchingKey: undefined });
    };
    return runner(feedback);
  };

  const callWithStrategy = function callWithStrategy(
    call: () => Promise<PromiseResult<T>>
  ) {
    if (!strategy) {
      return call();
    }
    const getCurrentState = () => instance.state;
    return strategy(getCurrentState, call, strategyStoreRef);
  };

  const effectQuery = function effectQuery() {
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    callWithStrategy(caller);
  };

  const query = function query() {
    return callWithStrategy(caller);
  };

  useLayoutEffect(() => {
    if (manual) {
      return;
    }
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    effectQuery();
  }, deps || variables || []);

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    query();
  }, [instance.version]);

  return [instance.state, query];
}

export function useMutation<T, C extends PromiseEffectCallback<T>>(
  callback: C | ModelPromiseEffectCallback<C>,
  config?: MutationConfig<T, C> | Parameters<C>
): [PromiseResult<T>, () => Promise<PromiseResult<T>>] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, MutationConfig<T, C>>(
    callback,
    cg
  );
  const params: [typeof model, PromiseResult<T>?] =
    model === effectModel ? [model, defaultPromiseResult()] : [model];
  const instance = useModel(...(params as [typeof model, PromiseResult<T>]));
  const { variables, strategy } = con || {};
  const runner = usePromise<T, () => Promise<T>>(() =>
    effectCallback(...(variables || []))
  );

  const strategyStoreRef = useRef<any>();
  const keyRef = useRef({});
  const savingRef = useRef(false);
  const caller = function caller(): Promise<PromiseResult<T>> {
    if (savingRef.current) {
      return new Promise<PromiseResult<T>>(resolve => {
        resolve(instance.state);
      });
    }
    savingRef.current = true;
    const feedback = function feedback(
      res: PromiseResult<T>
    ): PromiseResult<T> {
      const { state: current, setState } = instance;
      if (res.isFetching) {
        return setState({
          ...res,
          data: current.data,
          fetchingKey: keyRef.current
        });
      }
      savingRef.current = false;
      if (res.isError) {
        return setState({
          ...current,
          ...res,
          data: current.data,
          fetchingKey: undefined
        });
      }
      return setState({ ...res, fetchingKey: undefined });
    };
    return runner(feedback);
  };

  const callWithStrategy = function callWithStrategy(
    call: () => Promise<PromiseResult<T>>
  ) {
    if (!strategy) {
      return call();
    }
    const getCurrentState = () => instance.state;
    return strategy(getCurrentState, call, strategyStoreRef);
  };

  const mutate = function mutate() {
    return callWithStrategy(caller);
  };

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    mutate();
  }, [instance.version]);

  return [instance.state, mutate];
}

export function useAsyncEffect<T, C extends PromiseEffectCallback<T>>(
  factory: ModelPromiseEffectCallback<C>
): [PromiseResult<T>, () => void] {
  return useSelector(
    factory,
    s => [s.state, s.trigger] as [PromiseResult<T>, () => void]
  );
}

export const EffectProvider = ModelProvider;

export const withEffectProvider = withModelProvider;

export { asyncEffect } from './model';

export { Strategy } from './strategy';
